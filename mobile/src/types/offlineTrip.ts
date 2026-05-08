export type OfflineTripStatus = 'recording' | 'completed' | 'cancelled'
export type OfflineSyncStatus = 'pending' | 'syncing' | 'synced' | 'failed'

export interface OfflineRecordedTrip {
  local_id: string
  remote_id: string | null
  user_id: string
  status: OfflineTripStatus
  sync_status: OfflineSyncStatus
  started_at: string
  ended_at: string | null
  distance_m: number
  duration_s: number
  start_lat: number | null
  start_lng: number | null
  end_lat: number | null
  end_lng: number | null
  created_at: string
  updated_at: string
}

export interface OfflineRecordedTripPoint {
  local_id: string
  local_trip_id: string
  remote_trip_id: string | null
  point_order: number
  latitude: number
  longitude: number
  altitude_m: number | null
  accuracy_m: number | null
  speed_mps: number | null
  heading_deg: number | null
  captured_at: string
  sync_status: OfflineSyncStatus
}