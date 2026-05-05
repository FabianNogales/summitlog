export type JournalVisibility = 'public' | 'private'

export interface Journal {
  id: string
  user_id: string
  recorded_trip_id: string
  title: string | null
  content: string | null
  visibility: JournalVisibility
  moderation_status: string
  created_at: string
  updated_at: string
}