import { useMemo, useState } from 'react'
import type { RouteItem } from '../types/route'
import type { RouteDifficultyFilter, RouteFilters } from '../types/routeFilters'

const DEFAULT_FILTERS: RouteFilters = {
  difficulty: 'all',
  maxDistanceKm: '',
  maxDurationMin: '',
}

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

  function setDifficulty(difficulty: RouteDifficultyFilter) {
    setFilters((prev) => ({
      ...prev,
      difficulty,
    }))
  }

  function setMaxDistanceKm(value: string) {
    setFilters((prev) => ({
      ...prev,
      maxDistanceKm: value,
    }))
  }

  function setMaxDurationMin(value: string) {
    setFilters((prev) => ({
      ...prev,
      maxDurationMin: value,
    }))
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
