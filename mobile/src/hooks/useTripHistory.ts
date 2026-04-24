import { useCallback, useEffect, useState } from 'react'
import { useAuth } from './useAuth'
import {
  getCompletedTripsByUser,
  getTripHistoryStats,
  type TripHistoryStats,
} from '../services/history.service'
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

  const loadHistory = useCallback(async () => {
    if (!user) {
      setTrips([])
      setStats({
        completedTrips: 0,
        journalCount: 0,
        totalDistanceKm: 0,
      })
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      const [loadedTrips, loadedStats] = await Promise.all([
        getCompletedTripsByUser(user.id),
        getTripHistoryStats(user.id),
      ])

      setTrips(loadedTrips)
      setStats(loadedStats)
    } finally {
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
    refreshHistory: loadHistory,
  }
}