import { supabase } from '../lib/supabase'
import type { RouteItem } from '../types/route'
import type { RecordedTrip } from '../types/trip'
import { getRecordedTripPointsByTripId } from './trip.service'

interface PublishRecordedTripAsRouteInput {
  recordedTripId: string
  title: string
  description?: string | null
  difficulty?: string | null
  category?: string | null
  commentsEnabled?: boolean
}

interface PublishRecordedTripAsRouteResult {
  route: RouteItem
  alreadyPublished: boolean
  routeId: string
}

interface UnpublishRecordedTripRouteResult {
  route: RouteItem | null
  changed: boolean
}

const inFlightPublishByTripId = new Map<
  string,
  Promise<PublishRecordedTripAsRouteResult>
>()

const MINIMUM_ROUTE_POINTS = 2
const ALLOWED_DIFFICULTIES = new Set(['easy', 'medium', 'hard'])

export async function getRouteBySourceRecordedTripId(recordedTripId: string) {
  const { data, error } = await supabase
    .from('routes')
    .select('*')
    .eq('source_recorded_trip_id', recordedTripId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return (data ?? null) as RouteItem | null
}

async function getOwnedCompletedTripById(tripId: string, userId: string) {
  const { data, error } = await supabase
    .from('recorded_trips')
    .select('*')
    .eq('id', tripId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (!data) {
    throw new Error('No se encontró el recorrido o no tienes permisos.')
  }

  const trip = data as RecordedTrip

  if (trip.status !== 'completed') {
    throw new Error('Solo puedes publicar recorridos completados.')
  }

  return trip
}

async function ensureRoutePointsFromTrip(
  routeId: string,
  tripId: string,
  minimumPoints = MINIMUM_ROUTE_POINTS
) {
  const { count, error: countError } = await supabase
    .from('route_points')
    .select('*', { count: 'exact', head: true })
    .eq('route_id', routeId)

  if (countError) {
    throw countError
  }

  if ((count ?? 0) > 0) {
    return
  }

  const tripPoints = await getRecordedTripPointsByTripId(tripId)

  if (tripPoints.length < minimumPoints) {
    throw new Error(
      'El recorrido no tiene suficientes puntos GPS para publicarse como ruta.'
    )
  }

  const payload = tripPoints.map((point) => ({
    route_id: routeId,
    point_order: point.point_order,
    latitude: point.latitude,
    longitude: point.longitude,
    altitude_m: point.altitude_m,
    captured_at: point.captured_at,
  }))

  const { error } = await supabase.from('route_points').insert(payload)

  if (error) {
    throw error
  }
}

function normalizeOptionalText(value?: string | null) {
  const normalized = value?.trim()
  return normalized ? normalized : null
}

function normalizeDifficulty(value?: string | null) {
  const normalized = value?.trim().toLowerCase() ?? ''

  if (!normalized) {
    return null
  }

  if (ALLOWED_DIFFICULTIES.has(normalized)) {
    return normalized
  }

  return null
}

async function rollbackRouteCreation(routeId: string) {
  const { error: deleteError } = await supabase
    .from('routes')
    .delete()
    .eq('id', routeId)

  if (!deleteError) {
    return null
  }

  const { error: archiveError } = await supabase
    .from('routes')
    .update({
      publication_status: 'archived',
      updated_at: new Date().toISOString(),
    })
    .eq('id', routeId)

  if (!archiveError) {
    return 'No se pudo eliminar la ruta creada, pero se movió a estado archived.'
  }

  return 'No se pudo revertir la ruta creada automáticamente. Requiere revisión manual.'
}

export async function publishRecordedTripAsRoute(
  input: PublishRecordedTripAsRouteInput
): Promise<PublishRecordedTripAsRouteResult> {
  const activePublish = inFlightPublishByTripId.get(input.recordedTripId)

  if (activePublish) {
    return activePublish
  }

  const publishPromise = runPublishRecordedTripAsRoute(input).finally(() => {
    inFlightPublishByTripId.delete(input.recordedTripId)
  })

  inFlightPublishByTripId.set(input.recordedTripId, publishPromise)

  return publishPromise
}

async function runPublishRecordedTripAsRoute(
  input: PublishRecordedTripAsRouteInput
): Promise<PublishRecordedTripAsRouteResult> {
  const { data: authData, error: authError } = await supabase.auth.getUser()

  if (authError) {
    throw authError
  }

  const currentUser = authData.user

  if (!currentUser) {
    throw new Error('Debes iniciar sesión para publicar una ruta.')
  }

  const trip = await getOwnedCompletedTripById(input.recordedTripId, currentUser.id)

  const normalizedTitle = input.title.trim()
  const normalizedDescription = normalizeOptionalText(input.description)
  const normalizedDifficulty = normalizeDifficulty(input.difficulty)
  const normalizedCategory = normalizeOptionalText(input.category)

  if (!normalizedTitle) {
    throw new Error('El título de la ruta es obligatorio.')
  }

  const tripPoints = await getRecordedTripPointsByTripId(trip.id)

  if (tripPoints.length < MINIMUM_ROUTE_POINTS) {
    throw new Error(
      `El recorrido necesita al menos ${MINIMUM_ROUTE_POINTS} puntos GPS para convertirse en ruta pública.`
    )
  }

  const now = new Date().toISOString()
  const existingRoute = await getRouteBySourceRecordedTripId(trip.id)

  if (existingRoute) {
    await ensureRoutePointsFromTrip(existingRoute.id, trip.id)

    const wasAlreadyPublished = existingRoute.publication_status === 'published'

    const { data, error } = await supabase
      .from('routes')
      .update({
        publication_status: 'published',
        published_at: existingRoute.published_at ?? now,
        title: normalizedTitle,
        description: normalizedDescription,
        difficulty: normalizedDifficulty,
        category: normalizedCategory,
        comments_enabled: input.commentsEnabled ?? true,
        distance_m: trip.distance_m,
        duration_s: trip.duration_s,
        elevation_gain_m: trip.elevation_gain_m ?? 0,
        start_lat: trip.start_lat,
        start_lng: trip.start_lng,
        end_lat: trip.end_lat,
        end_lng: trip.end_lng,
        updated_at: now,
      })
      .eq('id', existingRoute.id)
      .select('*')
      .single()

    if (error) {
      throw error
    }

    const route = data as RouteItem

    return {
      route,
      alreadyPublished: wasAlreadyPublished,
      routeId: route.id,
    }
  }

  // La ruta queda en draft hasta copiar todos los puntos; así no se expone una geometría incompleta.
  const { data: createdRoute, error: createError } = await supabase
    .from('routes')
    .insert({
      user_id: currentUser.id,
      source_recorded_trip_id: trip.id,
      publication_status: 'draft',
      title: normalizedTitle,
      description: normalizedDescription,
      difficulty: normalizedDifficulty,
      category: normalizedCategory,
      cover_image_url: null,
      distance_m: trip.distance_m,
      duration_s: trip.duration_s,
      elevation_gain_m: trip.elevation_gain_m ?? 0,
      start_lat: trip.start_lat,
      start_lng: trip.start_lng,
      end_lat: trip.end_lat,
      end_lng: trip.end_lng,
      published_at: null,
      comments_enabled: input.commentsEnabled ?? true,
    })
    .select('*')
    .single()

  if (createError) {
    throw createError
  }

  const route = createdRoute as RouteItem

  try {
    const pointsPayload = tripPoints.map((point) => ({
      route_id: route.id,
      point_order: point.point_order,
      latitude: point.latitude,
      longitude: point.longitude,
      altitude_m: point.altitude_m,
      captured_at: point.captured_at,
    }))

    const { error: insertPointsError } = await supabase
      .from('route_points')
      .insert(pointsPayload)

    if (insertPointsError) {
      throw insertPointsError
    }
  } catch (error: any) {
    const rollbackMessage = await rollbackRouteCreation(route.id)

    throw new Error(
      [
        `No se pudieron copiar los puntos GPS para publicar la ruta (route_id=${route.id}).`,
        error?.message ?? '',
        rollbackMessage ?? '',
      ]
        .filter(Boolean)
        .join(' ')
        .trim()
    )
  }

  const { data: publishedRoute, error: publishError } = await supabase
    .from('routes')
    .update({
      publication_status: 'published',
      published_at: now,
      title: normalizedTitle,
      description: normalizedDescription,
      difficulty: normalizedDifficulty,
      category: normalizedCategory,
      comments_enabled: input.commentsEnabled ?? true,
      distance_m: trip.distance_m,
      duration_s: trip.duration_s,
      elevation_gain_m: trip.elevation_gain_m ?? 0,
      start_lat: trip.start_lat,
      start_lng: trip.start_lng,
      end_lat: trip.end_lat,
      end_lng: trip.end_lng,
      updated_at: now,
    })
    .eq('id', route.id)
    .select('*')
    .single()

  if (publishError) {
    throw new Error(
      `La ruta se creó con puntos, pero no se pudo publicar. route_id=${route.id}. Puedes reintentar. ${
        publishError.message ?? ''
      }`.trim()
    )
  }

  return {
    route: publishedRoute as RouteItem,
    alreadyPublished: false,
    routeId: route.id,
  }
}

export async function unpublishRecordedTripRoute(
  recordedTripId: string
): Promise<UnpublishRecordedTripRouteResult> {
  const { data: authData, error: authError } = await supabase.auth.getUser()

  if (authError) {
    throw authError
  }

  const currentUser = authData.user

  if (!currentUser) {
    throw new Error('Debes iniciar sesión.')
  }

  const route = await getRouteBySourceRecordedTripId(recordedTripId)

  if (!route) {
    return {
      route: null,
      changed: false,
    }
  }

  if (route.user_id !== currentUser.id) {
    throw new Error('No tienes permisos para modificar esta ruta.')
  }

  if (route.publication_status !== 'published') {
    return {
      route,
      changed: false,
    }
  }

  const { data, error } = await supabase
    .from('routes')
    .update({
      publication_status: 'archived',
      updated_at: new Date().toISOString(),
    })
    .eq('id', route.id)
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return {
    route: data as RouteItem,
    changed: true,
  }
}
