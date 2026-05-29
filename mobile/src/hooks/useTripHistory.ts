import { useCallback, useEffect, useState } from 'react'
import { useAuth } from './useAuth'
import {
  getCompletedTripsByUser,
  getTripHistoryStats,
  type TripHistoryStats,
} from '../services/history.service'
import { getPendingOfflineTripsByUser } from '../services/offlineTrip.service'
import type { OfflineRecordedTrip } from '../types/offlineTrip'
import type { RecordedTrip } from '../types/trip'

const initialStats: TripHistoryStats = {
  completedTrips: 0,
  journalCount: 0,
  totalDistanceKm: 0,
}

interface UseTripHistoryOptions {
  limit?: number
  includeStats?: boolean
}

function mapOfflineTripToRecordedTrip(trip: OfflineRecordedTrip): RecordedTrip {
  return {
    id: trip.local_id,
    user_id: trip.user_id,
    status: trip.status,
    is_private: true,
    title: 'Recorrido pendiente de sincronizar',
    summary: null,
    started_at: trip.started_at,
    ended_at: trip.ended_at,
    distance_m: trip.distance_m,
    duration_s: trip.duration_s,
    elevation_gain_m: null,
    avg_speed_mps: null,
    max_speed_mps: null,
    start_lat: trip.start_lat,
    start_lng: trip.start_lng,
    end_lat: trip.end_lat,
    end_lng: trip.end_lng,
    created_at: trip.created_at,
    updated_at: trip.updated_at,
    local_id: trip.local_id,
    remote_id: trip.remote_id,
    sync_status: trip.sync_status,
    is_offline: true,
  } as RecordedTrip
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

      const localTrips = pendingTrips.map(mapOfflineTripToRecordedTrip)

      const mergedTrips = dedupeTripsById([
        ...localTrips,
        ...loadedTrips,
      ]).sort((a, b) => {
        return new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
      })

      setTrips(mergedTrips)
      setStats({
        ...loadedStats,
        completedTrips: loadedStats.completedTrips + localTrips.length,
      })
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
