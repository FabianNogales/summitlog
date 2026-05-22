import * as Location from 'expo-location'
import { BACKGROUND_LOCATION_TASK } from '../tasks/backgroundLocationTask'

export async function requestForegroundLocationPermission() {
  return await Location.requestForegroundPermissionsAsync()
}

export async function requestBackgroundLocationPermission() {
  return await Location.requestBackgroundPermissionsAsync()
}

export async function getCurrentLocation() {
  return await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  })
}

export async function startForegroundLocationWatcher(
  onLocation: (location: Location.LocationObject) => void | Promise<void>,
  onError?: (reason: string) => void
) {
  return await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.High,
      distanceInterval: 2,
    },
    onLocation,
    onError
  )
}

export async function isBackgroundLocationTrackingActive() {
  return Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK)
}

export async function startBackgroundLocationTracking() {
  const alreadyStarted = await isBackgroundLocationTrackingActive()
  if (alreadyStarted) {
    return
  }

  await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
    accuracy: Location.Accuracy.Balanced,
    distanceInterval: 5,
    timeInterval: 5000,
    pausesUpdatesAutomatically: false,
    foregroundService: {
      notificationTitle: 'SummitLog esta registrando tu recorrido',
      notificationBody: 'Tu ubicacion se usa para guardar el recorrido activo',
      notificationColor: '#2E8B73',
    },
  })
}

export async function stopBackgroundLocationTracking() {
  const alreadyStarted = await isBackgroundLocationTrackingActive()
  if (!alreadyStarted) {
    return
  }

  await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK)
}
