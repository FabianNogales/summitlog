import {
  getOfflineTripPointsByTripId,
  getPendingOfflineTripsByUser,
  markOfflineTripFailed,
  markOfflineTripPointsSynced,
  markOfflineTripSynced,
  markOfflineTripSyncing,
  setOfflineTripRemoteId,
} from './offlineTrip.service'
import { getIsOnline } from './connectivity.service'
import {
  createRecordedTripFromOffline,
  createRecordedTripPointsBulk,
} from './trip.service'

export interface TripSyncResult {
  total: number
  synced: number
  failed: number
}

export async function syncPendingTripsForUser(
  userId: string
): Promise<TripSyncResult> {
  const online = await getIsOnline()

  if (!online) {
    throw new Error('No hay conexión a internet para sincronizar.')
  }

  const pendingTrips = await getPendingOfflineTripsByUser(userId)

  let synced = 0
  let failed = 0

  for (const trip of pendingTrips) {
    try {
      await markOfflineTripSyncing(trip.local_id)

      let remoteTripId = trip.remote_id

      if (!remoteTripId) {
        const remoteTrip = await createRecordedTripFromOffline({
          userId: trip.user_id,
          status: trip.status,
          startedAt: trip.started_at,
          endedAt: trip.ended_at,
          distanceM: trip.distance_m,
          durationS: trip.duration_s,
          startLat: trip.start_lat,
          startLng: trip.start_lng,
          endLat: trip.end_lat,
          endLng: trip.end_lng,
        })

        remoteTripId = remoteTrip.id
        await setOfflineTripRemoteId(trip.local_id, remoteTripId)
      }

      const localPoints = await getOfflineTripPointsByTripId(trip.local_id)

      await createRecordedTripPointsBulk(
        remoteTripId,
        localPoints.map((point) => ({
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

      await markOfflineTripPointsSynced(trip.local_id, remoteTripId)
      await markOfflineTripSynced(trip.local_id, remoteTripId)

      synced += 1
    } catch (error) {
      console.error('Error sincronizando trip offline:', trip.local_id, error)
      await markOfflineTripFailed(trip.local_id)
      failed += 1
    }
  }

  return {
    total: pendingTrips.length,
    synced,
    failed,
  }
}