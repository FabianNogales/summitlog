export type AppRole = 'user' | 'moderator' | 'admin'

export interface Profile {
  id: string
  username: string 
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  role: AppRole
  is_active: boolean
  created_at: string
  updated_at: string
}