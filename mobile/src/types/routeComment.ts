import type { SocialPostAuthor } from './post'

export interface RouteComment {
  id: string
  route_id: string | null
  post_id: string | null
  user_id: string
  content: string
  moderation_status: string
  created_at: string
  updated_at: string
  author?: SocialPostAuthor | null
}
