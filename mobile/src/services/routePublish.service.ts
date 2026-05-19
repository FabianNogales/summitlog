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

const inFlightPublishByTripId = new Map<
  string,
  Promise<PublishRecordedTripAsRouteResult>
>()

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

async function getOwnedCompletedTripById(
  tripId: string,
  userId: string
) {
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
    throw new Error('No se encontro el recorrido o no tienes permisos.')
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
  minimumPoints = 2
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
    throw new Error('Debes iniciar sesion para publicar una ruta.')
  }

  const trip = await getOwnedCompletedTripById(input.recordedTripId, currentUser.id)
  const normalizedTitle = input.title.trim()

  if (!normalizedTitle) {
    throw new Error('El titulo de la ruta es obligatorio.')
  }

  const tripPoints = await getRecordedTripPointsByTripId(trip.id)
  if (tripPoints.length < 2) {
    throw new Error(
      'El recorrido necesita al menos 2 puntos GPS para convertirse en ruta publica.'
    )
  }

  const now = new Date().toISOString()
  const existingRoute = await getRouteBySourceRecordedTripId(trip.id)

  if (existingRoute) {
    await ensureRoutePointsFromTrip(existingRoute.id, trip.id)

    if (existingRoute.publication_status === 'published') {
      return {
        route: existingRoute,
        alreadyPublished: true,
        routeId: existingRoute.id,
      }
    }

    const { data, error } = await supabase
      .from('routes')
      .update({
        publication_status: 'published',
        published_at: existingRoute.published_at ?? now,
        title: normalizedTitle,
        description: input.description?.trim() || null,
        difficulty: input.difficulty?.trim() || null,
        category: input.category?.trim() || null,
        comments_enabled: input.commentsEnabled ?? existingRoute.comments_enabled,
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
      alreadyPublished: false,
      routeId: route.id,
    }
  }

  const { data: createdRoute, error: createError } = await supabase
    .from('routes')
    .insert({
      user_id: currentUser.id,
      source_recorded_trip_id: trip.id,
      publication_status: 'published',
      title: normalizedTitle,
      description: input.description?.trim() || null,
      difficulty: input.difficulty?.trim() || null,
      category: input.category?.trim() || null,
      cover_image_url: null,
      distance_m: trip.distance_m,
      duration_s: trip.duration_s,
      elevation_gain_m: trip.elevation_gain_m,
      start_lat: trip.start_lat,
      start_lng: trip.start_lng,
      end_lat: trip.end_lat,
      end_lng: trip.end_lng,
      published_at: now,
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
    throw new Error(
      `La ruta se creo, pero no se pudieron copiar los puntos GPS. route_id=${route.id}. ${error?.message ?? ''}`.trim()
    )
  }

  return {
    route,
    alreadyPublished: false,
    routeId: route.id,
  }
}
