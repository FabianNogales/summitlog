export interface Coordinate {
  latitude: number
  longitude: number
}

export function calculateDistanceInMeters(
  from: Coordinate,
  to: Coordinate
): number {
  const earthRadius = 6371000

  const toRadians = (value: number) => (value * Math.PI) / 180

  const deltaLat = toRadians(to.latitude - from.latitude)
  const deltaLng = toRadians(to.longitude - from.longitude)

  const fromLat = toRadians(from.latitude)
  const toLat = toRadians(to.latitude)

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(fromLat) *
      Math.cos(toLat) *
      Math.sin(deltaLng / 2) *
      Math.sin(deltaLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return earthRadius * c
}