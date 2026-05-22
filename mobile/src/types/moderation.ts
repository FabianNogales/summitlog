export interface ModerationContentReport {
  id: string
  reporter_user_id: string
  target_type: string
  target_id: string
  reason: string
  description: string | null
  status: string
  created_at: string
  updated_at: string
}

export type ModerationStatusFilter = 'all' | string
