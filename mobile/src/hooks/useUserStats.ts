import { useCallback, useEffect, useState } from 'react'
import { useAuth } from './useAuth'
import { getUserStats, type UserStats } from '../services/history.service'

const initialStats: UserStats = {
  totalTrips: 0,
  completedTrips: 0,
  totalDistanceKm: 0,
  totalDurationS: 0,
  averageDistanceKm: null,
  averageDurationMinutes: null,
  lastActivityAt: null,
  totalGpsPoints: null,
}

export function useUserStats() {
  const { user } = useAuth()
  const [stats, setStats] = useState<UserStats>(initialStats)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadStats = useCallback(async () => {
    if (!user) {
      setStats(initialStats)
      setError(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const userStats = await getUserStats(user.id)
      setStats(userStats)
    } catch (catchError: any) {
      setError(catchError?.message ?? 'No se pudieron cargar las estadísticas')
      setStats(initialStats)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  return {
    stats,
    loading,
    error,
    refreshStats: loadStats,
  }
}
