import * as Location from 'expo-location'

export async function requestForegroundLocationPermission() {
  return await Location.requestForegroundPermissionsAsync()
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