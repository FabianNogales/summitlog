import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from './useAuth'
import { getPendingOfflineTripsByUser } from '../services/offlineTrip.service'
import { subscribeToConnectivity } from '../services/connectivity.service'
import {
  syncPendingTripsForUser,
  type TripSyncResult,
} from '../services/tripSync.service'
import { syncPendingJournalsAndMediaForUser } from '../services/journal.service'
import { getOfflineDb } from '../services/offlineDb.service'

type SyncUiStatus = 'idle' | 'syncing' | 'synced' | 'empty' | 'error'

export function useOfflineSync() {
  const { user } = useAuth()

  const [pendingCount, setPendingCount] = useState(0)
  const [syncing, setSyncing] = useState(false)
  const [syncStatus, setSyncStatus] = useState<SyncUiStatus>('idle')
  const [lastSyncError, setLastSyncError] = useState<string | null>(null)
  const [lastSyncResult, setLastSyncResult] = useState<TripSyncResult | null>(null)

  const syncPromiseRef = useRef<Promise<TripSyncResult> | null>(null)
  const syncingRef = useRef(false)
  const pendingCountRef = useRef(0)
  const lastOnlineRef = useRef<boolean | null>(null)

  useEffect(() => {
    syncingRef.current = syncing
  }, [syncing])

  useEffect(() => {
    pendingCountRef.current = pendingCount
  }, [pendingCount])

  const refreshPendingCount = useCallback(async () => {
    if (!user) {
      setPendingCount((prev) => (prev === 0 ? prev : 0))
      setSyncStatus((prev) => (prev === 'empty' ? prev : 'empty'))
      return 0
    }

    try {
      const pendingTrips = await getPendingOfflineTripsByUser(user.id)
      const db = await getOfflineDb()

      const pendingJournals = await db.getAllAsync<{ local_id: string }>(
        `
          SELECT DISTINCT j.local_id
          FROM offline_journals j
          INNER JOIN offline_recorded_trips t ON j.local_trip_id = t.local_id
          LEFT JOIN offline_journal_media m ON m.local_journal_id = j.local_id
          WHERE j.user_id = ?
          AND t.status = 'completed'
          AND (
            j.sync_status IN ('pending', 'failed', 'syncing')
            OR m.sync_status IN ('pending', 'failed', 'syncing')
          )
        `,
        [user.id]
      )

      const nextPendingCount = pendingTrips.length + pendingJournals.length

      setPendingCount((prev) => (prev === nextPendingCount ? prev : nextPendingCount))
      pendingCountRef.current = nextPendingCount

      if (!syncingRef.current) {
        if (nextPendingCount === 0) {
          setSyncStatus((prev) =>
            prev === 'error' || prev === 'empty' ? prev : 'empty'
          )
        } else {
          setSyncStatus((prev) => (prev === 'empty' ? 'idle' : prev))
        }
      }

      return nextPendingCount
    } catch (error) {
      console.error('Error calculando elementos pendientes:', error)
      return 0
    }
  }, [user])

  useEffect(() => {
    refreshPendingCount()
  }, [refreshPendingCount])

  const syncNow = useCallback(async (): Promise<TripSyncResult> => {
    if (!user) {
      throw new Error('Debes iniciar sesión para sincronizar.')
    }

    if (syncPromiseRef.current) {
      return syncPromiseRef.current
    }

    const syncPromise = (async () => {
      setSyncing(true)
      syncingRef.current = true
      setSyncStatus('syncing')
      setLastSyncError(null)

      const tripResult = await syncPendingTripsForUser(user.id)
      const journalResult = await syncPendingJournalsAndMediaForUser(user.id)

      const combinedResult: TripSyncResult = {
        total: tripResult.total + journalResult.total,
        synced: tripResult.synced + journalResult.synced,
        alreadySynced: tripResult.alreadySynced + journalResult.alreadySynced,
        failed: tripResult.failed + journalResult.failed,
      }

      setLastSyncResult(combinedResult)

      const nextPendingCount = await refreshPendingCount()

      if (combinedResult.total === 0 || nextPendingCount === 0) {
        setSyncStatus('empty')
      } else if (combinedResult.failed > 0) {
        setSyncStatus('error')
        setLastSyncError('Algunos elementos locales no se pudieron sincronizar.')
      } else {
        setSyncStatus('synced')
      }

      return combinedResult
    })()

    syncPromiseRef.current = syncPromise

    try {
      return await syncPromise
    } catch (error: any) {
      setSyncStatus('error')
      setLastSyncError(
        error?.message ?? 'No se pudieron sincronizar los datos locales pendientes.'
      )
      throw error
    } finally {
      syncPromiseRef.current = null
      setSyncing(false)
      syncingRef.current = false
    }
  }, [user, refreshPendingCount])

  useEffect(() => {
    if (!user) return

    lastOnlineRef.current = null

    const unsubscribe = subscribeToConnectivity((isOnline) => {
      const wasOnline = lastOnlineRef.current
      lastOnlineRef.current = isOnline

      if (!isOnline) {
        return
      }

      const becameOnline = wasOnline === false
      const firstOnlineEvent = wasOnline === null

      if (becameOnline || firstOnlineEvent) {
        if (syncingRef.current) {
          return
        }

        syncNow().catch((error) => {
          console.error('Error en sincronización automática:', error)
        })
      }
    })

    return unsubscribe
  }, [user, syncNow])

  return {
    pendingCount,
    syncing,
    syncStatus,
    lastSyncError,
    lastSyncResult,
    refreshPendingCount,
    syncNow,
  }
}