import * as Location from 'expo-location'
import { BACKGROUND_LOCATION_TASK } from '../tasks/backgroundLocationTask'
import { colors } from '../theme/colors'

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

export async function hasLocationServicesEnabled() {
  return await Location.hasServicesEnabledAsync()
}

export function getLocationFailureMessage(error: unknown) {
  const rawMessage =
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message?: unknown }).message === 'string'
      ? (error as { message: string }).message.toLowerCase()
      : ''

  if (rawMessage.includes('disabled') || rawMessage.includes('services')) {
    return 'Activa el GPS del dispositivo para centrar tu ubicacion.'
  }

  if (rawMessage.includes('denied') || rawMessage.includes('permission')) {
    return 'No hay permiso de ubicacion. Habilitalo desde configuracion.'
  }

  if (rawMessage.includes('timeout')) {
    return 'No se pudo obtener tu ubicacion a tiempo. Intenta de nuevo.'
  }

  return 'No se pudo obtener tu ubicacion actual. Intenta nuevamente.'
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
    return true
  }

  await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
    accuracy: Location.Accuracy.High,
    distanceInterval: 5,
    timeInterval: 5000,
    pausesUpdatesAutomatically: false,
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: 'SummitLog esta registrando tu recorrido',
      notificationBody:
        'Tu ubicacion se esta guardando durante el recorrido activo.',
      notificationColor: colors.primary,
    },
  })

  return await isBackgroundLocationTrackingActive()
}

export async function stopBackgroundLocationTracking() {
  const alreadyStarted = await isBackgroundLocationTrackingActive()
  if (!alreadyStarted) {
    return
  }

  await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK)
}
