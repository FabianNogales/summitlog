import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from './useAuth'
import { getPendingOfflineTripsByUser } from '../services/offlineTrip.service'
import { subscribeToConnectivity } from '../services/connectivity.service'
import {
  syncPendingTripsForUser,
  type TripSyncResult,
} from '../services/tripSync.service'

export function useOfflineSync() {
  const { user } = useAuth()

  const [pendingCount, setPendingCount] = useState(0)
  const [syncing, setSyncing] = useState(false)
  const syncPromiseRef = useRef<Promise<TripSyncResult> | null>(null)

  const refreshPendingCount = useCallback(async () => {
    if (!user) {
      setPendingCount(0)
      return
    }

    const pendingTrips = await getPendingOfflineTripsByUser(user.id)
    setPendingCount(pendingTrips.length)
  }, [user])

  useEffect(() => {
    refreshPendingCount()
  }, [refreshPendingCount])

  const syncNow = useCallback(async (): Promise<TripSyncResult> => {
    if (!user) {
      throw new Error('Debes iniciar sesión.')
    }

    if (syncPromiseRef.current) {
      return syncPromiseRef.current
    }

    const syncPromise = (async () => {
      setSyncing(true)
      const result = await syncPendingTripsForUser(user.id)
      await refreshPendingCount()
      return result
    })()

    syncPromiseRef.current = syncPromise

    try {
      return await syncPromise
    } finally {
      syncPromiseRef.current = null
      setSyncing(false)
    }
  }, [user, refreshPendingCount])

  useEffect(() => {
    if (!user) return

    const unsubscribe = subscribeToConnectivity((isOnline) => {
      if (isOnline) {
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
    refreshPendingCount,
    syncNow,
  }
}
