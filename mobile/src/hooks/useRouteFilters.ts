import { useMemo, useState } from 'react'
import type { RouteItem } from '../types/route'
import type { RouteDifficultyFilter, RouteFilters } from '../types/routeFilters'

const DEFAULT_FILTERS: RouteFilters = {
  difficulty: 'all',
  maxDistanceKm: '',
  maxDurationMin: '',
}
const MAX_DISTANCE_KM_LIMIT = 500
const MAX_DURATION_MIN_LIMIT = 1440

function normalizeDifficulty(value: string | null | undefined) {
  if (!value) return ''

  const normalized = value.trim().toLowerCase()

  if (normalized === 'easy' || normalized === 'medium' || normalized === 'hard') {
    return normalized
  }

  return normalized
}

export function useRouteFilters(routes: RouteItem[]) {
  const [filters, setFilters] = useState<RouteFilters>(DEFAULT_FILTERS)
  const [searchQuery, setSearchQuery] = useState('')

  function sanitizeNumericFilter(value: string, maxLimit: number) {
    const normalized = value.replace(/[^0-9]/g, '')
    if (!normalized) return ''

    const numericValue = Number(normalized)
    if (!Number.isFinite(numericValue)) return ''

    return String(Math.min(maxLimit, numericValue))
  }

  function setDifficulty(difficulty: RouteDifficultyFilter) {
    setFilters((prev) => {
      if (prev.difficulty === difficulty) {
        return prev
      }

      return {
        ...prev,
        difficulty,
      }
    })
  }

  function setMaxDistanceKm(value: string) {
    const nextValue = sanitizeNumericFilter(value, MAX_DISTANCE_KM_LIMIT)
    setFilters((prev) => {
      if (prev.maxDistanceKm === nextValue) {
        return prev
      }

      return {
        ...prev,
        maxDistanceKm: nextValue,
      }
    })
  }

  function setMaxDurationMin(value: string) {
    const nextValue = sanitizeNumericFilter(value, MAX_DURATION_MIN_LIMIT)
    setFilters((prev) => {
      if (prev.maxDurationMin === nextValue) {
        return prev
      }

      return {
        ...prev,
        maxDurationMin: nextValue,
      }
    })
  }

  function clearFilters() {
    setFilters(DEFAULT_FILTERS)
    setSearchQuery('')
  }

  const filteredRoutes = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase()

    return routes.filter((route) => {
      const difficultyOk =
        filters.difficulty === 'all' ||
        normalizeDifficulty(route.difficulty) === filters.difficulty

      const maxDistanceKm = Number(filters.maxDistanceKm)
      const distanceKm = Number(route.distance_m ?? 0) / 1000
      const distanceOk =
        !filters.maxDistanceKm ||
        (Number.isFinite(maxDistanceKm) && distanceKm <= maxDistanceKm)

      const maxDurationMin = Number(filters.maxDurationMin)
      const durationMin = Number(route.duration_s ?? 0) / 60
      const durationOk =
        !filters.maxDurationMin ||
        (Number.isFinite(maxDurationMin) && durationMin <= maxDurationMin)

      const haystack = `${route.title ?? ''} ${route.description ?? ''} ${route.category ?? ''}`
        .trim()
        .toLowerCase()
      const searchOk = !normalizedSearch || haystack.includes(normalizedSearch)

      return difficultyOk && distanceOk && durationOk && searchOk
    })
  }, [routes, filters, searchQuery])

  return {
    filters,
    searchQuery,
    filteredRoutes,
    setSearchQuery,
    setDifficulty,
    setMaxDistanceKm,
    setMaxDurationMin,
    clearFilters,
  }
}
