import AsyncStorage from '@react-native-async-storage/async-storage'

const ACTIVE_BACKGROUND_TRIP_ID_KEY = 'summitlog_active_background_trip_id'

export async function setActiveTripForBackground(localTripId: string) {
  await AsyncStorage.setItem(ACTIVE_BACKGROUND_TRIP_ID_KEY, localTripId)
}

export async function getActiveTripForBackground() {
  return AsyncStorage.getItem(ACTIVE_BACKGROUND_TRIP_ID_KEY)
}

export async function clearActiveTripForBackground() {
  await AsyncStorage.removeItem(ACTIVE_BACKGROUND_TRIP_ID_KEY)
}
