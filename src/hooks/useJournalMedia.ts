import { useCallback, useEffect, useMemo, useState } from 'react'
import * as ImagePicker from 'expo-image-picker'
import * as FileSystem from 'expo-file-system/legacy'

import { getOfflineDb } from '../services/offlineDb.service'
import {
  deleteJournalMedia,
  getJournalMediaByJournalId,
  MAX_JOURNAL_IMAGE_SIZE_BYTES,
  MAX_JOURNAL_IMAGE_SIZE_MB,
  MAX_JOURNAL_PHOTOS,
  uploadJournalImage,
} from '../services/journalMedia.service'
import type { JournalMedia } from '../types/journal'

const SUPPORTED_MIME_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png'])
const SUPPORTED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png'])

interface MediaFailure {
  index: number
  fileName: string
  reason: string
}

interface PickImagesResult {
  selectedCount: number
  failedCount: number
  failures: MediaFailure[]
}

interface ApplyPendingMediaResult {
  uploadedCount: number
  deletedCount: number
  failedCount: number
  failures: MediaFailure[]
}

interface UseJournalMediaParams {
  journalId?: string
  mode: 'local' | 'remote'
  userId?: string | null
}

interface OfflineJournalMediaRow {
  local_id: string
  remote_id: string | null
  local_journal_id: string
  local_path: string
  remote_url: string | null
  file_name: string | null
  mime_type: string | null
  sort_order: number
  sync_status: string
  created_at: string
  updated_at: string
}

interface PendingJournalImage {
  id: string
  uri: string
  fileName: string
  mimeType: string | null
  extension: string
}

function createLocalId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function getExtensionFromName(fileName?: string | null) {
  const extension = fileName?.split('.').pop()?.toLowerCase()
  return extension ?? null
}

function getExtensionFromAsset(asset: ImagePicker.ImagePickerAsset) {
  const fileNameExtension = getExtensionFromName(asset.fileName)

  if (fileNameExtension && SUPPORTED_EXTENSIONS.has(fileNameExtension)) {
    return fileNameExtension
  }

  const uriExtension = getExtensionFromName(asset.uri)

  if (uriExtension && SUPPORTED_EXTENSIONS.has(uriExtension)) {
    return uriExtension
  }

  if (asset.mimeType?.toLowerCase() === 'image/png') {
    return 'png'
  }

  return 'jpg'
}

function isSupportedImage(asset: ImagePicker.ImagePickerAsset) {
  const mimeType = asset.mimeType?.toLowerCase() ?? ''
  const extension = getExtensionFromName(asset.fileName) ?? getExtensionFromName(asset.uri)

  if (mimeType && SUPPORTED_MIME_TYPES.has(mimeType)) {
    return true
  }

  if (extension && SUPPORTED_EXTENSIONS.has(extension)) {
    return true
  }

  return false
}

function mapMediaError(error: unknown) {
  const message = error instanceof Error ? error.message : 'No se pudieron guardar las imagenes.'
  const normalized = message.toLowerCase()

  if (normalized.includes('permission')) {
    return 'No se tiene permiso para acceder a la galeria.'
  }

  if (normalized.includes('file')) {
    return 'No se pudo copiar la imagen al almacenamiento local.'
  }

  return message
}

function mapLocalMediaToJournalMedia(row: OfflineJournalMediaRow): JournalMedia {
  return {
    id: row.local_id,
    journal_id: row.local_journal_id,
    file_path: row.local_path,
    file_type: 'image',
    sort_order: row.sort_order,
    created_at: row.created_at,
    updated_at: row.updated_at,
    local_id: row.local_id,
    local_journal_id: row.local_journal_id,
    local_path: row.local_path,
    remote_id: row.remote_id,
    remote_url: row.remote_url,
    sync_status: row.sync_status,
  } as JournalMedia
}

function mapPendingImageToJournalMedia(
  image: PendingJournalImage,
  journalId: string | undefined,
  sortOrder: number
): JournalMedia {
  return {
    id: image.id,
    journal_id: journalId ?? 'pending-journal',
    file_path: image.uri,
    file_type: 'image',
    sort_order: sortOrder,
    created_at: new Date().toISOString(),
    local_id: image.id,
    local_path: image.uri,
    sync_status: 'pending',
  } as JournalMedia
}

async function ensureJournalMediaDirectory(journalLocalId: string) {
  const baseDirectory = FileSystem.documentDirectory

  if (!baseDirectory) {
    throw new Error('No se pudo acceder al almacenamiento interno del dispositivo.')
  }

  const directory = `${baseDirectory}journal-media/${journalLocalId}/`

  await FileSystem.makeDirectoryAsync(directory, {
    intermediates: true,
  })

  return directory
}

async function getAssetSize(asset: ImagePicker.ImagePickerAsset) {
  if (typeof asset.fileSize === 'number') {
    return asset.fileSize
  }

  const info = await FileSystem.getInfoAsync(asset.uri)

  if (info.exists && typeof (info as any).size === 'number') {
    return (info as any).size as number
  }

  return 0
}

export function useJournalMedia(params?: UseJournalMediaParams) {
  const journalId = params?.journalId
  const mode = params?.mode ?? 'local'
  const userId = params?.userId ?? null

  const [persistedMedia, setPersistedMedia] = useState<JournalMedia[]>([])
  // Altas y bajas se mantienen pendientes hasta guardar para coordinar SQLite, Storage y Supabase.
  const [pendingNewImages, setPendingNewImages] = useState<PendingJournalImage[]>([])
  const [pendingDeletedMediaIds, setPendingDeletedMediaIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pendingDeletedMediaIdSet = useMemo(
    () => new Set(pendingDeletedMediaIds),
    [pendingDeletedMediaIds]
  )

  const visiblePersistedMedia = useMemo(
    () => persistedMedia.filter((item) => !pendingDeletedMediaIdSet.has(item.id)),
    [pendingDeletedMediaIdSet, persistedMedia]
  )

  const media = useMemo(
    () => [
      ...visiblePersistedMedia,
      ...pendingNewImages.map((image, index) =>
        mapPendingImageToJournalMedia(image, journalId, visiblePersistedMedia.length + index)
      ),
    ],
    [journalId, pendingNewImages, visiblePersistedMedia]
  )

  const pendingNewImageIds = useMemo(
    () => pendingNewImages.map((image) => image.id),
    [pendingNewImages]
  )

  const mediaDirty = pendingNewImages.length > 0 || pendingDeletedMediaIds.length > 0

  const loadMediaForJournalId = useCallback(async (targetJournalId?: string) => {
    if (!targetJournalId) {
      setPersistedMedia([])
      setPendingDeletedMediaIds([])
      setError(null)
      return
    }

    try {
      setLoading(true)
      setError(null)

      if (mode === 'remote') {
        const remoteMedia = await getJournalMediaByJournalId(targetJournalId)
        setPersistedMedia(remoteMedia)
        setPendingDeletedMediaIds((prev) =>
          prev.filter((id) => remoteMedia.some((item) => item.id === id))
        )
        return
      }

      const db = await getOfflineDb()

      const rows = await db.getAllAsync<OfflineJournalMediaRow>(
        `
          SELECT *
          FROM offline_journal_media
          WHERE local_journal_id = ?
          ORDER BY sort_order ASC, created_at ASC
        `,
        [targetJournalId]
      )

      const localMedia = rows.map(mapLocalMediaToJournalMedia)
      setPersistedMedia(localMedia)
      setPendingDeletedMediaIds((prev) =>
        prev.filter((id) => localMedia.some((item) => item.id === id))
      )
    } catch (loadError: any) {
      setError(loadError?.message ?? 'No se pudieron cargar las fotos de la bitacora.')
      setPersistedMedia([])
    } finally {
      setLoading(false)
    }
  }, [mode])

  const loadMedia = useCallback(async () => {
    await loadMediaForJournalId(journalId)
  }, [journalId, loadMediaForJournalId])

  useEffect(() => {
    loadMedia()
  }, [loadMedia])

  useEffect(() => {
    setPendingDeletedMediaIds([])
  }, [journalId, mode])

  async function pickAndStageImages(): Promise<PickImagesResult> {
    const remainingSlots = MAX_JOURNAL_PHOTOS - media.length

    if (remainingSlots <= 0) {
      throw new Error(`Esta bitacora ya tiene el maximo de ${MAX_JOURNAL_PHOTOS} fotos.`)
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()

    if (!permission.granted) {
      throw new Error(
        'Se necesita permiso para acceder a la galeria. Habilitalo desde configuracion del dispositivo.'
      )
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
      allowsEditing: false,
      selectionLimit: remainingSlots,
    })

    if (result.canceled || !result.assets?.length) {
      return { selectedCount: 0, failedCount: 0, failures: [] }
    }

    const selectedAssets = result.assets.slice(0, remainingSlots)
    const stagedImages: PendingJournalImage[] = []
    const failures: MediaFailure[] = []

    for (let index = 0; index < selectedAssets.length; index += 1) {
      const asset = selectedAssets[index]
      const fileName = asset.fileName?.trim() || `imagen-${Date.now()}-${index + 1}.jpg`

      try {
        if (!isSupportedImage(asset)) {
          throw new Error('Solo se permiten imagenes JPG o PNG.')
        }

        const fileSize = await getAssetSize(asset)

        if (fileSize > MAX_JOURNAL_IMAGE_SIZE_BYTES) {
          throw new Error(`Cada imagen debe pesar menos de ${MAX_JOURNAL_IMAGE_SIZE_MB} MB.`)
        }

        stagedImages.push({
          id: createLocalId('pending-media'),
          uri: asset.uri,
          fileName,
          mimeType: asset.mimeType ?? null,
          extension: getExtensionFromAsset(asset),
        })
      } catch (itemError) {
        failures.push({
          index: index + 1,
          fileName,
          reason: mapMediaError(itemError),
        })
      }
    }

    if (stagedImages.length > 0) {
      setPendingNewImages((prev) => [...prev, ...stagedImages])
      setError(null)
    }

    return {
      selectedCount: stagedImages.length,
      failedCount: failures.length,
      failures,
    }
  }

  async function removeMedia(item: JournalMedia) {
    if (pendingNewImages.some((image) => image.id === item.id)) {
      setPendingNewImages((prev) => prev.filter((image) => image.id !== item.id))
      return
    }

    setPendingDeletedMediaIds((prev) =>
      prev.includes(item.id) ? prev : [...prev, item.id]
    )
    setError(null)
  }

  async function applyLocalPendingMediaChanges(
    finalJournalId: string
  ): Promise<ApplyPendingMediaResult> {
    const db = await getOfflineDb()
    const mediaToDelete = persistedMedia.filter((item) =>
      pendingDeletedMediaIds.includes(item.id)
    )
    let deletedCount = 0

    for (const item of mediaToDelete) {
      const row = await db.getFirstAsync<OfflineJournalMediaRow>(
        `
          SELECT *
          FROM offline_journal_media
          WHERE local_id = ?
          AND local_journal_id = ?
        `,
        [item.id, finalJournalId]
      )

      if (!row) {
        continue
      }

      await db.runAsync(
        `
          DELETE FROM offline_journal_media
          WHERE local_id = ?
          AND local_journal_id = ?
        `,
        [item.id, finalJournalId]
      )

      const fileInfo = await FileSystem.getInfoAsync(row.local_path)

      if (fileInfo.exists) {
        await FileSystem.deleteAsync(row.local_path, {
          idempotent: true,
        })
      }

      deletedCount += 1
    }

    const directory = pendingNewImages.length
      ? await ensureJournalMediaDirectory(finalJournalId)
      : null
    const failures: MediaFailure[] = []
    const uploadedImageIds = new Set<string>()
    let uploadedCount = 0
    // Las nuevas fotos continúan el orden visible después de descontar las eliminaciones pendientes.
    let sortBase = persistedMedia.length - deletedCount

    for (let index = 0; index < pendingNewImages.length; index += 1) {
      const image = pendingNewImages[index]

      try {
        if (!directory) {
          throw new Error('No se encontro el directorio de fotos.')
        }

        const localId = createLocalId('media')
        const finalFileName = `${localId}.${image.extension}`
        const localPath = `${directory}${finalFileName}`
        const now = new Date().toISOString()

        await FileSystem.copyAsync({
          from: image.uri,
          to: localPath,
        })

        await db.runAsync(
          `
            INSERT INTO offline_journal_media (
              local_id,
              remote_id,
              local_journal_id,
              local_path,
              remote_url,
              file_name,
              mime_type,
              sort_order,
              sync_status,
              created_at,
              updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            localId,
            null,
            finalJournalId,
            localPath,
            null,
            image.fileName,
            image.mimeType ?? (image.extension === 'png' ? 'image/png' : 'image/jpeg'),
            sortBase,
            'pending',
            now,
            now,
          ]
        )

        uploadedCount += 1
        sortBase += 1
        uploadedImageIds.add(image.id)
      } catch (itemError) {
        failures.push({
          index: index + 1,
          fileName: image.fileName,
          reason: mapMediaError(itemError),
        })
      }
    }

    if (deletedCount > 0 || uploadedCount > 0) {
      await db.runAsync(
        `
          UPDATE offline_journals
          SET sync_status = ?, updated_at = ?
          WHERE local_id = ?
        `,
        ['pending', new Date().toISOString(), finalJournalId]
      )
    }

    setPendingNewImages((prev) => prev.filter((image) => !uploadedImageIds.has(image.id)))
    setPendingDeletedMediaIds([])
    await loadMediaForJournalId(finalJournalId)

    return {
      uploadedCount,
      deletedCount,
      failedCount: failures.length,
      failures,
    }
  }

  async function applyRemotePendingMediaChanges(
    finalJournalId: string
  ): Promise<ApplyPendingMediaResult> {
    if (!userId) {
      throw new Error('Debes iniciar sesion.')
    }

    const mediaToDelete = persistedMedia.filter((item) =>
      pendingDeletedMediaIds.includes(item.id)
    )
    let deletedCount = 0

    for (const item of mediaToDelete) {
      await deleteJournalMedia({
        mediaId: item.id,
        journalId: finalJournalId,
        filePath: item.file_path,
      })
      deletedCount += 1
    }

    const failures: MediaFailure[] = []
    const uploadedImageIds = new Set<string>()
    let uploadedCount = 0
    let sortBase = persistedMedia.length - deletedCount

    for (let index = 0; index < pendingNewImages.length; index += 1) {
      const image = pendingNewImages[index]

      try {
        await uploadJournalImage({
          journalId: finalJournalId,
          userId,
          fileUri: image.uri,
          fileName: image.fileName,
          mimeType: image.mimeType,
          sortOrder: sortBase,
        })

        uploadedCount += 1
        sortBase += 1
        uploadedImageIds.add(image.id)
      } catch (itemError) {
        failures.push({
          index: index + 1,
          fileName: image.fileName,
          reason: mapMediaError(itemError),
        })
      }
    }

    setPendingNewImages((prev) => prev.filter((image) => !uploadedImageIds.has(image.id)))
    setPendingDeletedMediaIds([])
    await loadMediaForJournalId(finalJournalId)

    return {
      uploadedCount,
      deletedCount,
      failedCount: failures.length,
      failures,
    }
  }

  async function applyPendingMediaChanges(
    finalJournalId = journalId
  ): Promise<ApplyPendingMediaResult> {
    if (!finalJournalId) {
      throw new Error('Primero debes guardar la bitacora.')
    }

    if (!mediaDirty) {
      return {
        uploadedCount: 0,
        deletedCount: 0,
        failedCount: 0,
        failures: [],
      }
    }

    try {
      setUploading(true)
      setError(null)

      if (mode === 'remote') {
        return await applyRemotePendingMediaChanges(finalJournalId)
      }

      return await applyLocalPendingMediaChanges(finalJournalId)
    } finally {
      setUploading(false)
    }
  }

  function resetPendingMediaChanges() {
    setPendingNewImages([])
    setPendingDeletedMediaIds([])
  }

  return {
    media,
    existingMedia: persistedMedia,
    pendingNewImages,
    pendingNewImageIds,
    pendingDeletedMediaIds,
    loading,
    uploading,
    error,
    deletingMediaIds: pendingDeletedMediaIds,
    mediaDirty,
    pickAndStageImages,
    pickAndUploadImages: pickAndStageImages,
    removeMedia,
    applyPendingMediaChanges,
    resetPendingMediaChanges,
    refreshMedia: loadMedia,
    maxPhotos: MAX_JOURNAL_PHOTOS,
  }
}
