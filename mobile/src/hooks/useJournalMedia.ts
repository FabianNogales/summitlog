import { useCallback, useEffect, useState } from 'react'
import * as ImagePicker from 'expo-image-picker'

import { useAuth } from './useAuth'
import {
  getJournalMediaByJournalId,
  uploadJournalImage,
} from '../services/journalMedia.service'
import type { JournalMedia } from '../types/journal'

const SUPPORTED_MIME_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png'])
const SUPPORTED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png'])
const MAX_JOURNAL_IMAGE_SIZE_MB = 20
const MAX_JOURNAL_IMAGE_SIZE_BYTES = MAX_JOURNAL_IMAGE_SIZE_MB * 1024 * 1024

interface PickAndUploadResult {
  uploadedCount: number
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
  const message =
    error instanceof Error ? error.message : 'No se pudieron subir las imagenes.'

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

  const loadMedia = useCallback(async () => {
    if (!journalId) {
      setMedia([])
      return
    }

    try {
      setLoading(true)
      const loadedMedia = await getJournalMediaByJournalId(journalId)
      console.log('[JournalMedia] loaded media count', loadedMedia.length)
      setMedia(loadedMedia)
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
      selectionLimit: 5,
    })

    if (result.canceled || !result.assets?.length) {
      return { uploadedCount: 0 }
    }

    try {
      setUploading(true)

      let sortBase = media.length
      let uploadedCount = 0

      for (const asset of result.assets) {
        if (!isSupportedImage(asset)) {
          throw new Error('Solo se permiten imagenes JPG o PNG.')
        }

        if ((asset.fileSize ?? 0) > MAX_JOURNAL_IMAGE_SIZE_BYTES) {
          throw new Error(
            `Cada imagen debe pesar menos de ${MAX_JOURNAL_IMAGE_SIZE_MB} MB.`
          )
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
      }

      await loadMedia()
      return { uploadedCount }
    } catch (error) {
      throw new Error(mapUploadError(error))
    } finally {
      setUploading(false)
    }
  }

  return {
    media,
    loading,
    uploading,
    pickAndUploadImages,
    refreshMedia: loadMedia,
  }
}
