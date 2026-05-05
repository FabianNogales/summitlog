export function formatRouteDistance(distanceMeters: number) {
  return `${(distanceMeters / 1000).toFixed(2)} km`
}

export function formatRouteDuration(durationSeconds: number) {
  const minutes = Math.floor(durationSeconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`
  }

  return `${minutes} min`
}