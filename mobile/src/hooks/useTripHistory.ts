import { useCallback, useEffect, useState } from 'react'
import { useAuth } from './useAuth'
import {
  getCompletedTripsByUser,
  getTripHistoryStats,
  type TripHistoryStats,
} from '../services/history.service'
import { getPendingOfflineTripsByUser } from '../services/offlineTrip.service'
import { getOfflineJournalByTripId } from '../services/journal.service'
import type { OfflineRecordedTrip } from '../types/offlineTrip'
import type { RecordedTrip } from '../types/trip'

const initialStats = {
  completedTrips: 0,
  journalCount: 0,
  totalDistanceKm: 0,
  totalDurationS: 0,
} as TripHistoryStats

interface UseTripHistoryOptions {
  limit?: number
  includeStats?: boolean
}

type TripHistoryModel = RecordedTrip & {
  display_title?: string
  display_description?: string | null
  journal_visibility?: string | null
  route_category?: string | null
  route_difficulty?: string | null
  route_publication_status?: string | null
}

function normalizeText(value?: string | null) {
  const normalized = value?.trim() ?? ''
  return normalized || null
}

async function mapOfflineTripToRecordedTrip(
  trip: OfflineRecordedTrip
): Promise<RecordedTrip> {
  const journal = await getOfflineJournalByTripId(trip.local_id)

  return {
    id: trip.local_id,
    user_id: trip.user_id,
    status: trip.status,
    is_private: true,
    title: journal?.title ?? 'Recorrido pendiente de sincronizar',
    summary: journal?.content ?? null,
    started_at: trip.started_at,
    ended_at: trip.ended_at,
    distance_m: trip.distance_m,
    duration_s: trip.duration_s,
    elevation_gain_m: trip.elevation_gain_m ?? 0,
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
    display_title:
      normalizeText(journal?.title) ?? 'Recorrido pendiente de sincronizar',
    display_description: normalizeText(journal?.content),
    journal_visibility: journal?.visibility ?? null,
    route_category: journal?.category ?? null,
    route_difficulty: journal?.difficulty ?? null,
  } as TripHistoryModel
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

  const loadHistory = useCallback(
    async (isRefresh = false) => {
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
          includeStats
            ? getTripHistoryStats(user.id)
            : Promise.resolve(initialStats),
          getPendingOfflineTripsByUser(user.id),
        ])

        const localTrips = await Promise.all(
          pendingTrips.map((trip) => mapOfflineTripToRecordedTrip(trip))
        )

        const mergedTrips = dedupeTripsById([
          ...localTrips,
          ...loadedTrips,
        ]).sort((a, b) => {
          return new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
        })

        const localDistanceKm = localTrips.reduce((total, trip) => {
          return total + Number(trip.distance_m ?? 0) / 1000
        }, 0)

        const localDurationS = localTrips.reduce((total, trip) => {
          return total + Number(trip.duration_s ?? 0)
        }, 0)

        setTrips(mergedTrips)
        setStats({
          ...loadedStats,
          completedTrips: loadedStats.completedTrips + localTrips.length,
          totalDistanceKm: loadedStats.totalDistanceKm + localDistanceKm,
          totalDurationS:
            Number((loadedStats as any).totalDurationS ?? 0) + localDurationS,
        } as TripHistoryStats)
        setPendingSyncCount(pendingTrips.length)
      } catch (historyError: any) {
        setError(
          historyError?.message ?? 'No se pudo cargar el historial de recorridos.'
        )
      } finally {
        setRefreshing(false)
        setLoading(false)
      }
    },
    [includeStats, limit, user]
  )

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