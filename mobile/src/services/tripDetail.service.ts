import { supabase } from '../lib/supabase'
import {
  getOfflineRecordedTripById,
  getOfflineRecordedTripByRemoteId,
  getOfflineTripPointsByTripId,
} from './offlineTrip.service'
import { getRecordedTripDetailById } from './history.service'
import { getRecordedTripPointsByTripId } from './trip.service'
import {
  getOfflineJournalByTripId,
  type OfflineJournal,
} from './journal.service'
import type { Journal } from '../types/journal'
import type { OfflineRecordedTrip, OfflineRecordedTripPoint } from '../types/offlineTrip'
import type { RouteItem } from '../types/route'
import type { RecordedTrip, RecordedTripPoint } from '../types/trip'
import {
  resolveTripDisplayDescription,
  resolveTripDisplayTitle,
} from '../utils/tripDisplay'
import { normalizeText } from '../utils/text'

export type TripDetailMode = 'local' | 'remote'

export interface TripDetailPoint {
  latitude: number
  longitude: number
  altitude_m: number | null
  point_order: number
  captured_at?: string | null
}

export interface TripDetailData {
  mode: TripDetailMode
  trip: RecordedTrip | OfflineRecordedTrip
  journal: Journal | OfflineJournal | null
  route: RouteItem | null
  points: TripDetailPoint[]
  title: string
  description: string | null
  difficulty: string | null
  category: string | null
  visibility: 'public' | 'private' | null
  commentsEnabled: boolean | null
  maxAltitudeM: number | null
  isOffline: boolean
}

function getMaxAltitudeM(points: TripDetailPoint[]) {
  const altitudes = points
    .map((point) => point.altitude_m)
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value))

  if (altitudes.length === 0) {
    return null
  }

  return Math.max(...altitudes)
}

function mapOfflinePoint(point: OfflineRecordedTripPoint): TripDetailPoint {
  return {
    latitude: point.latitude,
    longitude: point.longitude,
    altitude_m: point.altitude_m,
    point_order: point.point_order,
    captured_at: point.captured_at,
  }
}

function mapRemotePoint(point: RecordedTripPoint): TripDetailPoint {
  return {
    latitude: point.latitude,
    longitude: point.longitude,
    altitude_m: point.altitude_m,
    point_order: point.point_order,
    captured_at: point.captured_at,
  }
}

async function getJournalByRecordedTripId(tripId: string, userId: string) {
  const { data, error } = await supabase
    .from('journals')
    .select('*')
    .eq('recorded_trip_id', tripId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return (data ?? null) as Journal | null
}

async function getRouteByRecordedTripId(tripId: string, userId: string) {
  const { data, error } = await supabase
    .from('routes')
    .select('*')
    .eq('source_recorded_trip_id', tripId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return (data ?? null) as RouteItem | null
}

function getJournalTitle(journal: Journal | OfflineJournal | null) {
  return normalizeText(journal?.title)
}

function getJournalContent(journal: Journal | OfflineJournal | null) {
  if (!journal) {
    return null
  }

  if ('content' in journal) {
    return normalizeText(journal.content)
  }

  return null
}

function getJournalVisibility(journal: Journal | OfflineJournal | null) {
  return journal?.visibility ?? null
}

function getJournalDifficulty(journal: Journal | OfflineJournal | null) {
  if (!journal || !('difficulty' in journal)) {
    return null
  }

  return normalizeText(journal.difficulty)
}

function getJournalCategory(journal: Journal | OfflineJournal | null) {
  if (!journal || !('category' in journal)) {
    return null
  }

  return normalizeText(journal.category)
}

function getJournalCommentsEnabled(journal: Journal | OfflineJournal | null) {
  if (!journal || !('comments_enabled' in journal)) {
    return null
  }

  if (typeof journal.comments_enabled === 'number') {
    return journal.comments_enabled === 1
  }

  if (typeof journal.comments_enabled === 'boolean') {
    return journal.comments_enabled
  }

  return null
}

function buildDetailData(params: {
  mode: TripDetailMode
  trip: RecordedTrip | OfflineRecordedTrip
  journal: Journal | OfflineJournal | null
  route: RouteItem | null
  points: TripDetailPoint[]
  isOffline: boolean
}): TripDetailData {
  const journalTitle = getJournalTitle(params.journal)
  const routeTitle = normalizeText(params.route?.title)
  const tripTitle = normalizeText('title' in params.trip ? params.trip.title : null)

  const journalContent = getJournalContent(params.journal)
  const routeDescription = normalizeText(params.route?.description)
  const tripSummary = normalizeText('summary' in params.trip ? params.trip.summary : null)

  const title = resolveTripDisplayTitle({
    journalTitle,
    tripTitle,
    routeTitle,
    startedAt: params.trip.started_at,
    fallbackDateLocale: 'es-BO',
  })
  const description = resolveTripDisplayDescription({
    journalContent,
    routeDescription,
    tripSummary,
  })

  return {
    mode: params.mode,
    trip: params.trip,
    journal: params.journal,
    route: params.route,
    points: params.points,
    title,
    description,
    difficulty: getJournalDifficulty(params.journal) ?? normalizeText(params.route?.difficulty),
    category: getJournalCategory(params.journal) ?? normalizeText(params.route?.category),
    visibility: getJournalVisibility(params.journal),
    commentsEnabled: getJournalCommentsEnabled(params.journal) ?? params.route?.comments_enabled ?? null,
    maxAltitudeM: getMaxAltitudeM(params.points),
    isOffline: params.isOffline,
  }
}

export async function getTripDetailData(tripId: string, userId: string) {
  const localTripById = await getOfflineRecordedTripById(tripId)
  const localTripByRemoteId = localTripById ? null : await getOfflineRecordedTripByRemoteId(tripId)
  const localTrip = localTripById ?? localTripByRemoteId

  if (localTrip) {
    const localJournal = await getOfflineJournalByTripId(localTrip.local_id)
    const points = await getOfflineTripPointsByTripId(localTrip.local_id)
    const route = localTrip.remote_id
      ? await getRouteByRecordedTripId(localTrip.remote_id, userId)
      : null

    return buildDetailData({
      mode: 'local',
      trip: localTrip,
      journal: localJournal,
      route,
      points: points.map(mapOfflinePoint),
      isOffline: localTrip.sync_status !== 'synced',
    })
  }

  const remoteTrip = await getRecordedTripDetailById(tripId, userId)
  const [journal, route, points] = await Promise.all([
    getJournalByRecordedTripId(remoteTrip.id, userId),
    getRouteByRecordedTripId(remoteTrip.id, userId),
    getRecordedTripPointsByTripId(remoteTrip.id),
  ])

  return buildDetailData({
    mode: 'remote',
    trip: remoteTrip,
    journal,
    route,
    points: points.map(mapRemotePoint),
    isOffline: false,
  })
}

export async function softDeleteOwnRecordedTrip(recordedTripId: string, userId: string) {
  const normalizedTripId = normalizeText(recordedTripId)
  const normalizedUserId = normalizeText(userId)

  if (!normalizedTripId) {
    throw new Error('No se encontro el recorrido para eliminar.')
  }

  if (!normalizedUserId) {
    throw new Error('Debes iniciar sesion para eliminar un recorrido.')
  }

  const { data: authData, error: authError } = await supabase.auth.getUser()

  if (authError) {
    throw authError
  }

  if (!authData.user || authData.user.id !== normalizedUserId) {
    throw new Error('No tienes permisos para eliminar este recorrido.')
  }

  const now = new Date().toISOString()
  const { data: updatedTrip, error: tripError } = await supabase
    .from('recorded_trips')
    .update({
      status: 'cancelled',
      updated_at: now,
    })
    .eq('id', normalizedTripId)
    .eq('user_id', normalizedUserId)
    .select('id')
    .maybeSingle()

  if (tripError) {
    throw tripError
  }

  if (!updatedTrip) {
    throw new Error('No se pudo eliminar el recorrido.')
  }

  const { error: routeError } = await supabase
    .from('routes')
    .update({
      publication_status: 'archived',
      updated_at: now,
    })
    .eq('source_recorded_trip_id', normalizedTripId)
    .eq('user_id', normalizedUserId)

  if (routeError) {
    throw routeError
  }

  const { error: journalError } = await supabase
    .from('journals')
    .update({
      visibility: 'private',
      updated_at: now,
    })
    .eq('recorded_trip_id', normalizedTripId)
    .eq('user_id', normalizedUserId)

  if (journalError) {
    throw journalError
  }
}
