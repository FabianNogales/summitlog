import { Text, View } from 'react-native'
import {
  isMapboxTokenConfigured,
  mapboxTokenErrorMessage,
  Mapbox,
} from '../../../lib/mapbox'
import { colors } from '../../../theme/colors'
import type { TripDetailData } from '../../../services/tripDetail.service'

interface TripDetailMapPreviewProps {
  detail: TripDetailData
  setIsMapActive?: (active: boolean) => void
}

function getFallbackCenter(detail: TripDetailData): [number, number] {
  const startLat = Number(detail.trip.start_lat)
  const startLng = Number(detail.trip.start_lng)

  if (Number.isFinite(startLat) && Number.isFinite(startLng)) {
    return [startLng, startLat]
  }

  return [-66.1568, -17.3895]
}

function getStartCoordinate(detail: TripDetailData): [number, number] | null {
  const lat = Number(detail.trip.start_lat)
  const lng = Number(detail.trip.start_lng)

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null
  }

  return [lng, lat]
}

function getEndCoordinate(detail: TripDetailData): [number, number] | null {
  const lat = Number(detail.trip.end_lat)
  const lng = Number(detail.trip.end_lng)

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null
  }

  return [lng, lat]
}

export function TripDetailMapPreview({
  detail,
  setIsMapActive,
}: TripDetailMapPreviewProps) {
  const validPoints = detail.points.filter((point) => {
    const lng = Number(point.longitude)
    const lat = Number(point.latitude)
    return Number.isFinite(lng) && Number.isFinite(lat)
  })

  const hasPolyline = validPoints.length >= 2
  const lineCoordinates = validPoints.map((point) => [
    Number(point.longitude),
    Number(point.latitude),
  ])

  const fallbackCenter = getFallbackCenter(detail)
  const startCoordinate = getStartCoordinate(detail)
  const endCoordinate = getEndCoordinate(detail)

  if (!isMapboxTokenConfigured) {
    return (
      <View
        style={{
          height: 260,
          borderRadius: 22,
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
        height: 280,
        borderRadius: 22,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: 18,
      }}
      onStartShouldSetResponder={() => {
        setIsMapActive?.(true)
        return false
      }}
    >
      <Mapbox.MapView
        style={{ flex: 1 }}
        styleURL={Mapbox.StyleURL.Street}
        logoEnabled={false}
        compassEnabled
        attributionEnabled={false}
        requestDisallowInterceptTouchEvent
      >
        <Mapbox.Camera
          defaultSettings={{
            centerCoordinate: fallbackCenter,
            zoomLevel: hasPolyline ? 13 : 12,
          }}
        />

        {hasPolyline ? (
          <Mapbox.ShapeSource
            id="privateTripLineSource"
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
              id="privateTripLineLayer"
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
          <Mapbox.PointAnnotation id="privateTripStart" coordinate={startCoordinate}>
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
          <Mapbox.PointAnnotation id="privateTripEnd" coordinate={endCoordinate}>
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
            borderRadius: 12,
          }}
        >
          <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
            Este recorrido todavía no tiene suficientes puntos para dibujar el trazado.
          </Text>
        </View>
      ) : null}
    </View>
  )
}