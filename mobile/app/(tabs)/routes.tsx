import { Alert, SafeAreaView, Text, View } from 'react-native'
import { RoutesMap } from '../../src/components/map/RoutesMap'
import { usePublishedRoutes } from '../../src/hooks/usePublishedRoutes'
import { colors } from '../../src/theme/colors'
import type { RouteItem } from '../../src/types/route'

export default function RoutesScreen() {
  const { routes, loading, error } = usePublishedRoutes()

  function handlePressRoute(route: RouteItem) {
    Alert.alert(
      'Ruta seleccionada',
      `Seleccionaste: ${route.title}\n\nEl detalle completo lo conectaremos en PB-06.`
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: 16 }}>
        <Text
          style={{
            color: colors.text,
            fontSize: 24,
            fontWeight: '700',
            marginBottom: 6,
          }}
        >
          Explorar rutas
        </Text>

        <Text
          style={{
            color: colors.textSecondary,
            fontSize: 14,
          }}
        >
          Descubre rutas publicadas por la comunidad.
        </Text>
      </View>

      <View style={{ flex: 1 }}>
        <RoutesMap
          routes={routes}
          loading={loading}
          error={error}
          onPressRoute={handlePressRoute}
        />
      </View>
    </SafeAreaView>
  )
}