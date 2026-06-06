import { supabase } from '../lib/supabase'
import type { RecordedTrip } from '../types/trip'
import {
  resolveTripDisplayDescription,
  resolveTripDisplayTitle,
} from '../utils/tripDisplay'

export interface TripHistoryStats {
  completedTrips: number
  journalCount: number
  totalDistanceKm: number
  totalDurationS: number
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

interface GetCompletedTripsByUserOptions {
  limit?: number
}

interface TripHistoryJournalRow {
  recorded_trip_id: string
  title: string | null
  content: string | null
  visibility: string
}

interface TripHistoryRouteRow {
  source_recorded_trip_id: string
  title: string
  description: string | null
  category: string | null
  difficulty: string | null
  publication_status: string
}

type DecoratedTrip = RecordedTrip & {
  display_title?: string
  display_description?: string | null
  journal_visibility?: string | null
  route_category?: string | null
  route_difficulty?: string | null
  route_publication_status?: string | null
}

async function decorateTripsWithJournalAndRouteData(trips: RecordedTrip[]) {
  if (trips.length === 0) {
    return []
  }

  const tripIds = trips.map((trip) => trip.id)

  const [journalsResult, routesResult] = await Promise.all([
    supabase
      .from('journals')
      .select('recorded_trip_id,title,content,visibility')
      .in('recorded_trip_id', tripIds),
    supabase
      .from('routes')
      .select('source_recorded_trip_id,title,description,category,difficulty,publication_status')
      .in('source_recorded_trip_id', tripIds),
  ])

  if (journalsResult.error) {
    throw journalsResult.error
  }

  if (routesResult.error) {
    throw routesResult.error
  }

  const journalsByTripId = new Map<string, TripHistoryJournalRow>()
  const routesByTripId = new Map<string, TripHistoryRouteRow>()

  for (const journal of (journalsResult.data ?? []) as TripHistoryJournalRow[]) {
    journalsByTripId.set(journal.recorded_trip_id, journal)
  }

  for (const route of (routesResult.data ?? []) as TripHistoryRouteRow[]) {
    routesByTripId.set(route.source_recorded_trip_id, route)
  }

  return trips.map((trip) => {
    const journal = journalsByTripId.get(trip.id)
    const route = routesByTripId.get(trip.id)

    const displayTitle = resolveTripDisplayTitle({
      journalTitle: journal?.title,
      tripTitle: trip.title,
      routeTitle: route?.title,
      startedAt: trip.started_at,
      fallbackDateLocale: 'es-BO',
      fallbackDateOptions: {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      },
    })

    const displayDescription = resolveTripDisplayDescription({
      journalContent: journal?.content,
      routeDescription: route?.description,
      tripSummary: trip.summary,
    })

    return {
      ...trip,
      display_title: displayTitle,
      display_description: displayDescription,
      journal_visibility: journal?.visibility ?? null,
      route_category: route?.category ?? null,
      route_difficulty: route?.difficulty ?? null,
      route_publication_status: route?.publication_status ?? null,
    } as DecoratedTrip
  })
}

export async function getCompletedTripsByUser(
  userId: string,
  options: GetCompletedTripsByUserOptions = {}
) {
  let query = supabase
    .from('recorded_trips')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('started_at', { ascending: false })

  if (
    typeof options.limit === 'number' &&
    Number.isFinite(options.limit) &&
    options.limit > 0
  ) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  return decorateTripsWithJournalAndRouteData((data ?? []) as RecordedTrip[])
}

export async function getTripHistoryStats(userId: string): Promise<TripHistoryStats> {
  const trips = await getCompletedTripsByUser(userId)

  const totalDistanceMeters = trips.reduce((acc, trip) => {
    return acc + Number(trip.distance_m ?? 0)
  }, 0)
  const totalDurationS = trips.reduce((acc, trip) => {
    return acc + Number(trip.duration_s ?? 0)
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
    totalDurationS,
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
  const completedTripsList = trips.filter((trip) => trip.status === 'completed')
  const completedTrips = completedTripsList.length
  const totalDistanceMeters = completedTripsList.reduce(
    (acc, trip) => acc + Number(trip.distance_m ?? 0),
    0
  )
  const totalDurationS = completedTripsList.reduce(
    (acc, trip) => acc + Number(trip.duration_s ?? 0),
    0
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