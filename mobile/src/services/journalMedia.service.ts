import { supabase } from '../lib/supabase'
import type { JournalMedia } from '../types/journal'
import * as FileSystem from 'expo-file-system/legacy'
import { decode as decodeBase64 } from 'base64-arraybuffer'

const JOURNAL_MEDIA_BUCKET = 'journal-media'

export const MAX_JOURNAL_PHOTOS = 6
export const MAX_JOURNAL_IMAGE_SIZE_MB = 20
export const MAX_JOURNAL_IMAGE_SIZE_BYTES = MAX_JOURNAL_IMAGE_SIZE_MB * 1024 * 1024

export async function getJournalMediaByJournalId(journalId: string) {
  const { data, error } = await supabase
    .from('journal_media')
    .select('*')
    .eq('journal_id', journalId)
    .order('sort_order', { ascending: true })

  if (error) {
    throw error
  }

  return (data ?? []) as JournalMedia[]
}

interface UploadJournalImageParams {
  journalId: string
  userId: string
  fileUri: string
  fileName?: string | null
  mimeType?: string | null
  sortOrder: number
}

interface DeleteJournalMediaParams {
  mediaId: string
  journalId: string
  filePath?: string | null
}

interface DeleteJournalMediaResult {
  orphanedFilePath: string | null
  storageDeleted: boolean
}

function resolveContentType(mimeType?: string | null, extension?: string | null) {
  const normalizedMime = mimeType?.toLowerCase()

  if (normalizedMime === 'image/png') {
    return 'image/png'
  }

  if (normalizedMime === 'image/jpeg' || normalizedMime === 'image/jpg') {
    return 'image/jpeg'
  }

  if (extension === 'png') {
    return 'image/png'
  }

  return 'image/jpeg'
}

export async function uploadJournalImage(params: UploadJournalImageParams) {
  const extension =
    params.fileName?.split('.').pop()?.toLowerCase() ||
    (params.mimeType?.includes('png') ? 'png' : 'jpg')

  const path = `${params.userId}/${params.journalId}/${Date.now()}-${params.sortOrder}.${extension}`
  const contentType = resolveContentType(params.mimeType, extension)

  let base64Content: string
  let arrayBuffer: ArrayBuffer

  try {
    base64Content = await FileSystem.readAsStringAsync(params.fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    })
  } catch {
    throw new Error('No se pudo leer el archivo de imagen seleccionado.')
  }

  try {
    arrayBuffer = decodeBase64(base64Content)
    if (!arrayBuffer.byteLength) {
      throw new Error('empty-array-buffer')
    }
  } catch {
    throw new Error('No se pudo convertir la imagen seleccionada.')
  }

  const { error: uploadError } = await supabase.storage
    .from(JOURNAL_MEDIA_BUCKET)
    .upload(path, arrayBuffer, {
      contentType,
      upsert: false,
    })

  if (uploadError) {
    throw uploadError
  }

  const { data, error } = await supabase
    .from('journal_media')
    .insert({
      journal_id: params.journalId,
      file_path: path,
      file_type: 'image',
      sort_order: params.sortOrder,
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  return data as JournalMedia
}

export async function deleteJournalMedia(
  params: DeleteJournalMediaParams
): Promise<DeleteJournalMediaResult> {
  const normalizedPath = params.filePath?.trim() ?? ''

  const { error: deleteRowError } = await supabase
    .from('journal_media')
    .delete()
    .eq('id', params.mediaId)
    .eq('journal_id', params.journalId)

  if (deleteRowError) {
    throw new Error(deleteRowError.message ?? 'No se pudo eliminar la foto de la bitácora.')
  }

  if (!normalizedPath) {
    return { orphanedFilePath: null, storageDeleted: false }
  }

  const { error: deleteStorageError } = await supabase.storage
    .from(JOURNAL_MEDIA_BUCKET)
    .remove([normalizedPath])

  if (deleteStorageError) {
    return {
      orphanedFilePath: normalizedPath,
      storageDeleted: false,
    }
  }

  return { orphanedFilePath: null, storageDeleted: true }
}

export function getJournalMediaPublicUrl(filePath?: string | null) {
  const normalizedPath = filePath?.trim() ?? ''

  if (!normalizedPath) {
    return ''
  }

  if (
    normalizedPath.startsWith('file://') ||
    normalizedPath.startsWith('content://') ||
    normalizedPath.startsWith('http://') ||
    normalizedPath.startsWith('https://')
  ) {
    return normalizedPath
  }

  const { data } = supabase.storage.from(JOURNAL_MEDIA_BUCKET).getPublicUrl(normalizedPath)

  return data.publicUrl
}