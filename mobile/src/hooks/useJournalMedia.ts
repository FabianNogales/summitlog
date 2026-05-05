import { useCallback, useEffect, useState } from 'react'
import * as ImagePicker from 'expo-image-picker'

import { useAuth } from './useAuth'
import {
  getJournalMediaByJournalId,
  uploadJournalImage,
} from '../services/journalMedia.service'
import type { JournalMedia } from '../types/journal'

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
      setMedia(loadedMedia)
    } finally {
      setLoading(false)
    }
  }, [journalId])

  useEffect(() => {
    loadMedia()
  }, [loadMedia])

  async function pickAndUploadImages() {
    if (!journalId) {
      throw new Error('Primero debes guardar la bitácora.')
    }

    if (!user) {
      throw new Error('Debes iniciar sesión.')
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()

    if (!permission.granted) {
      throw new Error('Se necesita permiso para acceder a la galería.')
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
      allowsEditing: false,
      selectionLimit: 5,
    })

    if (result.canceled || !result.assets?.length) {
      return
    }

    try {
      setUploading(true)

      let sortBase = media.length

      for (const asset of result.assets) {
        await uploadJournalImage({
          journalId,
          userId: user.id,
          fileUri: asset.uri,
          fileName: asset.fileName ?? null,
          mimeType: asset.mimeType ?? null,
          sortOrder: sortBase,
        })

        sortBase += 1
      }

      await loadMedia()
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