import { calculateDistanceInMeters } from './distance'

export const GPS_MAX_ACCURACY_M = 35
export const GPS_MAX_REASONABLE_SPEED_MPS = 8
export const GPS_MIN_DISTANCE_M = 2

type CapturedAtInput = string | number | Date | null | undefined

export interface GpsPointCandidate {
  latitude: number | null | undefined
  longitude: number | null | undefined
  accuracyM?: number | null
  capturedAt?: CapturedAtInput
}

export interface GpsPointValidationResult {
  shouldPersist: boolean
  reason:
    | 'ok'
    | 'invalid_coordinates'
    | 'invalid_accuracy'
    | 'poor_accuracy'
    | 'duplicate'
    | 'too_close'
    | 'impossible_jump'
}

function isFiniteCoordinate(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function toTimestampMs(value: CapturedAtInput): number | null {
  if (value == null) return null

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }

  if (value instanceof Date) {
    const ms = value.getTime()
    return Number.isFinite(ms) ? ms : null
  }

  if (typeof value === 'string') {
    const ms = Date.parse(value)
    return Number.isFinite(ms) ? ms : null
  }

  return null
}

export function shouldPersistGpsPoint(
  candidate: GpsPointCandidate,
  previousPoint?: GpsPointCandidate | null
): GpsPointValidationResult {
  if (
    !isFiniteCoordinate(candidate.latitude) ||
    !isFiniteCoordinate(candidate.longitude)
  ) {
    return { shouldPersist: false, reason: 'invalid_coordinates' }
  }

  const candidateAccuracy = candidate.accuracyM

  if (candidateAccuracy != null && !Number.isFinite(candidateAccuracy)) {
    return { shouldPersist: false, reason: 'invalid_accuracy' }
  }

  if (candidateAccuracy != null && candidateAccuracy > GPS_MAX_ACCURACY_M) {
    return { shouldPersist: false, reason: 'poor_accuracy' }
  }

  if (
    !previousPoint ||
    !isFiniteCoordinate(previousPoint.latitude) ||
    !isFiniteCoordinate(previousPoint.longitude)
  ) {
    return { shouldPersist: true, reason: 'ok' }
  }

  if (
    previousPoint.latitude === candidate.latitude &&
    previousPoint.longitude === candidate.longitude
  ) {
    return { shouldPersist: false, reason: 'duplicate' }
  }

  const distanceM = calculateDistanceInMeters(
    {
      latitude: previousPoint.latitude,
      longitude: previousPoint.longitude,
    },
    {
      latitude: candidate.latitude,
      longitude: candidate.longitude,
    }
  )

  if (distanceM < GPS_MIN_DISTANCE_M) {
    return { shouldPersist: false, reason: 'too_close' }
  }

  const previousTimestampMs = toTimestampMs(previousPoint.capturedAt)
  const candidateTimestampMs = toTimestampMs(candidate.capturedAt)

  if (
    previousTimestampMs != null &&
    candidateTimestampMs != null &&
    candidateTimestampMs > previousTimestampMs
  ) {
    const elapsedS = (candidateTimestampMs - previousTimestampMs) / 1000

    if (elapsedS > 0) {
      const speedMps = distanceM / elapsedS

      if (speedMps > GPS_MAX_REASONABLE_SPEED_MPS) {
        return { shouldPersist: false, reason: 'impossible_jump' }
      }
    }
  }

  return { shouldPersist: true, reason: 'ok' }
}
