import { supabase } from "../lib/supabase";
import type { RecordedTrip, RecordedTripPoint } from "../types/trip";

interface CreateRecordedTripParams {
  userId: string;
  startLat: number;
  startLng: number;
}

interface CreateRecordedTripPointParams {
  recordedTripId: string;
  pointOrder: number;
  latitude: number;
  longitude: number;
  altitudeM?: number | null;
  accuracyM?: number | null;
  speedMps?: number | null;
  headingDeg?: number | null;
  capturedAt?: string;
}

interface FinishRecordedTripParams {
  recordedTripId: string
  endedAt: string
  durationS: number
  distanceM: number
  endLat: number
  endLng: number
}
export async function createRecordedTrip(params: CreateRecordedTripParams) {
  const { data, error } = await supabase
    .from("recorded_trips")
    .insert({
      user_id: params.userId,
      status: "recording",
      is_private: true,
      started_at: new Date().toISOString(),
      start_lat: params.startLat,
      start_lng: params.startLng,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as RecordedTrip;
}

export async function createRecordedTripPoint(
  params: CreateRecordedTripPointParams,
) {
  const { data, error } = await supabase
    .from("recorded_trip_points")
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
    .single();

  if (error) {
    throw error;
  }

  return data as RecordedTripPoint;
}

export async function finishRecordedTrip(params: FinishRecordedTripParams) {
  const { data, error } = await supabase
    .from('recorded_trips')
    .update({
      status: 'completed',
      ended_at: params.endedAt,
      duration_s: params.durationS,
      distance_m: params.distanceM,
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