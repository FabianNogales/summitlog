export type RouteDifficultyFilter = 'all' | 'easy' | 'medium' | 'hard'

export interface RouteFilters {
  difficulty: RouteDifficultyFilter
  maxDistanceKm: string
  maxDurationMin: string
}