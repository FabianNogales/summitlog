import * as TaskManager from 'expo-task-manager'
import type * as Location from 'expo-location'

import { getActiveTripForBackground } from '../services/backgroundTrackingState.service'
import {
  addOfflineRecordedTripPointWithAutoOrder,
  getOfflineRecordedTripById,
  getLatestOfflineTripPointByTripId,
} from '../services/offlineTrip.service'
import { shouldPersistGpsPoint } from '../utils/gpsQuality'

export const BACKGROUND_LOCATION_TASK = 'summitlog-background-location-task'

let backgroundPersistQueue: Promise<void> = Promise.resolve()

if (!TaskManager.isTaskDefined(BACKGROUND_LOCATION_TASK)) {
  TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
    if (error) {
      console.error('[BackgroundLocationTask] task error:', error.message)
      return
    }

    const locations = (data as { locations?: Location.LocationObject[] } | null)
      ?.locations

    if (!locations || locations.length === 0) {
      return
    }

    // Serializa lotes del task para que dos ejecuciones no calculen el mismo point_order.
    backgroundPersistQueue = backgroundPersistQueue
      .then(async () => {
        const activeLocalTripId = await getActiveTripForBackground()

        if (!activeLocalTripId) {
          return
        }

        const activeTrip = await getOfflineRecordedTripById(activeLocalTripId)

        if (!activeTrip || activeTrip.status !== 'recording') {
          return
        }

        const latestPoint = await getLatestOfflineTripPointByTripId(activeLocalTripId)
        let previousPoint: {
          latitude: number
          longitude: number
          capturedAt: string | null
        } | null = latestPoint
          ? {
              latitude: latestPoint.latitude,
              longitude: latestPoint.longitude,
              capturedAt: latestPoint.captured_at ?? null,
            }
          : null

        for (const location of locations) {
          try {
            const capturedAtMs = location.timestamp ?? Date.now()
            const candidatePoint = {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              accuracyM: location.coords.accuracy ?? null,
              capturedAt: capturedAtMs,
            }

            const validation = shouldPersistGpsPoint(candidatePoint, previousPoint)

            if (!validation.shouldPersist) {
              continue
            }

            const capturedAtIso = new Date(capturedAtMs).toISOString()

            await addOfflineRecordedTripPointWithAutoOrder({
              localTripId: activeLocalTripId,
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              altitudeM: location.coords.altitude ?? null,
              accuracyM: location.coords.accuracy ?? null,
              speedMps: location.coords.speed ?? null,
              headingDeg: location.coords.heading ?? null,
              capturedAt: capturedAtIso,
            })

            previousPoint = {
              latitude: candidatePoint.latitude,
              longitude: candidatePoint.longitude,
              capturedAt: capturedAtIso,
            }
          } catch (persistError: any) {
            console.error(
              '[BackgroundLocationTask] point persist error:',
              persistError?.message ?? 'unknown'
            )
          }
        }
      })
      .catch((queueError: any) => {
        console.error(
          '[BackgroundLocationTask] queue error:',
          queueError?.message ?? 'unknown'
        )
      })

    await backgroundPersistQueue
  })
}
