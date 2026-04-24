import { supabase } from '../lib/supabase'
import type { RecordedTrip } from '../types/trip'

export interface TripHistoryStats {
  completedTrips: number
  journalCount: number
  totalDistanceKm: number
}

export async function getCompletedTripsByUser(userId: string) {
  const { data, error } = await supabase
    .from('recorded_trips')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('started_at', { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []) as RecordedTrip[]
}

export async function getTripHistoryStats(userId: string): Promise<TripHistoryStats> {
  const trips = await getCompletedTripsByUser(userId)

  const totalDistanceMeters = trips.reduce((acc, trip) => {
    return acc + Number(trip.distance_m ?? 0)
  }, 0)

  const { count: journalCount, error: journalError } = await supabase
    .from('journals')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (journalError) {
    throw journalError
  }

  return {
    completedTrips: trips.length,
    journalCount: journalCount ?? 0,
    totalDistanceKm: totalDistanceMeters / 1000,
  }
}

export async function getRecordedTripDetailById(tripId: string, userId: string) {
  const { data, error } = await supabase
    .from('recorded_trips')
    .select('*')
    .eq('id', tripId)
    .eq('user_id', userId)
    .single()

  if (error) {
    throw error
  }

  return data as RecordedTrip
}