export function formatTripDistance(distanceMeters: number | null | undefined) {
  const value = Number(distanceMeters ?? 0)
  return `${(value / 1000).toFixed(2)} km`
}

export function formatTripDuration(durationSeconds: number | null | undefined) {
  const value = Number(durationSeconds ?? 0)
  const minutes = Math.floor(value / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`
  }

  return `${minutes} min`
}

export function formatTripElevation(elevationMeters: number | null | undefined) {
  if (elevationMeters == null || !Number.isFinite(Number(elevationMeters))) {
    return 'No disponible'
  }

  return `${Number(elevationMeters).toFixed(0)} m`
}

export function formatTripAltitude(altitudeMeters: number | null | undefined) {
  if (altitudeMeters == null || !Number.isFinite(Number(altitudeMeters))) {
    return 'No disponible'
  }

  return `${Number(altitudeMeters).toFixed(0)} m`
}

export function formatTripDate(dateString?: string | null) {
  if (!dateString) {
    return 'Sin fecha'
  }

  return new Date(dateString).toLocaleDateString()
}

export function formatTripDateTime(dateString?: string | null) {
  if (!dateString) {
    return 'Sin fecha'
  }

  return new Date(dateString).toLocaleString()
}

export function formatTripDifficulty(value?: string | null) {
  switch (value) {
    case 'easy':
      return 'Fácil'
    case 'medium':
      return 'Media'
    case 'hard':
      return 'Difícil'
    default:
      return 'No definida'
  }
}

export function formatTripVisibility(value?: string | null) {
  switch (value) {
    case 'public':
      return 'Pública'
    case 'private':
      return 'Privada'
    default:
      return 'No definida'
  }
}

export function formatTripStatus(value?: string | null) {
  switch (value) {
    case 'completed':
      return 'Completado'
    case 'recording':
      return 'En curso'
    case 'cancelled':
      return 'Cancelado'
    default:
      return 'No definido'
  }
}