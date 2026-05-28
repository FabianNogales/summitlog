import { useCallback, useEffect, useState } from 'react'
import * as ImagePicker from 'expo-image-picker'

import { useAuth } from './useAuth'
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

function getExtensionFromName(fileName?: string | null) {
  const extension = fileName?.split('.').pop()?.toLowerCase()
  return extension ?? null
}

function isSupportedImage(asset: ImagePicker.ImagePickerAsset) {
  const mimeType = asset.mimeType?.toLowerCase() ?? ''
  const extension = getExtensionFromName(asset.fileName)

  if (mimeType && SUPPORTED_MIME_TYPES.has(mimeType)) {
    return true
  }

  if (extension && SUPPORTED_EXTENSIONS.has(extension)) {
    return true
  }

  return false
}

function mapUploadError(error: unknown) {
  const message = error instanceof Error ? error.message : 'No se pudieron subir las imagenes.'
  const normalized = message.toLowerCase()

  if (normalized.includes('bucket') && normalized.includes('not found')) {
    return 'No se encontro el bucket de fotos "journal-media".'
  }

  if (
    normalized.includes('row-level security') ||
    normalized.includes('permission denied') ||
    normalized.includes('not allowed')
  ) {
    return 'No tienes permisos para subir fotos en Storage.'
  }

  if (normalized.includes('network')) {
    return 'No se pudo subir la foto por un problema de red.'
  }

  return message
}

export function useJournalMedia(journalId?: string) {
  const { user } = useAuth()

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
      const loadedMedia = await getJournalMediaByJournalId(journalId)
      setMedia(loadedMedia)
    } catch (loadError: any) {
      setError(loadError?.message ?? 'No se pudieron cargar las fotos de la bitacora.')
      setMedia([])
    } finally {
      setLoading(false)
    }
  }, [journalId])

  useEffect(() => {
    loadMedia()
  }, [loadMedia])

  async function pickAndUploadImages(): Promise<PickAndUploadResult> {
    if (!journalId) {
      throw new Error('Primero debes guardar la bitacora.')
    }

    if (!user) {
      throw new Error('Debes iniciar sesion.')
    }

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
      return { uploadedCount: 0, failedCount: 0, failures: [] }
    }

    const selectedAssets = result.assets.slice(0, remainingSlots)

    try {
      setUploading(true)
      setError(null)

      let sortBase = media.length
      let uploadedCount = 0
      const failures: MediaFailure[] = []

      for (let index = 0; index < selectedAssets.length; index += 1) {
        const asset = selectedAssets[index]
        const fileName = asset.fileName?.trim() || `Imagen ${index + 1}`

        try {
          if (!isSupportedImage(asset)) {
            throw new Error('Solo se permiten imagenes JPG o PNG.')
          }

          if ((asset.fileSize ?? 0) > MAX_JOURNAL_IMAGE_SIZE_BYTES) {
            throw new Error(`Cada imagen debe pesar menos de ${MAX_JOURNAL_IMAGE_SIZE_MB} MB.`)
          }

          await uploadJournalImage({
            journalId,
            userId: user.id,
            fileUri: asset.uri,
            fileName: asset.fileName ?? null,
            mimeType: asset.mimeType ?? null,
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
    } finally {
      setUploading(false)
    }
  }

  async function removeMedia(item: JournalMedia): Promise<RemoveMediaResult> {
    if (!journalId) {
      throw new Error('No se encontro la bitacora para eliminar la foto.')
    }

    setDeletingMediaIds((prev) => [...prev, item.id])
    setError(null)

    try {
      const result = await deleteJournalMedia({
        mediaId: item.id,
        journalId,
        filePath: item.file_path,
      })

      await loadMedia()
      return result
    } catch (removeError: any) {
      throw new Error(removeError?.message ?? 'No se pudo eliminar la foto de la bitacora.')
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
