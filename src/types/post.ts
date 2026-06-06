export interface SocialPostAuthor {
  username: string | null
  full_name: string | null
  avatar_url: string | null
}

export interface SocialPostMedia {
  id: string
  post_id: string
  file_path: string
  file_type: string
  sort_order: number
  created_at: string
}

export interface SocialPost {
  id: string
  user_id: string
  content: string
  moderation_status: string
  created_at: string
  updated_at: string
  author?: SocialPostAuthor | null
  media?: SocialPostMedia[]
}
