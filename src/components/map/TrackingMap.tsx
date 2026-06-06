import React, { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native'
import { LocateFixed, Minus, Plus } from 'lucide-react-native'
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

const DEFAULT_MAP_CONTROLS_BOTTOM_OFFSET = 120

interface TrackingMapProps {
  coordinates: [number, number][]
  isTracking: boolean
  controlsBottomOffset?: number
}

export function TrackingMap({
  coordinates,
  isTracking,
  controlsBottomOffset = DEFAULT_MAP_CONTROLS_BOTTOM_OFFSET,
}: TrackingMapProps) {
  const cameraRef = useRef<any>(null)
  const [zoomLevel, setZoomLevel] = useState(16)
  const [followUser, setFollowUser] = useState(true)
  const [centering, setCentering] = useState(false)

  useEffect(() => {
    if (isTracking) {
      setFollowUser(true)
    }
  }, [isTracking])

  function handleZoom(delta: number) {
    const nextZoom = Math.min(18, Math.max(3, zoomLevel + delta))
    setZoomLevel(nextZoom)

    cameraRef.current?.setCamera({
      zoomLevel: nextZoom,
      animationDuration: 180,
    })
  }

  async function centerOnUser() {
    if (centering) return

    try {
      setCentering(true)

      const permission = await requestForegroundLocationPermission()

      if (!permission.granted) {
        Alert.alert(
          'Permiso requerido',
          'No hay permiso de ubicación para centrar. Habilítalo en configuración.'
        )
        return
      }

      const servicesEnabled = await hasLocationServicesEnabled()

      if (!servicesEnabled) {
        Alert.alert(
          'GPS desactivado',
          'Activa el GPS del dispositivo para centrar tu ubicación.'
        )
        return
      }

      const location = await getCurrentLocation()
      const nextZoom = Math.max(zoomLevel, 16)

      setZoomLevel(nextZoom)
      setFollowUser(false)

      cameraRef.current?.setCamera({
        centerCoordinate: [location.coords.longitude, location.coords.latitude],
        zoomLevel: nextZoom,
        animationDuration: 260,
      })

      setTimeout(() => {
        setFollowUser(true)
      }, 180)
    } catch (error) {
      Alert.alert('No se pudo centrar', getLocationFailureMessage(error))
    } finally {
      setCentering(false)
    }
  }

  const hasRouteLine = coordinates.length > 1
  const startPoint = coordinates.length > 0 ? coordinates[0] : null

  const routeLine = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates,
    },
  } as const

  const startPointFeature = startPoint
    ? ({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Point',
          coordinates: startPoint,
        },
      } as const)
    : null

  if (!isMapboxTokenConfigured) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background,
          padding: 20,
        }}
      >
        <Text style={{ color: colors.text, textAlign: 'center' }}>
          {mapboxTokenErrorMessage}
        </Text>
      </View>
    )
  }

  return (
    <View style={{ flex: 1 }}>
      <Mapbox.MapView
        style={{ flex: 1 }}
        styleURL={Mapbox.StyleURL.Street}
        logoEnabled={false}
        compassEnabled
        scaleBarEnabled={false}
        compassViewMargins={{ x: 16, y: 80 }}
      >
        <Mapbox.Camera
          ref={cameraRef}
          defaultSettings={{ zoomLevel: 16 }}
          followUserLocation={followUser}
          followUserMode={Mapbox.UserTrackingModes.Follow}
          followZoomLevel={zoomLevel}
        />

        <Mapbox.UserLocation
          visible
          showsUserHeadingIndicator
          androidRenderMode="gps"
        />

        {hasRouteLine ? (
          <Mapbox.ShapeSource
            id="routeSource"
            key={`route-source-${coordinates.length}`}
            shape={routeLine}
          >
            <Mapbox.LineLayer
              id="routeLineLayer"
              style={{
                lineColor: colors.primary,
                lineWidth: 5,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
          </Mapbox.ShapeSource>
        ) : null}

        {startPointFeature ? (
          <Mapbox.ShapeSource id="startPointSource" shape={startPointFeature}>
            <Mapbox.CircleLayer
              id="startPointCircle"
              style={{
                circleColor: colors.warning,
                circleRadius: 7,
                circleStrokeColor: colors.text,
                circleStrokeWidth: 2.5,
              }}
            />
          </Mapbox.ShapeSource>
        ) : null}
      </Mapbox.MapView>

      <View
        style={{
          position: 'absolute',
          right: 12,
          bottom: controlsBottomOffset,
          gap: 10,
        }}
      >
        <Pressable
          onPress={centerOnUser}
          disabled={centering}
          style={{
            width: 42,
            height: 42,
            borderRadius: 14,
            backgroundColor: colors.bgElevated || colors.background,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 8,
            opacity: centering ? 0.7 : 1,
          }}
        >
          {centering ? (
            <ActivityIndicator size="small" color={colors.primary || colors.text} />
          ) : (
            <LocateFixed size={20} color={colors.primary || colors.text} />
          )}
        </Pressable>

        <Pressable
          onPress={() => handleZoom(1)}
          style={{
            width: 42,
            height: 42,
            borderRadius: 14,
            backgroundColor: colors.bgElevated || colors.background,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Plus size={18} color={colors.text} />
        </Pressable>

        <Pressable
          onPress={() => handleZoom(-1)}
          style={{
            width: 42,
            height: 42,
            borderRadius: 14,
            backgroundColor: colors.bgElevated || colors.background,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Minus size={18} color={colors.text} />
        </Pressable>
      </View>
    </View>
  )
}
