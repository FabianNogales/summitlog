import { useRef, useState } from 'react'
import { ActivityIndicator, Pressable, Text, View } from 'react-native'
import { Minus, Plus } from 'lucide-react-native'
import { Mapbox } from '../../lib/mapbox'
import { colors } from '../../theme/colors'
import type { RouteItem } from '../../types/route'

interface RoutesMapProps {
  routes: RouteItem[]
  loading: boolean
  error: string | null
  onPressRoute: (route: RouteItem) => void
}

const COCHABAMBA_CENTER: [number, number] = [-66.1568, -17.3895]

export function RoutesMap({ routes, loading, error, onPressRoute }: RoutesMapProps) {
  const cameraRef = useRef<any>(null)
  const [zoomLevel, setZoomLevel] = useState(13)

  function handleZoom(delta: number) {
    const nextZoom = Math.min(18, Math.max(3, zoomLevel + delta))
    setZoomLevel(nextZoom)
    cameraRef.current?.setCamera({
      zoomLevel: nextZoom,
      animationDuration: 180,
    })
  }

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  if (error) {
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
        <Text style={{ color: colors.text, textAlign: 'center' }}>{error}</Text>
      </View>
    )
  }

  if (routes.length === 0) {
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
        <Text
          style={{
            color: colors.text,
            fontSize: 16,
            fontWeight: '700',
            marginBottom: 8,
          }}
        >
          No hay rutas publicadas
        </Text>

        <Text
          style={{
            color: colors.textSecondary,
            textAlign: 'center',
          }}
        >
          Cuando existan rutas publicas, apareceran aqui en el mapa.
        </Text>
      </View>
    )
  }

  const validRoutes = routes.filter(
    (route) => route.start_lat != null && route.start_lng != null
  )

  const initialCenter: [number, number] =
    validRoutes.length > 0
      ? [Number(validRoutes[0].start_lng), Number(validRoutes[0].start_lat)]
      : COCHABAMBA_CENTER

  return (
    <View style={{ flex: 1 }}>
      <Mapbox.MapView
        style={{ flex: 1 }}
        styleURL={Mapbox.StyleURL.Street}
        logoEnabled
        compassEnabled
        attributionEnabled
      >
        <Mapbox.Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: initialCenter,
            zoomLevel: validRoutes.length > 0 ? 13 : 11,
          }}
        />

        {validRoutes.map((route) => (
          <Mapbox.PointAnnotation
            key={route.id}
            id={route.id}
            coordinate={[Number(route.start_lng), Number(route.start_lat)]}
            title={route.title}
            onSelected={() => onPressRoute(route)}
          >
            <View
              style={{
                width: 18,
                height: 18,
                borderRadius: 9,
                backgroundColor: colors.primary,
                borderWidth: 2,
                borderColor: colors.text,
              }}
            />
          </Mapbox.PointAnnotation>
        ))}
      </Mapbox.MapView>

      <View
        style={{
          position: 'absolute',
          right: 12,
          top: 86,
          gap: 10,
        }}
      >
        <Pressable
          onPress={() => handleZoom(1)}
          style={{
            width: 42,
            height: 42,
            borderRadius: 14,
            backgroundColor: colors.cardSecondary,
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
            backgroundColor: colors.cardSecondary,
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
