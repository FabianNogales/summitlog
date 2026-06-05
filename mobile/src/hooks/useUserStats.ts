import { useCallback, useEffect, useState } from 'react'
import { useAuth } from './useAuth'
import { getUserStats, type UserStats } from '../services/history.service'
import { getPendingOfflineTripsByUser } from '../services/offlineTrip.service'

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
  const [pendingSyncCount, setPendingSyncCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadStats = useCallback(async () => {
    if (!user) {
      setStats(initialStats)
      setPendingSyncCount(0)
      setError(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const [userStats, pendingTrips] = await Promise.all([
        getUserStats(user.id),
        getPendingOfflineTripsByUser(user.id),
      ])

      setStats(userStats)
      setPendingSyncCount(pendingTrips.length)
    } catch (catchError: any) {
      setError(catchError?.message ?? 'No se pudieron cargar las estadísticas')
      setStats(initialStats)
      setPendingSyncCount(0)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  return {
    stats,
    pendingSyncCount,
    loading,
    error,
    refreshStats: loadStats,
  }
}
