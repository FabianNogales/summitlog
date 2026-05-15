import { supabase } from '../lib/supabase'
import type { RouteItem } from '../types/route'
import type { RecordedTrip } from '../types/trip'
import { getRecordedTripPointsByTripId } from './trip.service'

interface PublishRecordedTripAsRouteResult {
  route: RouteItem
  created: boolean
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

async function ensureRoutePointsFromTrip(routeId: string, tripId: string) {
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

  if (tripPoints.length === 0) {
    return
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
  trip: RecordedTrip
): Promise<PublishRecordedTripAsRouteResult> {
  const activePublish = inFlightPublishByTripId.get(trip.id)
  if (activePublish) {
    return activePublish
  }

  const publishPromise = runPublishRecordedTripAsRoute(trip).finally(() => {
    inFlightPublishByTripId.delete(trip.id)
  })

  inFlightPublishByTripId.set(trip.id, publishPromise)
  return publishPromise
}

async function runPublishRecordedTripAsRoute(
  trip: RecordedTrip
): Promise<PublishRecordedTripAsRouteResult> {
  if (trip.status !== 'completed') {
    throw new Error('Solo puedes publicar recorridos completados.')
  }

  const now = new Date().toISOString()
  const existingRoute = await getRouteBySourceRecordedTripId(trip.id)

  if (existingRoute) {
    await ensureRoutePointsFromTrip(existingRoute.id, trip.id)

    if (existingRoute.publication_status === 'published') {
      return { route: existingRoute, created: false }
    }

    const { data, error } = await supabase
      .from('routes')
      .update({
        publication_status: 'published',
        published_at: existingRoute.published_at ?? now,
        updated_at: now,
      })
      .eq('id', existingRoute.id)
      .select('*')
      .single()

    if (error) {
      throw error
    }

    return { route: data as RouteItem, created: false }
  }

  const { data: createdRoute, error: createError } = await supabase
    .from('routes')
    .insert({
      user_id: trip.user_id,
      source_recorded_trip_id: trip.id,
      publication_status: 'published',
      title: trip.title?.trim() || 'Ruta publicada desde recorrido',
      description: trip.summary?.trim() || null,
      distance_m: trip.distance_m,
      duration_s: trip.duration_s,
      elevation_gain_m: trip.elevation_gain_m,
      start_lat: trip.start_lat,
      start_lng: trip.start_lng,
      end_lat: trip.end_lat,
      end_lng: trip.end_lng,
      published_at: now,
      comments_enabled: true,
    })
    .select('*')
    .single()

  if (createError) {
    throw createError
  }

  const route = createdRoute as RouteItem
  await ensureRoutePointsFromTrip(route.id, trip.id)

  return {
    route,
    created: true,
  }
}
