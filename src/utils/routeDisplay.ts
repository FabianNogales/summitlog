import { formatRecordedTripTitleFromDate } from './date'
import { normalizeText } from './text'

const ROUTE_FALLBACK_TITLE = 'Ruta sin título'

interface ResolveRouteDisplayTitleParams {
  displayTitle?: string | null
  journalTitle?: string | null
  tripTitle?: string | null
  routeTitle?: string | null
  tripStartedAt?: string | null
  routePublishedAt?: string | null
  routeCreatedAt?: string | null
}

interface ResolveRouteDisplayImageUrlParams {
  displayImageUrl?: string | null
  coverImageUrl?: string | null
  journalMediaImageUrl?: string | null
}

interface ResolveRouteDisplayDescriptionParams {
  routeDescription?: string | null
}

export function resolveRouteDisplayTitle(params: ResolveRouteDisplayTitleParams) {
  const resolvedTitle =
    normalizeText(params.displayTitle) ??
    normalizeText(params.journalTitle) ??
    normalizeText(params.tripTitle) ??
    normalizeText(params.routeTitle)

  if (resolvedTitle) {
    return resolvedTitle
  }

  return (
    formatRecordedTripTitleFromDate(params.tripStartedAt, { locale: 'es-BO' }) ??
    formatRecordedTripTitleFromDate(params.routePublishedAt, { locale: 'es-BO' }) ??
    formatRecordedTripTitleFromDate(params.routeCreatedAt, { locale: 'es-BO' }) ??
    ROUTE_FALLBACK_TITLE
  )
}

export function resolveRouteDisplayImageUrl(params: ResolveRouteDisplayImageUrlParams) {
  return (
    normalizeText(params.displayImageUrl) ??
    normalizeText(params.coverImageUrl) ??
    normalizeText(params.journalMediaImageUrl)
  )
}

export function resolveRouteDisplayDescription(
  params: ResolveRouteDisplayDescriptionParams
) {
  return normalizeText(params.routeDescription)
}
