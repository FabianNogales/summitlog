import { supabase } from '../lib/supabase'
import type { RouteItem, RoutePoint, RouteReport } from '../types/route'

export async function getPublishedRoutes() {
  const { data, error } = await supabase
    .from('routes')
    .select('*')
    .eq('publication_status', 'published')
    .order('published_at', { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []) as RouteItem[]
}

export async function getRouteById(routeId: string) {
  const { data, error } = await supabase
    .from('routes')
    .select('*')
    .eq('id', routeId)
    .single()

  if (error) {
    throw error
  }

  return data as RouteItem
}

export async function getRoutePointsByRouteId(routeId: string) {
  const { data, error } = await supabase
    .from('route_points')
    .select('*')
    .eq('route_id', routeId)
    .order('point_order', { ascending: true })

  if (error) {
    throw error
  }

  return (data ?? []) as RoutePoint[]
}

export async function getRecentRouteReportsByRouteId(routeId: string) {
  const { data, error } = await supabase
    .from('route_reports')
    .select('*')
    .eq('route_id', routeId)
    .eq('moderation_status', 'visible')
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) {
    throw error
  }

  return (data ?? []) as RouteReport[]
}