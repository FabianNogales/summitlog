import React, { useEffect, useRef, useState } from 'react'
import { Pressable, View } from 'react-native'
import { Minus, Plus, LocateFixed } from 'lucide-react-native'
import { Mapbox } from '../../lib/mapbox'
import { colors } from '../../theme/colors'

interface TrackingMapProps {
  coordinates: [number, number][] 
  isTracking: boolean
}

export function TrackingMap({ coordinates, isTracking }: TrackingMapProps) {
  const cameraRef = useRef<any>(null)
  const [zoomLevel, setZoomLevel] = useState(16)
  const [followUser, setFollowUser] = useState(true)

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

  function centerOnUser() {
    setFollowUser(false)
    setTimeout(() => {
      setZoomLevel(16)
      setFollowUser(true)
    }, 10) 
  }

  const routeLine = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: coordinates,
    },
  } as const

  const startPoint = coordinates.length > 0 ? coordinates[0] : null

  // Corregido: Se añade "properties: {}" para solucionar la alerta de TypeScript
  const startPointFeature = startPoint ? {
    type: 'Feature',
    properties: {}, 
    geometry: {
      type: 'Point',
      coordinates: startPoint,
    },
  } as const : null

  return (
    <View style={{ flex: 1 }}>
      <Mapbox.MapView
        style={{ flex: 1 }}
        styleURL={Mapbox.StyleURL.Street}
        logoEnabled={false}
        compassEnabled={true}
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
          showsUserHeadingIndicator={false} 
          visible={true}
          androidRenderMode="gps"
        />

        {startPointFeature && (
          <Mapbox.ShapeSource id="startPointSource" shape={startPointFeature}>
            <Mapbox.CircleLayer
              id="startPointCircle"
              style={{
                circleColor: colors.primary || '#FF6B00', 
                circleRadius: 7,
                circleStrokeColor: '#FFFFFF',
                circleStrokeWidth: 2.5,
              }}
            />
          </Mapbox.ShapeSource>
        )}

        {coordinates.length > 1 && (
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
        )}
      </Mapbox.MapView>

      <View
        style={{
          position: 'absolute',
          right: 12,
          top: 240, 
          gap: 10,
        }}
      >
        <Pressable
          onPress={centerOnUser}
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
          }}
        >
          <LocateFixed size={20} color={colors.primary || colors.text} />
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