import type { SocialPostAuthor } from './post'

export interface SocialPostComment {
  id: string
  post_id: string | null
  route_id: string | null
  user_id: string
  content: string
  moderation_status: string
  created_at: string
  updated_at: string
  author?: SocialPostAuthor | null
}
