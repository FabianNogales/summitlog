import { useRef, useState } from 'react'
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
import type { RouteItem } from '../../types/route'
import { resolveRouteDisplayTitle } from '../../utils/routeDisplay'

interface RoutesMapProps {
  routes: RouteItem[]
  loading: boolean
  error: string | null
  onPressRoute: (route: RouteItem) => void
}

function getRouteDisplayTitle(route: RouteItem) {
  return resolveRouteDisplayTitle({
    displayTitle: route.display_title,
    routeTitle: route.title,
  })
}

export function RoutesMap({
  routes,
  loading,
  error,
  onPressRoute,
}: RoutesMapProps) {
  const cameraRef = useRef<any>(null)
  const [zoomLevel, setZoomLevel] = useState(13)
  const [centering, setCentering] = useState(false)
  const [canRenderUserLocation, setCanRenderUserLocation] = useState(false)

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

  const validRoutes = routes.filter((route) => {
    if (route.start_lat == null || route.start_lng == null) {
      return false
    }

    const lat = Number(route.start_lat)
    const lng = Number(route.start_lng)

    return Number.isFinite(lat) && Number.isFinite(lng)
  })

  if (validRoutes.length === 0) {
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
            textAlign: 'center',
          }}
        >
          Rutas sin coordenadas validas
        </Text>

        <Text
          style={{
            color: colors.textSecondary,
            textAlign: 'center',
          }}
        >
          Las rutas publicadas no tienen ubicaciones iniciales validas para mostrarse en el mapa.
        </Text>
      </View>
    )
  }

  async function handleCenterOnUser() {
    if (centering) return

    try {
      setCentering(true)

      const permission = await requestForegroundLocationPermission()
      if (!permission.granted) {
        Alert.alert(
          'Permiso requerido',
          'No hay permiso de ubicacion para centrar el mapa. Habilitalo en configuracion.'
        )
        return
      }

      const servicesEnabled = await hasLocationServicesEnabled()
      if (!servicesEnabled) {
        Alert.alert(
          'GPS desactivado',
          'Activa el GPS del dispositivo para centrar tu ubicacion.'
        )
        return
      }

      const location = await getCurrentLocation()
      const nextZoom = Math.max(zoomLevel, 14)
      setZoomLevel(nextZoom)
      setCanRenderUserLocation(true)
      cameraRef.current?.setCamera({
        centerCoordinate: [location.coords.longitude, location.coords.latitude],
        zoomLevel: nextZoom,
        animationDuration: 260,
      })
    } catch (error) {
      Alert.alert('No se pudo centrar', getLocationFailureMessage(error))
    } finally {
      setCentering(false)
    }
  }

  const initialCenter: [number, number] = [
    Number(validRoutes[0].start_lng),
    Number(validRoutes[0].start_lat),
  ]

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
            zoomLevel: 13,
          }}
        />

        {canRenderUserLocation ? (
          <Mapbox.UserLocation
            visible
            showsUserHeadingIndicator={false}
            androidRenderMode="gps"
          />
        ) : null}

        {validRoutes.map((route) => (
          <Mapbox.PointAnnotation
            key={route.id}
            id={route.id}
            coordinate={[Number(route.start_lng), Number(route.start_lat)]}
            title={getRouteDisplayTitle(route)}
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
          onPress={handleCenterOnUser}
          disabled={centering}
          style={{
            width: 42,
            height: 42,
            borderRadius: 14,
            backgroundColor: colors.cardSecondary,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: centering ? 0.7 : 1,
          }}
        >
          {centering ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <LocateFixed size={18} color={colors.primary} />
          )}
        </Pressable>

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