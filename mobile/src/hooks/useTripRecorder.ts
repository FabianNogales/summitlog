import { useEffect, useRef, useState } from 'react'
import type * as Location from 'expo-location'

import { useAuth } from './useAuth'
import {
  getCurrentLocation,
  requestForegroundLocationPermission,
  startForegroundLocationWatcher,
} from '../services/location.service'
import {
  createRecordedTrip,
  createRecordedTripPoint,
  finishRecordedTrip,
} from '../services/trip.service'
import { calculateDistanceInMeters } from '../utils/distance'

type RecorderStatus = 'idle' | 'starting' | 'tracking' | 'finishing'

interface LastCoords {
  latitude: number
  longitude: number
}

export function useTripRecorder() {
  const { user } = useAuth()

  const subscriptionRef = useRef<Location.LocationSubscription | null>(null)
  const tripIdRef = useRef<string | null>(null)
  const pointOrderRef = useRef(0)
  const startedAtRef = useRef<string | null>(null)
  const lastCoordsRef = useRef<LastCoords | null>(null)
  const totalDistanceRef = useRef(0)

  const [status, setStatus] = useState<RecorderStatus>('idle')
  const [activeTripId, setActiveTripId] = useState<string | null>(null)
  const [pointCount, setPointCount] = useState(0)
  const [lastLatitude, setLastLatitude] = useState<number | null>(null)
  const [lastLongitude, setLastLongitude] = useState<number | null>(null)
  const [totalDistanceM, setTotalDistanceM] = useState(0)

  async function persistPoint(location: Location.LocationObject) {
    const currentTripId = tripIdRef.current
    if (!currentTripId) return

    const currentCoords = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    }

    const previousCoords = lastCoordsRef.current

    if (previousCoords) {
      const segmentDistance = calculateDistanceInMeters(previousCoords, currentCoords)
      totalDistanceRef.current += segmentDistance
      setTotalDistanceM(totalDistanceRef.current)
    }

    const currentPointOrder = pointOrderRef.current

    await createRecordedTripPoint({
      recordedTripId: currentTripId,
      pointOrder: currentPointOrder,
      latitude: currentCoords.latitude,
      longitude: currentCoords.longitude,
      altitudeM: location.coords.altitude ?? null,
      accuracyM: location.coords.accuracy ?? null,
      speedMps: location.coords.speed ?? null,
      headingDeg: location.coords.heading ?? null,
      capturedAt: location.timestamp
        ? new Date(location.timestamp).toISOString()
        : new Date().toISOString(),
    })

    pointOrderRef.current = currentPointOrder + 1
    setPointCount(pointOrderRef.current)

    lastCoordsRef.current = currentCoords
    setLastLatitude(currentCoords.latitude)
    setLastLongitude(currentCoords.longitude)
  }

  async function startTracking() {
    if (!user) {
      throw new Error('Debes iniciar sesión para registrar un recorrido.')
    }

    if (status === 'starting' || status === 'tracking' || status === 'finishing') {
      return
    }

    setStatus('starting')

    const permission = await requestForegroundLocationPermission()

    if (!permission.granted) {
      setStatus('idle')
      throw new Error(
        'No es posible iniciar el seguimiento sin permiso de ubicación.'
      )
    }

    const currentLocation = await getCurrentLocation()

    const startedAt = new Date().toISOString()

    const trip = await createRecordedTrip({
      userId: user.id,
      startLat: currentLocation.coords.latitude,
      startLng: currentLocation.coords.longitude,
    })

    tripIdRef.current = trip.id
    startedAtRef.current = startedAt
    setActiveTripId(trip.id)

    pointOrderRef.current = 0
    totalDistanceRef.current = 0
    setPointCount(0)
    setTotalDistanceM(0)

    lastCoordsRef.current = null
    setLastLatitude(null)
    setLastLongitude(null)

    await persistPoint(currentLocation)

    subscriptionRef.current = await startForegroundLocationWatcher(
      (location) => {
        persistPoint(location).catch((error) => {
          console.error('Error guardando punto GPS:', error)
        })
      },
      (reason) => {
        console.error('Error de ubicación:', reason)
      }
    )

    setStatus('tracking')
  }

  async function stopTracking() {
    if (!tripIdRef.current) {
      throw new Error('No hay un recorrido activo.')
    }

    if (status !== 'tracking') {
      return
    }

    setStatus('finishing')

    subscriptionRef.current?.remove()
    subscriptionRef.current = null

    const endedAt = new Date().toISOString()
    const startedAt = startedAtRef.current ?? endedAt

    const durationS = Math.max(
      0,
      Math.floor(
        (new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000
      )
    )

    let endCoords = lastCoordsRef.current

    if (!endCoords) {
      const fallbackLocation = await getCurrentLocation()
      endCoords = {
        latitude: fallbackLocation.coords.latitude,
        longitude: fallbackLocation.coords.longitude,
      }
    }

    await finishRecordedTrip({
      recordedTripId: tripIdRef.current,
      endedAt,
      durationS,
      distanceM: totalDistanceRef.current,
      endLat: endCoords.latitude,
      endLng: endCoords.longitude,
    })

    tripIdRef.current = null
    startedAtRef.current = null
    pointOrderRef.current = 0
    lastCoordsRef.current = null

    setActiveTripId(null)
    setStatus('idle')
  }

  useEffect(() => {
    return () => {
      subscriptionRef.current?.remove()
      subscriptionRef.current = null
    }
  }, [])

  return {
    status,
    activeTripId,
    pointCount,
    totalDistanceM,
    lastLatitude,
    lastLongitude,
    isStarting: status === 'starting',
    isTracking: status === 'tracking',
    isFinishing: status === 'finishing',
    startTracking,
    stopTracking,
  }
}