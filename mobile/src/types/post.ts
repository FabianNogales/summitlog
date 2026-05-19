export interface SocialPostAuthor {
  username: string | null
  full_name: string | null
  avatar_url: string | null
}

export interface SocialPost {
  id: string
  user_id: string
  content: string
  moderation_status: string
  created_at: string
  updated_at: string
  author?: SocialPostAuthor | null
}
