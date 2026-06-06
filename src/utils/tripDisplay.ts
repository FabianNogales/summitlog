import { formatRecordedTripFallbackTitle } from './date'
import { normalizeText } from './text'

interface ResolveTripDisplayTitleParams {
  displayTitle?: string | null
  journalTitle?: string | null
  tripTitle?: string | null
  routeTitle?: string | null
  startedAt?: string | null
  fallbackTitle?: string
  fallbackDateLocale?: Intl.LocalesArgument
  fallbackDateOptions?: Intl.DateTimeFormatOptions
}

interface ResolveTripDisplayDescriptionParams {
  displayDescription?: string | null
  journalContent?: string | null
  routeDescription?: string | null
  tripSummary?: string | null
}

export function resolveTripDisplayTitle(params: ResolveTripDisplayTitleParams) {
  const resolvedTitle =
    normalizeText(params.displayTitle) ??
    normalizeText(params.journalTitle) ??
    normalizeText(params.tripTitle) ??
    normalizeText(params.routeTitle)

  if (resolvedTitle) {
    return resolvedTitle
  }

  if (params.fallbackTitle) {
    return params.fallbackTitle
  }

  return formatRecordedTripFallbackTitle(params.startedAt, {
    locale: params.fallbackDateLocale,
    dateOptions: params.fallbackDateOptions,
  })
}

export function resolveTripDisplayDescription(
  params: ResolveTripDisplayDescriptionParams
) {
  return (
    normalizeText(params.displayDescription) ??
    normalizeText(params.journalContent) ??
    normalizeText(params.routeDescription) ??
    normalizeText(params.tripSummary)
  )
}