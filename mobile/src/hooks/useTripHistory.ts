import { useCallback, useEffect, useState } from 'react'
import { useAuth } from './useAuth'
import {
  getCompletedTripsByUser,
  getTripHistoryStats,
  type TripHistoryStats,
} from '../services/history.service'
import { getPendingOfflineTripsByUser } from '../services/offlineTrip.service'
import type { RecordedTrip } from '../types/trip'

const initialStats: TripHistoryStats = {
  completedTrips: 0,
  journalCount: 0,
  totalDistanceKm: 0,
  totalDurationS: 0,
}

interface UseTripHistoryOptions {
  limit?: number
  includeStats?: boolean
}

export function useTripHistory(options: UseTripHistoryOptions = {}) {
  const { user } = useAuth()
  const { limit, includeStats = true } = options

  const [trips, setTrips] = useState<RecordedTrip[]>([])
  const [stats, setStats] = useState<TripHistoryStats>(initialStats)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingSyncCount, setPendingSyncCount] = useState(0)

  function dedupeTripsById(items: RecordedTrip[]) {
    const seen = new Set<string>()

    return items.filter((trip) => {
      const key = trip.remote_id ?? trip.id

      if (seen.has(key)) {
        return false
      }

      seen.add(key)
      return true
    })
  }

  const loadHistory = useCallback(async (isRefresh = false) => {
    if (!user) {
      setTrips([])
      setStats(initialStats)
      setError(null)
      setRefreshing(false)
      setLoading(false)
      setPendingSyncCount(0)
      return
    }

    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      setError(null)

      const [loadedTrips, loadedStats, pendingTrips] = await Promise.all([
        getCompletedTripsByUser(user.id, { limit }),
        includeStats ? getTripHistoryStats(user.id) : Promise.resolve(initialStats),
        getPendingOfflineTripsByUser(user.id),
      ])

      const completedTrips = dedupeTripsById(loadedTrips).sort((a, b) => {
        return new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
      })

      setTrips(completedTrips)
      setStats(loadedStats)
      setPendingSyncCount(pendingTrips.length)
    } catch (historyError: any) {
      setError(historyError?.message ?? 'No se pudo cargar el historial de recorridos.')
    } finally {
      setRefreshing(false)
      setLoading(false)
    }
  }, [includeStats, limit, user])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  return {
    trips,
    stats,
    loading,
    refreshing,
    error,
    pendingSyncCount,
    refreshHistory: () => loadHistory(true),
  }
}
