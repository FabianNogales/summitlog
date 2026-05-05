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

export interface RoutePoint {
  id: number
  route_id: string
  point_order: number
  latitude: number
  longitude: number
  altitude_m: number | null
  captured_at: string | null
}

export interface RouteReport {
  id: string
  route_id: string
  user_id: string
  report_type: string
  description: string | null
  latitude: number | null
  longitude: number | null
  photo_path: string | null
  report_status: string
  moderation_status: string
  created_at: string
  updated_at: string
}