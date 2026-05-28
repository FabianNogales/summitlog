import { useCallback, useEffect, useState } from 'react'
import { useAuth } from './useAuth'
import {
  getCompletedTripsByUser,
  getTripHistoryStats,
  type TripHistoryStats,
} from '../services/history.service'
import { getPendingOfflineTripsByUser } from '../services/offlineTrip.service'
import type { RecordedTrip } from '../types/trip'

export function useTripHistory() {
  const { user } = useAuth()

  const [trips, setTrips] = useState<RecordedTrip[]>([])
  const [stats, setStats] = useState<TripHistoryStats>({
    completedTrips: 0,
    journalCount: 0,
    totalDistanceKm: 0,
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingSyncCount, setPendingSyncCount] = useState(0)

  function dedupeTripsById(items: RecordedTrip[]) {
    const seen = new Set<string>()
    return items.filter((trip) => {
      if (seen.has(trip.id)) {
        return false
      }

      seen.add(trip.id)
      return true
    })
  }

  const loadHistory = useCallback(async (isRefresh = false) => {
    if (!user) {
      setTrips([])
      setStats({
        completedTrips: 0,
        journalCount: 0,
        totalDistanceKm: 0,
      })
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
        getCompletedTripsByUser(user.id),
        getTripHistoryStats(user.id),
        getPendingOfflineTripsByUser(user.id),
      ])

      const dedupedTrips = dedupeTripsById(loadedTrips)
      setTrips(dedupedTrips)
      setStats(loadedStats)
      setPendingSyncCount(pendingTrips.length)
    } catch (historyError: any) {
      setError(historyError?.message ?? 'No se pudo cargar el historial de recorridos.')
    } finally {
      setRefreshing(false)
      setLoading(false)
    }
  }, [user])

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
