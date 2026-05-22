import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from './useAuth'
import { getPendingOfflineTripsByUser } from '../services/offlineTrip.service'
import { subscribeToConnectivity } from '../services/connectivity.service'
import {
  syncPendingTripsForUser,
  type TripSyncResult,
} from '../services/tripSync.service'

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

    const pendingTrips = await getPendingOfflineTripsByUser(user.id)
    const nextPendingCount = pendingTrips.length
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
  }, [user])

  useEffect(() => {
    refreshPendingCount()
  }, [refreshPendingCount])

  const syncNow = useCallback(async (): Promise<TripSyncResult> => {
    if (!user) {
      throw new Error('Debes iniciar sesion.')
    }

    if (syncPromiseRef.current) {
      return syncPromiseRef.current
    }

    const syncPromise = (async () => {
      setSyncing(true)
      syncingRef.current = true
      setSyncStatus((prev) => (prev === 'syncing' ? prev : 'syncing'))
      setLastSyncError((prev) => (prev === null ? prev : null))

      const result = await syncPendingTripsForUser(user.id)
      setLastSyncResult(result)
      const nextPendingCount = await refreshPendingCount()

      if (result.total === 0 || nextPendingCount === 0) {
        setSyncStatus('empty')
      } else if (result.failed > 0) {
        setSyncStatus('error')
        setLastSyncError('Algunos recorridos no se pudieron sincronizar.')
      } else {
        setSyncStatus('synced')
      }

      return result
    })()

    syncPromiseRef.current = syncPromise

    try {
      return await syncPromise
    } catch (error: any) {
      setSyncStatus('error')
      setLastSyncError(
        error?.message ?? 'No se pudieron sincronizar los recorridos pendientes.'
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
        if (syncingRef.current || pendingCountRef.current === 0) {
          return
        }

        syncNow().catch((error) => {
          console.error('Error en sincronizacion automatica:', error)
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
