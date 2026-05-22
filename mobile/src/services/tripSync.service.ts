import {
  getOfflineRecordedTripById,
  getPendingOfflineTripPointsByTripId,
  getPendingOfflineTripsByUser,
  markOfflineTripFailed,
  markOfflineTripPointsSyncedByPointOrders,
  markOfflineTripSynced,
  markOfflineTripSyncing,
  setOfflineTripRemoteId,
} from './offlineTrip.service'
import { getIsOnline } from './connectivity.service'
import {
  createRecordedTripFromOffline,
  createRecordedTripPointsBulk,
  getRecordedTripPointOrdersByTripId,
} from './trip.service'

export interface TripSyncResult {
  total: number
  synced: number
  alreadySynced: number
  failed: number
}

const inFlightSyncByUser = new Map<string, Promise<TripSyncResult>>()

export async function syncPendingTripsForUser(
  userId: string
): Promise<TripSyncResult> {
  const activeSync = inFlightSyncByUser.get(userId)
  if (activeSync) {
    return activeSync
  }

  const syncPromise = runSyncPendingTripsForUser(userId).finally(() => {
    inFlightSyncByUser.delete(userId)
  })

  inFlightSyncByUser.set(userId, syncPromise)
  return syncPromise
}

async function runSyncPendingTripsForUser(
  userId: string
): Promise<TripSyncResult> {
  const online = await getIsOnline()

  if (!online) {
    throw new Error('No hay conexiÃ³n a internet para sincronizar.')
  }

  const pendingTrips = await getPendingOfflineTripsByUser(userId)

  let synced = 0
  let alreadySynced = 0
  let failed = 0

  for (const trip of pendingTrips) {
    try {
      const claimed = await markOfflineTripSyncing(trip.local_id)
      if (!claimed) {
        continue
      }

      const currentTrip = await getOfflineRecordedTripById(trip.local_id)
      if (!currentTrip) {
        continue
      }

      let remoteTripId = currentTrip.remote_id

      if (!remoteTripId) {
        const remoteTrip = await createRecordedTripFromOffline({
          userId: currentTrip.user_id,
          status: currentTrip.status,
          startedAt: currentTrip.started_at,
          endedAt: currentTrip.ended_at,
          distanceM: currentTrip.distance_m,
          durationS: currentTrip.duration_s,
          startLat: currentTrip.start_lat,
          startLng: currentTrip.start_lng,
          endLat: currentTrip.end_lat,
          endLng: currentTrip.end_lng,
        })

        remoteTripId = remoteTrip.id
        const remoteIdSaved = await setOfflineTripRemoteId(
          currentTrip.local_id,
          remoteTripId
        )

        if (!remoteIdSaved) {
          throw new Error(
            'No se pudo guardar el remote_id localmente despues de crear el recorrido remoto.'
          )
        }

        const persistedTrip = await getOfflineRecordedTripById(currentTrip.local_id)
        if (!persistedTrip?.remote_id || persistedTrip.remote_id !== remoteTripId) {
          throw new Error('remote_id local inconsistente despues de crear recorrido remoto.')
        }
      }

      const localPoints = await getPendingOfflineTripPointsByTripId(
        currentTrip.local_id
      )
      if (localPoints.length === 0) {
        await markOfflineTripSynced(currentTrip.local_id, remoteTripId)
        alreadySynced += 1
        continue
      }

      const existingRemoteOrders = new Set(
        await getRecordedTripPointOrdersByTripId(remoteTripId)
      )

      const pointsToInsert = localPoints.filter(
        (point) => !existingRemoteOrders.has(point.point_order)
      )

      if (pointsToInsert.length > 0) {
        await createRecordedTripPointsBulk(
          remoteTripId,
          pointsToInsert.map((point) => ({
            pointOrder: point.point_order,
            latitude: point.latitude,
            longitude: point.longitude,
            altitudeM: point.altitude_m,
            accuracyM: point.accuracy_m,
            speedMps: point.speed_mps,
            headingDeg: point.heading_deg,
            capturedAt: point.captured_at,
          }))
        )
      }

      const remoteOrdersAfterSync = new Set(
        await getRecordedTripPointOrdersByTripId(remoteTripId)
      )

      const localOrders = Array.from(
        new Set(localPoints.map((point) => point.point_order))
      )

      const syncedOrders = localOrders.filter((order) =>
        remoteOrdersAfterSync.has(order)
      )

      await markOfflineTripPointsSyncedByPointOrders(
        currentTrip.local_id,
        remoteTripId,
        syncedOrders
      )

      if (syncedOrders.length !== localOrders.length) {
        throw new Error(
          'El recorrido remoto sigue incompleto. Faltan puntos por sincronizar.'
        )
      }

      await markOfflineTripSynced(currentTrip.local_id, remoteTripId)

      if (pointsToInsert.length === 0) {
        alreadySynced += 1
      } else {
        synced += 1
      }
    } catch (error) {
      console.error('Error sincronizando trip offline:', trip.local_id, error)
      await markOfflineTripFailed(trip.local_id)
      failed += 1
    }
  }

  return {
    total: pendingTrips.length,
    synced,
    alreadySynced,
    failed,
  }
}
