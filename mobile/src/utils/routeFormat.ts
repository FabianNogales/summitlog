export function formatRouteDistance(distanceMeters: number) {
  return `${(distanceMeters / 1000).toFixed(2)} km`
}

export function formatRouteListDistance(distanceMeters: number) {
  const km = distanceMeters / 1000
  return `${km.toFixed(1)} km`
}

export function formatRouteDuration(durationSeconds: number) {
  const minutes = Math.floor(durationSeconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`
  }

  return `${minutes} min`
}

export function formatRouteListDuration(durationSeconds: number) {
  const minutes = Math.round(durationSeconds / 60)
  if (minutes < 60) return `${minutes} min`

  const hours = Math.floor(minutes / 60)
  const restMinutes = minutes % 60
  if (restMinutes === 0) return `${hours} h`
  return `${hours} h ${restMinutes} min`
}

export function formatRouteDifficultyLabel(value: string | null | undefined) {
  const normalized = value?.trim().toLowerCase()
  if (normalized === 'easy') return 'Facil'
  if (normalized === 'medium') return 'Media'
  if (normalized === 'hard') return 'Dificil'
  return 'Ruta'
}