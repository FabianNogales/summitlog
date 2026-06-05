import { useRef, useState } from 'react'
import { ActivityIndicator, Pressable, Text, View } from 'react-native'
import { LocateFixed } from 'lucide-react-native'
import {
  isMapboxTokenConfigured,
  mapboxTokenErrorMessage,
  Mapbox,
} from '../../lib/mapbox'
import {
  getCurrentLocation,
  getLocationFailureMessage,
  hasLocationServicesEnabled,
  requestForegroundLocationPermission,
} from '../../services/location.service'
import { colors } from '../../theme/colors'
import type { RouteItem, RoutePoint } from '../../types/route'

interface RouteDetailMapProps {
  route: RouteItem
  points: RoutePoint[]
  setIsMapActive?: (active: boolean) => void 
}

export function RouteDetailMap({ route, points, setIsMapActive }: RouteDetailMapProps) {
  const cameraRef = useRef<any>(null)
  const [centering, setCentering] = useState(false)
  const [centerMessage, setCenterMessage] = useState<string | null>(null)
  const validPoints = points.filter((point) => {
    const lng = Number(point.longitude)
    const lat = Number(point.latitude)
    return Number.isFinite(lng) && Number.isFinite(lat)
  })
  const hasPolyline = validPoints.length >= 2

  const lineCoordinates = validPoints.map((point) => [
    Number(point.longitude),
    Number(point.latitude),
  ])

  const fallbackCenter: [number, number] = (() => {
    if (route.start_lat == null || route.start_lng == null) {
      return [-66.1568, -17.3895]
    }

    const lat = Number(route.start_lat)
    const lng = Number(route.start_lng)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return [-66.1568, -17.3895]
    }

    return [lng, lat]
  })()

  const startCoordinate: [number, number] | null = (() => {
    if (route.start_lat == null || route.start_lng == null) return null
    const lat = Number(route.start_lat)
    const lng = Number(route.start_lng)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
    return [lng, lat]
  })()

  const endCoordinate: [number, number] | null = (() => {
    if (route.end_lat == null || route.end_lng == null) return null
    const lat = Number(route.end_lat)
    const lng = Number(route.end_lng)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
    return [lng, lat]
  })()

  async function handleCenterOnUser() {
    if (centering) return

    try {
      setCentering(true)
      setCenterMessage(null)
      const permission = await requestForegroundLocationPermission()

      if (!permission.granted) {
        setCenterMessage(
          'No hay permiso de ubicación para centrar el mapa. Habilítalo en configuración.'
        )
        return
      }

      const servicesEnabled = await hasLocationServicesEnabled()
      if (!servicesEnabled) {
        setCenterMessage('Activa el GPS del dispositivo para centrar tu ubicación.')
        return
      }

      const location = await getCurrentLocation()
      cameraRef.current?.setCamera({
        centerCoordinate: [location.coords.longitude, location.coords.latitude],
        zoomLevel: 14,
        animationDuration: 260,
      })
      setCenterMessage('Mapa centrado en tu ubicación actual.')
    } catch (error) {
      setCenterMessage(getLocationFailureMessage(error))
    } finally {
      setCentering(false)
    }
  }

  if (!isMapboxTokenConfigured) {
    return (
      <View
        style={{
          height: 260,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: colors.border,
          marginBottom: 18,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 16,
          backgroundColor: colors.card,
        }}
      >
        <Text style={{ color: colors.text, textAlign: 'center' }}>
          {mapboxTokenErrorMessage}
        </Text>
      </View>
    )
  }

  return (
    <View
      style={{
        height: 260,
        borderRadius: 18,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: 18,
      }}
      onStartShouldSetResponder={() => {
        setIsMapActive?.(true);
        return false; 
      }}
    >
      <Mapbox.MapView
        style={{ flex: 1 }}
        styleURL={Mapbox.StyleURL.Street}
        logoEnabled={false}
        compassEnabled
        attributionEnabled={false}
        requestDisallowInterceptTouchEvent={true}
      >
        <Mapbox.Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: fallbackCenter,
            zoomLevel: hasPolyline ? 13 : 12,
          }}
        />

        {hasPolyline ? (
          <Mapbox.ShapeSource
            id="routeLineSource"
            shape={{
              type: 'Feature',
              geometry: {
                type: 'LineString',
                coordinates: lineCoordinates,
              },
              properties: {},
            }}
          >
            <Mapbox.LineLayer
              id="routeLineLayer"
              style={{
                lineColor: colors.primary,
                lineWidth: 4,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
          </Mapbox.ShapeSource>
        ) : null}

        {startCoordinate ? (
          <Mapbox.PointAnnotation id="routeStart" coordinate={startCoordinate}>
            <View
              style={{
                width: 16,
                height: 16,
                borderRadius: 8,
                backgroundColor: colors.success,
                borderWidth: 2,
                borderColor: colors.text,
              }}
            />
          </Mapbox.PointAnnotation>
        ) : null}

        {endCoordinate ? (
          <Mapbox.PointAnnotation id="routeEnd" coordinate={endCoordinate}>
            <View
              style={{
                width: 16,
                height: 16,
                borderRadius: 8,
                backgroundColor: colors.danger,
                borderWidth: 2,
                borderColor: colors.text,
              }}
            />
          </Mapbox.PointAnnotation>
        ) : null}
      </Mapbox.MapView>

      {!hasPolyline ? (
        <View
          style={{
            position: 'absolute',
            bottom: 10,
            left: 10,
            right: 10,
            backgroundColor: colors.overlay,
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 10,
          }}
        >
          <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
            Esta ruta todavía no tiene trazado público en route_points.
          </Text>
        </View>
      ) : null}

      <Pressable
        onPress={handleCenterOnUser}
        disabled={centering}
        style={{
          position: 'absolute',
          right: 10,
          top: 10,
          width: 38,
          height: 38,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.cardSecondary,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: centering ? 0.7 : 1,
        }}
      >
        {centering ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <LocateFixed size={16} color={colors.primary} />
        )}
      </Pressable>

      {centerMessage ? (
        <View
          style={{
            position: 'absolute',
            top: 54,
            left: 10,
            right: 56,
            backgroundColor: colors.overlay,
            paddingHorizontal: 10,
            paddingVertical: 7,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text style={{ color: colors.textSecondary, fontSize: 11 }}>{centerMessage}</Text>
        </View>
      ) : null}
    </View>
  )
}
