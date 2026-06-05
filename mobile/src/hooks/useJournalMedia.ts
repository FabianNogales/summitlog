import { useCallback, useEffect, useState } from 'react'
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

interface PickAndUploadResult {
  uploadedCount: number
  failedCount: number
  failures: MediaFailure[]
}

interface RemoveMediaResult {
  orphanedFilePath: string | null
  storageDeleted: boolean
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

function mapUploadError(error: unknown) {
  const message = error instanceof Error ? error.message : 'No se pudieron guardar las imágenes.'
  const normalized = message.toLowerCase()

  if (normalized.includes('permission')) {
    return 'No se tiene permiso para acceder a la galería.'
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

  const [media, setMedia] = useState<JournalMedia[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deletingMediaIds, setDeletingMediaIds] = useState<string[]>([])

  const loadMedia = useCallback(async () => {
    if (!journalId) {
      setMedia([])
      setError(null)
      return
    }

    try {
      setLoading(true)
      setError(null)

      if (mode === 'remote') {
        const remoteMedia = await getJournalMediaByJournalId(journalId)
        setMedia(remoteMedia)
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
        [journalId]
      )

      setMedia(rows.map(mapLocalMediaToJournalMedia))
    } catch (loadError: any) {
      setError(loadError?.message ?? 'No se pudieron cargar las fotos de la bitácora.')
      setMedia([])
    } finally {
      setLoading(false)
    }
  }, [journalId, mode])

  useEffect(() => {
    loadMedia()
  }, [loadMedia])

  async function pickAndUploadImages(): Promise<PickAndUploadResult> {
    if (!journalId) {
      throw new Error('Primero debes guardar la bitácora.')
    }

    const remainingSlots = MAX_JOURNAL_PHOTOS - media.length

    if (remainingSlots <= 0) {
      throw new Error(`Esta bitácora ya tiene el máximo de ${MAX_JOURNAL_PHOTOS} fotos.`)
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()

    if (!permission.granted) {
      throw new Error(
        'Se necesita permiso para acceder a la galería. Habilítalo desde configuración del dispositivo.'
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
      return { uploadedCount: 0, failedCount: 0, failures: [] }
    }

    const selectedAssets = result.assets.slice(0, remainingSlots)

    try {
      setUploading(true)
      setError(null)

      if (mode === 'remote') {
        if (!userId) {
          throw new Error('Debes iniciar sesión.')
        }

        let uploadedCount = 0
        const failures: MediaFailure[] = []
        let sortBase = media.length

        for (let index = 0; index < selectedAssets.length; index += 1) {
          const asset = selectedAssets[index]
          const fileName = asset.fileName?.trim() || `imagen-${Date.now()}-${index + 1}.jpg`

          try {
            if (!isSupportedImage(asset)) {
              throw new Error('Solo se permiten imágenes JPG o PNG.')
            }

            const fileSize = await getAssetSize(asset)

            if (fileSize > MAX_JOURNAL_IMAGE_SIZE_BYTES) {
              throw new Error(`Cada imagen debe pesar menos de ${MAX_JOURNAL_IMAGE_SIZE_MB} MB.`)
            }

            await uploadJournalImage({
              journalId,
              userId,
              fileUri: asset.uri,
              fileName,
              mimeType: asset.mimeType,
              sortOrder: sortBase,
            })

            uploadedCount += 1
            sortBase += 1
          } catch (itemError) {
            failures.push({
              index: index + 1,
              fileName,
              reason: mapUploadError(itemError),
            })
          }
        }

        if (uploadedCount > 0) {
          await loadMedia()
        }

        return {
          uploadedCount,
          failedCount: failures.length,
          failures,
        }
      }

      const db = await getOfflineDb()
      const directory = await ensureJournalMediaDirectory(journalId)

      let uploadedCount = 0
      const failures: MediaFailure[] = []
      let sortBase = media.length

      for (let index = 0; index < selectedAssets.length; index += 1) {
        const asset = selectedAssets[index]
        const fileName = asset.fileName?.trim() || `imagen-${Date.now()}-${index + 1}.jpg`

        try {
          if (!isSupportedImage(asset)) {
            throw new Error('Solo se permiten imágenes JPG o PNG.')
          }

          const fileSize = await getAssetSize(asset)

          if (fileSize > MAX_JOURNAL_IMAGE_SIZE_BYTES) {
            throw new Error(`Cada imagen debe pesar menos de ${MAX_JOURNAL_IMAGE_SIZE_MB} MB.`)
          }

          const localId = createLocalId('media')
          const extension = getExtensionFromAsset(asset)
          const finalFileName = `${localId}.${extension}`
          const localPath = `${directory}${finalFileName}`
          const now = new Date().toISOString()

          await FileSystem.copyAsync({
            from: asset.uri,
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
              journalId,
              localPath,
              null,
              fileName,
              asset.mimeType ?? (extension === 'png' ? 'image/png' : 'image/jpeg'),
              sortBase,
              'pending',
              now,
              now,
            ]
          )

          await db.runAsync(
            `
              UPDATE offline_journals
              SET sync_status = ?, updated_at = ?
              WHERE local_id = ?
            `,
            ['pending', now, journalId]
          )

          uploadedCount += 1
          sortBase += 1
        } catch (itemError) {
          failures.push({
            index: index + 1,
            fileName,
            reason: mapUploadError(itemError),
          })
        }
      }

      if (uploadedCount > 0) {
        await loadMedia()
      }

      return {
        uploadedCount,
        failedCount: failures.length,
        failures,
      }
    } finally {
      setUploading(false)
    }
  }

  async function removeMedia(item: JournalMedia): Promise<RemoveMediaResult> {
    if (!journalId) {
      throw new Error('No se encontró la bitácora para eliminar la foto.')
    }

    setDeletingMediaIds((prev) => [...prev, item.id])
    setError(null)

    try {
      if (mode === 'remote') {
        const result = await deleteJournalMedia({
          mediaId: item.id,
          journalId,
          filePath: item.file_path,
        })

        await loadMedia()

        return result
      }

      const db = await getOfflineDb()

      const row = await db.getFirstAsync<OfflineJournalMediaRow>(
        `
          SELECT *
          FROM offline_journal_media
          WHERE local_id = ?
          AND local_journal_id = ?
        `,
        [item.id, journalId]
      )

      if (!row) {
        throw new Error('No se encontró la foto local.')
      }

      await db.runAsync(
        `
          DELETE FROM offline_journal_media
          WHERE local_id = ?
          AND local_journal_id = ?
        `,
        [item.id, journalId]
      )

      const fileInfo = await FileSystem.getInfoAsync(row.local_path)

      if (fileInfo.exists) {
        await FileSystem.deleteAsync(row.local_path, {
          idempotent: true,
        })
      }

      await loadMedia()

      return {
        orphanedFilePath: null,
        storageDeleted: true,
      }
    } catch (removeError: any) {
      throw new Error(removeError?.message ?? 'No se pudo eliminar la foto de la bitácora.')
    } finally {
      setDeletingMediaIds((prev) => prev.filter((id) => id !== item.id))
    }
  }

  return {
    media,
    loading,
    uploading,
    error,
    deletingMediaIds,
    pickAndUploadImages,
    removeMedia,
    refreshMedia: loadMedia,
    maxPhotos: MAX_JOURNAL_PHOTOS,
  }
}