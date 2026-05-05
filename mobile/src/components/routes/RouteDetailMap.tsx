import { Text, View } from 'react-native'
import { Mapbox } from '../../lib/mapbox'
import { colors } from '../../theme/colors'
import type { RouteItem, RoutePoint } from '../../types/route'

interface RouteDetailMapProps {
  route: RouteItem
  points: RoutePoint[]
}

export function RouteDetailMap({ route, points }: RouteDetailMapProps) {
  const hasPolyline = points.length >= 2

  const lineCoordinates = points.map((point) => [
    Number(point.longitude),
    Number(point.latitude),
  ])

  const fallbackCenter: [number, number] =
    route.start_lat != null && route.start_lng != null
      ? [Number(route.start_lng), Number(route.start_lat)]
      : [-66.1568, -17.3895]

  const startCoordinate: [number, number] | null =
    route.start_lat != null && route.start_lng != null
      ? [Number(route.start_lng), Number(route.start_lat)]
      : null

  const endCoordinate: [number, number] | null =
    route.end_lat != null && route.end_lng != null
      ? [Number(route.end_lng), Number(route.end_lat)]
      : null

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
    >
      <Mapbox.MapView
        style={{ flex: 1 }}
        styleURL={Mapbox.StyleURL.Street}
        logoEnabled={false}
        compassEnabled
        attributionEnabled={false}
      >
        <Mapbox.Camera
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
                backgroundColor: '#2EAD6B',
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
                backgroundColor: '#E45757',
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
            backgroundColor: 'rgba(8,17,29,0.82)',
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
    </View>
  )
}