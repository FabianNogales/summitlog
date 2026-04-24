export type TripStatus = 'recording' | 'completed' | 'cancelled'

export interface RecordedTrip {
  id: string
  user_id: string
  status: TripStatus
  is_private: boolean
  title: string | null
  summary: string | null
  started_at: string
  ended_at: string | null
  distance_m: number
  duration_s: number
  elevation_gain_m: number | null
  avg_speed_mps: number | null
  max_speed_mps: number | null
  start_lat: number | null
  start_lng: number | null
  end_lat: number | null
  end_lng: number | null
  created_at: string
  updated_at: string
}

export interface RecordedTripPoint {
  id: number
  recorded_trip_id: string
  point_order: number
  latitude: number
  longitude: number
  altitude_m: number | null
  accuracy_m: number | null
  speed_mps: number | null
  heading_deg: number | null
  captured_at: string
  created_at: string
}