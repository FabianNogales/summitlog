import { supabase } from '../lib/supabase'
import type { RecordedTrip } from '../types/trip'

export interface TripHistoryStats {
  completedTrips: number
  journalCount: number
  totalDistanceKm: number
}

export interface UserStats {
  totalTrips: number
  completedTrips: number
  totalDistanceKm: number
  totalDurationS: number
  averageDistanceKm: number | null
  averageDurationMinutes: number | null
  lastActivityAt: string | null
  totalGpsPoints: number | null
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

export async function getUserStats(userId: string): Promise<UserStats> {
  const { data, error } = await supabase
    .from('recorded_trips')
    .select('id,status,distance_m,duration_s,started_at,ended_at')
    .eq('user_id', userId)

  if (error) {
    throw error
  }

  const trips = (data ?? []) as RecordedTrip[]
  const totalTrips = trips.length
  const completedTrips = trips.filter((trip) => trip.status === 'completed').length
  const totalDistanceMeters = trips.reduce(
    (acc, trip) => acc + Number(trip.distance_m ?? 0),
    0,
  )
  const totalDurationS = trips.reduce(
    (acc, trip) => acc + Number(trip.duration_s ?? 0),
    0,
  )

  const lastActivityAt = trips.reduce((latest, trip) => {
    const activityDate = new Date(trip.ended_at ?? trip.started_at)
    if (!latest || activityDate > latest) {
      return activityDate
    }
    return latest
  }, null as Date | null)

  let totalGpsPoints: number | null = null

  if (trips.length > 0) {
    const tripIds = trips.map((trip) => trip.id)
    const { count, error: pointsError } = await supabase
      .from('recorded_trip_points')
      .select('*', { count: 'exact', head: true })
      .in('recorded_trip_id', tripIds)

    if (pointsError) {
      throw pointsError
    }

    totalGpsPoints = count ?? 0
  }

  return {
    totalTrips,
    completedTrips,
    totalDistanceKm: totalDistanceMeters / 1000,
    totalDurationS,
    averageDistanceKm:
      completedTrips > 0 ? totalDistanceMeters / 1000 / completedTrips : null,
    averageDurationMinutes:
      completedTrips > 0 ? totalDurationS / 60 / completedTrips : null,
    lastActivityAt: lastActivityAt?.toISOString() ?? null,
    totalGpsPoints,
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