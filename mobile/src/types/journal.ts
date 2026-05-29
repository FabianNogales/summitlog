export type JournalVisibility = 'public' | 'private'
export type JournalDifficulty = '' | 'easy' | 'medium' | 'hard'

export interface Journal {
  id: string
  user_id: string
  recorded_trip_id: string
  title: string | null
  content: string | null
  visibility: JournalVisibility
  difficulty?: JournalDifficulty | null
  category?: string | null
  comments_enabled?: boolean
  moderation_status: string
  created_at: string
  updated_at: string
}

export interface JournalMedia {
  id: string
  journal_id: string
  file_path: string
  file_type: string
  sort_order: number
  created_at: string
  updated_at?: string

  local_id?: string
  local_path?: string
  local_journal_id?: string
  remote_id?: string | null
  remote_url?: string | null
  sync_status?: string
}