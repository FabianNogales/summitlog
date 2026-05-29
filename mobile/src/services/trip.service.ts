import { supabase } from '../lib/supabase'
import type { RecordedTrip, RecordedTripPoint } from '../types/trip'

interface CreateRecordedTripParams {
  userId: string
  startLat: number
  startLng: number
}

interface CreateRecordedTripPointParams {
  recordedTripId: string
  pointOrder: number
  latitude: number
  longitude: number
  altitudeM?: number | null
  accuracyM?: number | null
  speedMps?: number | null
  headingDeg?: number | null
  capturedAt?: string
}

interface FinishRecordedTripParams {
  recordedTripId: string
  endedAt: string
  durationS: number
  distanceM: number
  elevationGainM?: number
  endLat: number
  endLng: number
}

interface CreateRecordedTripFromOfflineParams {
  userId: string
  status: 'recording' | 'completed' | 'cancelled'
  startedAt: string
  endedAt?: string | null
  distanceM: number
  durationS: number
  elevationGainM: number
  startLat: number | null
  startLng: number | null
  endLat: number | null
  endLng: number | null
}

interface CreateRecordedTripPointBulkInput {
  pointOrder: number
  latitude: number
  longitude: number
  altitudeM?: number | null
  accuracyM?: number | null
  speedMps?: number | null
  headingDeg?: number | null
  capturedAt: string
}

export async function createRecordedTrip(params: CreateRecordedTripParams) {
  const { data, error } = await supabase
    .from('recorded_trips')
    .insert({
      user_id: params.userId,
      status: 'recording',
      is_private: true,
      started_at: new Date().toISOString(),
      start_lat: params.startLat,
      start_lng: params.startLng,
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  return data as RecordedTrip
}

export async function createRecordedTripPoint(
  params: CreateRecordedTripPointParams
) {
  const { data, error } = await supabase
    .from('recorded_trip_points')
    .insert({
      recorded_trip_id: params.recordedTripId,
      point_order: params.pointOrder,
      latitude: params.latitude,
      longitude: params.longitude,
      altitude_m: params.altitudeM ?? null,
      accuracy_m: params.accuracyM ?? null,
      speed_mps: params.speedMps ?? null,
      heading_deg: params.headingDeg ?? null,
      captured_at: params.capturedAt ?? new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  return data as RecordedTripPoint
}

export async function finishRecordedTrip(params: FinishRecordedTripParams) {
  const { data, error } = await supabase
    .from('recorded_trips')
    .update({
      status: 'completed',
      ended_at: params.endedAt,
      duration_s: params.durationS,
      distance_m: params.distanceM,
      elevation_gain_m: params.elevationGainM ?? 0,
      end_lat: params.endLat,
      end_lng: params.endLng,
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.recordedTripId)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data as RecordedTrip
}

export async function createRecordedTripFromOffline(
  params: CreateRecordedTripFromOfflineParams
) {
  const { data, error } = await supabase
    .from('recorded_trips')
    .insert({
      user_id: params.userId,
      status: params.status,
      is_private: true,
      started_at: params.startedAt,
      ended_at: params.endedAt ?? null,
      distance_m: params.distanceM,
      duration_s: params.durationS,
      elevation_gain_m: params.elevationGainM,
      start_lat: params.startLat,
      start_lng: params.startLng,
      end_lat: params.endLat,
      end_lng: params.endLng,
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  return data as RecordedTrip
}

export async function createRecordedTripPointsBulk(
  recordedTripId: string,
  points: CreateRecordedTripPointBulkInput[]
) {
  if (points.length === 0) {
    return
  }

  const payload = points.map((point) => ({
    recorded_trip_id: recordedTripId,
    point_order: point.pointOrder,
    latitude: point.latitude,
    longitude: point.longitude,
    altitude_m: point.altitudeM ?? null,
    accuracy_m: point.accuracyM ?? null,
    speed_mps: point.speedMps ?? null,
    heading_deg: point.headingDeg ?? null,
    captured_at: point.capturedAt,
  }))

  const { error } = await supabase
    .from('recorded_trip_points')
    .insert(payload)

  if (error) {
    throw error
  }
}

export async function getRecordedTripPointOrdersByTripId(recordedTripId: string) {
  const { data, error } = await supabase
    .from('recorded_trip_points')
    .select('point_order')
    .eq('recorded_trip_id', recordedTripId)

  if (error) {
    throw error
  }

  return (data ?? [])
    .map((row) => Number(row.point_order))
    .filter((value) => Number.isFinite(value))
}

export async function getRecordedTripPointsByTripId(recordedTripId: string) {
  const { data, error } = await supabase
    .from('recorded_trip_points')
    .select('*')
    .eq('recorded_trip_id', recordedTripId)
    .order('point_order', { ascending: true })

  if (error) {
    throw error
  }

  return (data ?? []) as RecordedTripPoint[]
}