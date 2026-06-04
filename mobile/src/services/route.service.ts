import { supabase } from '../lib/supabase'
import { getJournalMediaPublicUrl } from './journalMedia.service'
import type { RouteItem, RoutePoint, RouteReport } from '../types/route'
import { formatRecordedTripTitleFromDate } from '../utils/date'
import { normalizeText } from '../utils/text'

interface RouteJournalRow {
  id: string
  recorded_trip_id: string
  title: string | null
  updated_at?: string | null
  created_at?: string | null
}

interface RouteJournalMediaRow {
  journal_id: string
  file_path: string | null
}

interface RouteTripTitleRow {
  id: string
  title: string | null
  started_at: string | null
}

function getRouteDisplayTitle(params: {
  route: RouteItem
  journalTitle?: string | null
  tripTitle?: string | null
  tripStartedAt?: string | null
}) {
  const resolvedTitle =
    normalizeText(params.journalTitle) ??
    normalizeText(params.tripTitle) ??
    normalizeText(params.route.title)

  if (resolvedTitle) {
    return resolvedTitle
  }

  return (
    formatRecordedTripTitleFromDate(params.tripStartedAt, { locale: 'es-BO' }) ??
    formatRecordedTripTitleFromDate(params.route.published_at, { locale: 'es-BO' }) ??
    formatRecordedTripTitleFromDate(params.route.created_at, { locale: 'es-BO' }) ??
    'Ruta sin título'
  )
}

function getRouteDisplayImageUrl(params: {
  route: RouteItem
  journalMediaPath?: string | null
}) {
  const routeCoverUrl = normalizeText(params.route.cover_image_url)
  if (routeCoverUrl) {
    return routeCoverUrl
  }

  const journalMediaPath = normalizeText(params.journalMediaPath)
  if (!journalMediaPath) {
    return null
  }

  const journalMediaUrl = normalizeText(getJournalMediaPublicUrl(journalMediaPath))
  return journalMediaUrl
}

async function decorateRoutes(routes: RouteItem[]) {
  if (routes.length === 0) {
    return routes
  }

  const routeTripIds = Array.from(
    new Set(
      routes
        .map((route) => route.source_recorded_trip_id)
        .filter((value): value is string => Boolean(value))
    )
  )

  if (routeTripIds.length === 0) {
    return routes.map((route) => ({
      ...route,
      display_title: getRouteDisplayTitle({ route }),
      display_image_url: getRouteDisplayImageUrl({ route }),
    }))
  }

  try {
    const [journalsResult, tripsResult] = await Promise.all([
      supabase
        .from('journals')
        .select('id,recorded_trip_id,title,updated_at,created_at')
        .in('recorded_trip_id', routeTripIds)
        .order('updated_at', { ascending: false }),
      supabase
        .from('recorded_trips')
        .select('id,title,started_at')
        .in('id', routeTripIds),
    ])

    if (journalsResult.error) {
      throw journalsResult.error
    }

    if (tripsResult.error) {
      throw tripsResult.error
    }

    const journals = (journalsResult.data ?? []) as RouteJournalRow[]
    const journalIds = journals.map((journal) => journal.id)

    const mediaByJournalResult =
      journalIds.length > 0
        ? await supabase
            .from('journal_media')
            .select('journal_id,file_path')
            .in('journal_id', journalIds)
            .order('sort_order', { ascending: true })
        : null

    if (mediaByJournalResult?.error) {
      throw mediaByJournalResult.error
    }

    const journalByTripId = new Map<string, RouteJournalRow>()
    const journalMediaPathByJournalId = new Map<string, string | null>()
    const tripDataById = new Map<string, RouteTripTitleRow>()

    for (const journal of journals) {
      if (!journalByTripId.has(journal.recorded_trip_id)) {
        journalByTripId.set(journal.recorded_trip_id, journal)
      }
    }

    for (const media of (mediaByJournalResult?.data ?? []) as RouteJournalMediaRow[]) {
      if (!journalMediaPathByJournalId.has(media.journal_id)) {
        journalMediaPathByJournalId.set(media.journal_id, media.file_path)
      }
    }

    for (const trip of (tripsResult.data ?? []) as RouteTripTitleRow[]) {
      tripDataById.set(trip.id, trip)
    }

    return routes.map((route) => {
      const journal = journalByTripId.get(route.source_recorded_trip_id)
      const tripData = tripDataById.get(route.source_recorded_trip_id)
      const displayTitle = getRouteDisplayTitle({
        route,
        journalTitle: journal?.title,
        tripTitle: tripData?.title,
        tripStartedAt: tripData?.started_at,
      })
      const displayImageUrl = getRouteDisplayImageUrl({
        route,
        journalMediaPath: journal
          ? journalMediaPathByJournalId.get(journal.id)
          : null,
      })

      return {
        ...route,
        display_title: displayTitle,
        display_image_url: displayImageUrl,
      }
    })
  } catch (error) {
    console.warn(
      '[Routes] No se pudo enriquecer metadata de rutas (titulo/imagen) desde journals/journal_media/recorded_trips.',
      error
    )

    return routes.map((route) => ({
      ...route,
      display_title: getRouteDisplayTitle({ route }),
      display_image_url: getRouteDisplayImageUrl({ route }),
    }))
  }
}

export async function getPublishedRoutes() {
  const { data, error } = await supabase
    .from('routes')
    .select('*')
    .eq('publication_status', 'published')
    .order('published_at', { ascending: false })

  if (error) {
    throw error
  }

  return decorateRoutes((data ?? []) as RouteItem[])
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

  const decorated = await decorateRoutes([data as RouteItem])
  return decorated[0] as RouteItem
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