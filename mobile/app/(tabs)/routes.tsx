import { SafeAreaView, Text, View } from 'react-native'
import { useRouter } from 'expo-router'

import { RoutesMap } from '../../src/components/map/RoutesMap'
import { usePublishedRoutes } from '../../src/hooks/usePublishedRoutes'
import { colors } from '../../src/theme/colors'
import type { RouteItem } from '../../src/types/route'

export default function RoutesScreen() {
  const router = useRouter()
  const { routes, loading, error } = usePublishedRoutes()

  function handlePressRoute(route: RouteItem) {
    router.push({
      pathname: '/route/[id]',
      params: { id: route.id },
    })
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