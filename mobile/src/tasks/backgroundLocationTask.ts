import * as TaskManager from 'expo-task-manager'
import type * as Location from 'expo-location'

import { getActiveTripForBackground } from '../services/backgroundTrackingState.service'
import { addOfflineRecordedTripPointWithAutoOrder } from '../services/offlineTrip.service'

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

    backgroundPersistQueue = backgroundPersistQueue
      .then(async () => {
      const activeLocalTripId = await getActiveTripForBackground()

      if (!activeLocalTripId) {
        return
      }

      for (const location of locations) {
        try {
          await addOfflineRecordedTripPointWithAutoOrder({
            localTripId: activeLocalTripId,
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            altitudeM: location.coords.altitude ?? null,
            accuracyM: location.coords.accuracy ?? null,
            speedMps: location.coords.speed ?? null,
            headingDeg: location.coords.heading ?? null,
            capturedAt: location.timestamp
              ? new Date(location.timestamp).toISOString()
              : new Date().toISOString(),
          })
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
