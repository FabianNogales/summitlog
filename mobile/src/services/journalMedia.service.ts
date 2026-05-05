import { supabase } from '../lib/supabase'
import type { JournalMedia } from '../types/journal'

const JOURNAL_MEDIA_BUCKET = 'journal-media'

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

export async function uploadJournalImage(params: UploadJournalImageParams) {
  const extension =
    params.fileName?.split('.').pop()?.toLowerCase() ||
    (params.mimeType?.includes('png') ? 'png' : 'jpg')

  const path = `${params.userId}/${params.journalId}/${Date.now()}-${params.sortOrder}.${extension}`

  const response = await fetch(params.fileUri)
  const blob = await response.blob()

  const { error: uploadError } = await supabase.storage
    .from(JOURNAL_MEDIA_BUCKET)
    .upload(path, blob, {
      contentType: params.mimeType ?? 'image/jpeg',
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

export function getJournalMediaPublicUrl(filePath: string) {
  const { data } = supabase.storage
    .from(JOURNAL_MEDIA_BUCKET)
    .getPublicUrl(filePath)

  return data.publicUrl
}