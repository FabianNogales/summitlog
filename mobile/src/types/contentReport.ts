export const CONTENT_REPORT_TARGET_TYPES = ['post', 'comment', 'route'] as const

export type ContentReportTargetType = (typeof CONTENT_REPORT_TARGET_TYPES)[number]

export const CONTENT_REPORT_REASONS = [
  'spam',
  'harassment',
  'dangerous_content',
  'misinformation',
  'offensive_content',
  'other',
] as const

export type ContentReportReason = (typeof CONTENT_REPORT_REASONS)[number]

export interface ContentReport {
  id: string
  reporter_user_id: string
  target_type: ContentReportTargetType | string
  target_id: string
  reason: ContentReportReason | string
  description: string | null
  status: string
  created_at: string
  updated_at: string
}
