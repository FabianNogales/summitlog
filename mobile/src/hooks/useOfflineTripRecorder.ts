import { useCallback, useEffect, useRef, useState } from 'react'
import type * as Location from 'expo-location'

import { useAuth } from './useAuth'
import {
  getCurrentLocation,
  isBackgroundLocationTrackingActive,
  requestBackgroundLocationPermission,
  requestForegroundLocationPermission,
  startBackgroundLocationTracking,
  startForegroundLocationWatcher,
  stopBackgroundLocationTracking,
} from '../services/location.service'
import {
  addOfflineRecordedTripPointWithAutoOrder,
  completeOfflineRecordedTrip,
  createOfflineRecordedTrip,
  getOfflineRecordedTripById,
  getOfflineTripPointsByTripId,
} from '../services/offlineTrip.service'
import {
  clearActiveTripForBackground,
  getActiveTripForBackground,
  setActiveTripForBackground,
} from '../services/backgroundTrackingState.service'
import { calculateDistanceInMeters } from '../utils/distance'
import { shouldPersistGpsPoint } from '../utils/gpsQuality'

type RecorderStatus = 'idle' | 'starting' | 'tracking' | 'finishing'

interface LastCoords {
  latitude: number
  longitude: number
}

interface TripSnapshot {
  pointCount: number
  distanceM: number
  elevationGainM: number
  calories: number
  lastCoords: LastCoords | null
}

function getPointAltitude(point: any) {
  return point.altitude_m ?? point.altitudeM ?? point.altitude ?? null
}

const BACKGROUND_LOCATION_PERMISSION_MESSAGE =
  'Para registrar recorridos con la pantalla bloqueada, permite ubicacion en segundo plano.'

function buildTripSnapshot(
  points: Awaited<ReturnType<typeof getOfflineTripPointsByTripId>>
): TripSnapshot {
  if (points.length === 0) {
    return {
      pointCount: 0,
      distanceM: 0,
      elevationGainM: 0,
      calories: 0,
      lastCoords: null,
    }
  }

  let distanceM = 0
  let elevationGainM = 0
  let lastAltitude = getPointAltitude(points[0])

  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1]
    const current = points[index]

    distanceM += calculateDistanceInMeters(
      { latitude: previous.latitude, longitude: previous.longitude },
      { latitude: current.latitude, longitude: current.longitude }
    )

    const currentAltitude = getPointAltitude(current)

    if (
      lastAltitude !== null &&
      currentAltitude !== null &&
      currentAltitude > lastAltitude
    ) {
      elevationGainM += currentAltitude - lastAltitude
    }

    if (currentAltitude !== null) {
      lastAltitude = currentAltitude
    }
  }

  const calories = Math.floor((distanceM / 1000) * 65)
  const lastPoint = points[points.length - 1]

  return {
    pointCount: points.length,
    distanceM,
    elevationGainM,
    calories,
    lastCoords: {
      latitude: lastPoint.latitude,
      longitude: lastPoint.longitude,
    },
  }
}

export function useOfflineTripRecorder() {
  const { user } = useAuth()

  const subscriptionRef = useRef<Location.LocationSubscription | null>(null)
  const localTripIdRef = useRef<string | null>(null)
  const persistQueueRef = useRef<Promise<void>>(Promise.resolve())
  const startedAtRef = useRef<string | null>(null)
  const lastCoordsRef = useRef<LastCoords | null>(null)
  const lastCapturedAtMsRef = useRef<number | null>(null)
  const totalDistanceRef = useRef(0)
  const backgroundTrackingEnabledRef = useRef(false)

  const lastAltitudeRef = useRef<number | null>(null)
  const totalElevationGainRef = useRef(0)

  const [status, setStatus] = useState<RecorderStatus>('idle')
  const [activeLocalTripId, setActiveLocalTripId] = useState<string | null>(null)
  const [pointCount, setPointCount] = useState(0)
  const [lastLatitude, setLastLatitude] = useState<number | null>(null)
  const [lastLongitude, setLastLongitude] = useState<number | null>(null)
  const [totalDistanceM, setTotalDistanceM] = useState(0)
  const [backgroundPermissionGranted, setBackgroundPermissionGranted] = useState(false)
  const [backgroundTrackingActive, setBackgroundTrackingActive] = useState(false)
  const [backgroundStatusMessage, setBackgroundStatusMessage] = useState<string | null>(null)

  const [pathPoints, setPathPoints] = useState<[number, number][]>([])
  const [totalElevationGainM, setTotalElevationGainM] = useState(0)
  const [totalCalories, setTotalCalories] = useState(0)

  async function refreshTripSnapshot(localTripId: string) {
    const points = await getOfflineTripPointsByTripId(localTripId)
    const snapshot = buildTripSnapshot(points)

    setPointCount(snapshot.pointCount)

    totalDistanceRef.current = snapshot.distanceM
    setTotalDistanceM(snapshot.distanceM)

    totalElevationGainRef.current = snapshot.elevationGainM
    setTotalElevationGainM(snapshot.elevationGainM)

    setTotalCalories(snapshot.calories)

    if (points.length > 0) {
      lastAltitudeRef.current = getPointAltitude(points[points.length - 1])
    }

    lastCoordsRef.current = snapshot.lastCoords
    setLastLatitude(snapshot.lastCoords?.latitude ?? null)
    setLastLongitude(snapshot.lastCoords?.longitude ?? null)

    const lastCapturedAt = points[points.length - 1]?.captured_at ?? null
    const lastCapturedAtMs = lastCapturedAt ? Date.parse(lastCapturedAt) : NaN
    lastCapturedAtMsRef.current = Number.isFinite(lastCapturedAtMs)
      ? lastCapturedAtMs
      : null

    setPathPoints(points.map((p) => [p.longitude, p.latitude]))

    return snapshot
  }

  const updateLiveTrackingState = useCallback(
    (location: Location.LocationObject) => {
      const capturedAtMs = location.timestamp ?? Date.now()
      const candidatePoint = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracyM: location.coords.accuracy ?? null,
        capturedAt: capturedAtMs,
      }
      const previousPoint = lastCoordsRef.current
        ? {
            latitude: lastCoordsRef.current.latitude,
            longitude: lastCoordsRef.current.longitude,
            capturedAt: lastCapturedAtMsRef.current,
          }
        : null

      const validation = shouldPersistGpsPoint(candidatePoint, previousPoint)

      if (!validation.shouldPersist) {
        return
      }

      const currentCoords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      }

      const currentAltitude = location.coords.altitude ?? null
      const previousCoords = lastCoordsRef.current
      const previousAltitude = lastAltitudeRef.current

      setLastLatitude(currentCoords.latitude)
      setLastLongitude(currentCoords.longitude)

      if (previousCoords) {
        const addedDistance = calculateDistanceInMeters(
          previousCoords,
          currentCoords
        )

        totalDistanceRef.current += addedDistance
        setTotalDistanceM(totalDistanceRef.current)

        const computedCalories = Math.floor((totalDistanceRef.current / 1000) * 65)
        setTotalCalories(computedCalories)
      }

      if (previousAltitude !== null && currentAltitude !== null) {
        if (currentAltitude > previousAltitude) {
          const gain = currentAltitude - previousAltitude
          totalElevationGainRef.current += gain
          setTotalElevationGainM(totalElevationGainRef.current)
        }
      }

      lastCoordsRef.current = currentCoords
      lastAltitudeRef.current = currentAltitude
      lastCapturedAtMsRef.current = capturedAtMs

      const nextPoint: [number, number] = [
        currentCoords.longitude,
        currentCoords.latitude,
      ]

      setPathPoints((prev) => {
        const lastPoint = prev[prev.length - 1]

        if (
          lastPoint &&
          lastPoint[0] === nextPoint[0] &&
          lastPoint[1] === nextPoint[1]
        ) {
          return prev
        }

        return [...prev, nextPoint]
      })
    },
    []
  )

  const persistPoint = useCallback((location: Location.LocationObject) => {
    const persistTask = async () => {
      const currentLocalTripId = localTripIdRef.current
      if (!currentLocalTripId) return

      try {
        const capturedAtMs = location.timestamp ?? Date.now()
        const candidatePoint = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracyM: location.coords.accuracy ?? null,
          capturedAt: capturedAtMs,
        }

        const previousPoint = lastCoordsRef.current
          ? {
              latitude: lastCoordsRef.current.latitude,
              longitude: lastCoordsRef.current.longitude,
              capturedAt: lastCapturedAtMsRef.current,
            }
          : null

        const validation = shouldPersistGpsPoint(candidatePoint, previousPoint)

        if (!validation.shouldPersist) {
          return
        }

        const currentCoords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        }

        const capturedAtIso = new Date(capturedAtMs).toISOString()

        const inserted = await addOfflineRecordedTripPointWithAutoOrder({
          localTripId: currentLocalTripId,
          latitude: currentCoords.latitude,
          longitude: currentCoords.longitude,
          altitudeM: location.coords.altitude ?? null,
          accuracyM: location.coords.accuracy ?? null,
          speedMps: location.coords.speed ?? null,
          headingDeg: location.coords.heading ?? null,
          capturedAt: capturedAtIso,
        })

        const newPointOrder = inserted?.point_order ?? 0

        setPointCount(newPointOrder + 1)

        const previousCoords = lastCoordsRef.current
        const currentAltitude = location.coords.altitude ?? null
        const previousAltitude = lastAltitudeRef.current

        if (previousCoords) {
          totalDistanceRef.current += calculateDistanceInMeters(
            previousCoords,
            currentCoords
          )

          setTotalDistanceM(totalDistanceRef.current)

          const computedCalories = Math.floor((totalDistanceRef.current / 1000) * 65)
          setTotalCalories(computedCalories)
        }

        if (previousAltitude !== null && currentAltitude !== null) {
          if (currentAltitude > previousAltitude) {
            const gain = currentAltitude - previousAltitude
            totalElevationGainRef.current += gain
            setTotalElevationGainM(totalElevationGainRef.current)
          }
        }

        lastCoordsRef.current = currentCoords
        setLastLatitude(currentCoords.latitude)
        setLastLongitude(currentCoords.longitude)

        lastAltitudeRef.current = currentAltitude
        lastCapturedAtMsRef.current = capturedAtMs

        setPathPoints((prev) => {
          const lastPoint = prev[prev.length - 1]
          const nextPoint: [number, number] = [
            currentCoords.longitude,
            currentCoords.latitude,
          ]

          if (
            lastPoint &&
            lastPoint[0] === nextPoint[0] &&
            lastPoint[1] === nextPoint[1]
          ) {
            return prev
          }

          return [...prev, nextPoint]
        })
      } catch (error) {
        console.error('Error persistiendo punto offline:', error)
        throw error
      }
    }

    const queuedTask = persistQueueRef.current.then(persistTask)
    persistQueueRef.current = queuedTask.catch(() => undefined)

    return queuedTask
  }, [])

  const startForegroundWatcher = useCallback(async () => {
    subscriptionRef.current?.remove()

    subscriptionRef.current = await startForegroundLocationWatcher(
      (location) => {
        setLastLatitude(location.coords.latitude)
        setLastLongitude(location.coords.longitude)

        if (backgroundTrackingEnabledRef.current) {
          updateLiveTrackingState(location)
          return
        }

        persistPoint(location).catch((error: any) => {
          console.error('Error guardando punto offline (foreground):', error)
        })
      },
      (reason) => {
        console.error('Error de ubicacion:', reason)
      }
    )
  }, [persistPoint, updateLiveTrackingState])

  async function startTracking() {
    if (!user) {
      throw new Error('Debes iniciar sesion para registrar un recorrido.')
    }

    if (status === 'starting' || status === 'tracking' || status === 'finishing') {
      return
    }

    setStatus('starting')
    setBackgroundStatusMessage(null)

    const foregroundPermission = await requestForegroundLocationPermission()

    if (!foregroundPermission.granted) {
      setStatus('idle')
      throw new Error('No es posible iniciar el seguimiento sin permiso de ubicacion.')
    }

    const backgroundPermission = await requestBackgroundLocationPermission()
    const hasBackgroundPermission = backgroundPermission.granted

    setBackgroundPermissionGranted(hasBackgroundPermission)

    if (!hasBackgroundPermission) {
      setStatus('idle')
      setBackgroundStatusMessage(BACKGROUND_LOCATION_PERMISSION_MESSAGE)
      throw new Error(BACKGROUND_LOCATION_PERMISSION_MESSAGE)
    }

    let backgroundStarted = false

    try {
      backgroundStarted = await startBackgroundLocationTracking()
    } catch (backgroundStartError: any) {
      console.error(
        'No se pudo iniciar tracking en segundo plano:',
        backgroundStartError?.message ?? 'unknown'
      )
    }

    if (!backgroundStarted) {
      setStatus('idle')
      setBackgroundStatusMessage(
        'No se pudo activar el tracking en segundo plano. Revisa el permiso de ubicacion en segundo plano.'
      )
      throw new Error(
        'No se pudo activar el tracking en segundo plano. Revisa el permiso de ubicacion en segundo plano.'
      )
    }

    let currentLocation: Location.LocationObject | null = null
    let localTrip: NonNullable<
      Awaited<ReturnType<typeof createOfflineRecordedTrip>>
    > | null = null

    try {
      currentLocation = await getCurrentLocation()

      const createdLocalTrip = await createOfflineRecordedTrip({
        userId: user.id,
        startLat: currentLocation.coords.latitude,
        startLng: currentLocation.coords.longitude,
      })

      if (!createdLocalTrip) {
        throw new Error('No se pudo crear el recorrido offline.')
      }

      localTrip = createdLocalTrip
    } catch (startError) {
      await stopBackgroundLocationTracking().catch((error: any) => {
        console.error(
          'No se pudo detener tracking en segundo plano tras fallo de inicio:',
          error?.message ?? 'unknown'
        )
      })

      setStatus('idle')
      backgroundTrackingEnabledRef.current = false
      setBackgroundTrackingActive(false)
      throw startError
    }

    if (!currentLocation || !localTrip) {
      await stopBackgroundLocationTracking()
      setStatus('idle')
      throw new Error('No se pudo iniciar el recorrido.')
    }

    localTripIdRef.current = localTrip.local_id
    startedAtRef.current = localTrip.started_at

    setActiveLocalTripId(localTrip.local_id)

    setPointCount(0)
    setTotalDistanceM(0)
    setTotalElevationGainM(0)
    setTotalCalories(0)
    setLastLatitude(null)
    setLastLongitude(null)
    setPathPoints([])

    totalDistanceRef.current = 0
    totalElevationGainRef.current = 0
    lastCoordsRef.current = null
    lastAltitudeRef.current = null
    lastCapturedAtMsRef.current = null

    backgroundTrackingEnabledRef.current = backgroundStarted
    setBackgroundTrackingActive(backgroundStarted)

    await setActiveTripForBackground(localTrip.local_id)
    await persistPoint(currentLocation)

    await startForegroundWatcher()

    setStatus('tracking')
  }

  async function stopTracking(): Promise<string | null> {
    if (!localTripIdRef.current) {
      throw new Error('No hay un recorrido activo.')
    }

    if (status !== 'tracking') {
      return null
    }

    setStatus('finishing')

    subscriptionRef.current?.remove()
    subscriptionRef.current = null

    await stopBackgroundLocationTracking().catch((error: any) => {
      console.error(
        'No se pudo detener tracking en segundo plano:',
        error?.message ?? 'unknown'
      )
    })

    backgroundTrackingEnabledRef.current = false
    setBackgroundTrackingActive(false)

    await persistQueueRef.current

    const localTripId = localTripIdRef.current
    const snapshot = await refreshTripSnapshot(localTripId)

    const endedAt = new Date().toISOString()
    const startedAt = startedAtRef.current ?? endedAt

    const durationS = Math.max(
      0,
      Math.floor(
        (new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000
      )
    )

    let endCoords = snapshot.lastCoords

    if (!endCoords) {
      const fallbackLocation = await getCurrentLocation()

      endCoords = {
        latitude: fallbackLocation.coords.latitude,
        longitude: fallbackLocation.coords.longitude,
      }
    }

    await completeOfflineRecordedTrip({
      localTripId,
      endedAt,
      durationS,
      distanceM: snapshot.distanceM,
      elevationGainM: snapshot.elevationGainM,
      endLat: endCoords.latitude,
      endLng: endCoords.longitude,
    })

    await clearActiveTripForBackground()

    localTripIdRef.current = null
    startedAtRef.current = null
    lastCoordsRef.current = null
    lastAltitudeRef.current = null
    lastCapturedAtMsRef.current = null
    totalDistanceRef.current = 0
    totalElevationGainRef.current = 0
    persistQueueRef.current = Promise.resolve()

    setActiveLocalTripId(null)
    setPathPoints([])
    setStatus('idle')
    setBackgroundStatusMessage(null)

    return localTripId
  }

  useEffect(() => {
    let mounted = true

    async function restoreTrackingState() {
      try {
        const activeBackgroundTripId = await getActiveTripForBackground()

        if (!mounted || !activeBackgroundTripId) return

        const offlineTrip = await getOfflineRecordedTripById(activeBackgroundTripId)

        if (!offlineTrip || offlineTrip.status !== 'recording') {
          await clearActiveTripForBackground()
          return
        }

        localTripIdRef.current = offlineTrip.local_id
        startedAtRef.current = offlineTrip.started_at

        setActiveLocalTripId(offlineTrip.local_id)
        setStatus('tracking')

        await refreshTripSnapshot(offlineTrip.local_id)

        let backgroundActive = await isBackgroundLocationTrackingActive()

        if (!backgroundActive) {
          const backgroundPermission = await requestBackgroundLocationPermission()

          if (backgroundPermission.granted) {
            try {
              backgroundActive = await startBackgroundLocationTracking()
            } catch (backgroundStartError: any) {
              console.error(
                'No se pudo reactivar tracking en segundo plano:',
                backgroundStartError?.message ?? 'unknown'
              )
            }
          }
        }

        if (!mounted) return

        backgroundTrackingEnabledRef.current = backgroundActive
        setBackgroundTrackingActive(backgroundActive)
        setBackgroundPermissionGranted(backgroundActive)

        if (!backgroundActive) {
          setBackgroundStatusMessage(BACKGROUND_LOCATION_PERMISSION_MESSAGE)
        }

        await startForegroundWatcher()
      } catch (error: any) {
        console.error(
          'Error restaurando tracking activo:',
          error?.message ?? 'unknown'
        )
      }
    }

    restoreTrackingState()

    return () => {
      mounted = false
      subscriptionRef.current?.remove()
      subscriptionRef.current = null
      persistQueueRef.current = Promise.resolve()
    }
  }, [startForegroundWatcher])

  return {
    status,
    activeLocalTripId,
    pointCount,
    totalDistanceM,
    totalElevationGainM,
    totalCalories,
    lastLatitude,
    lastLongitude,
    backgroundPermissionGranted,
    backgroundTrackingActive,
    backgroundStatusMessage,
    isStarting: status === 'starting',
    isTracking: status === 'tracking',
    isFinishing: status === 'finishing',
    startTracking,
    stopTracking,
    pathPoints,
  }
}
