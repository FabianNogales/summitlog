export type RoutePublicationStatus = 'draft' | 'published' | 'archived'

export interface RouteItem {
  id: string
  user_id: string
  source_recorded_trip_id: string
  publication_status: RoutePublicationStatus
  title: string
  description: string | null
  category: string | null
  difficulty: string | null
  cover_image_url: string | null
  distance_m: number
  duration_s: number
  elevation_gain_m: number | null
  start_lat: number | null
  start_lng: number | null
  end_lat: number | null
  end_lng: number | null
  comments_enabled: boolean
  published_at: string | null
  created_at: string
  updated_at: string
}