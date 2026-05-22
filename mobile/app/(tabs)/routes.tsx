import { KeyboardAvoidingView, Platform, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useFocusEffect } from '@react-navigation/native'
import { useCallback } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'

import { RoutesMap } from '../../src/components/map/RoutesMap'
import { RoutesFiltersPanel } from '../../src/components/routes/RoutesFiltersPanel'
import { usePublishedRoutes } from '../../src/hooks/usePublishedRoutes'
import { useRouteFilters } from '../../src/hooks/useRouteFilters'
import { colors } from '../../src/theme/colors'
import type { RouteItem } from '../../src/types/route'

export default function RoutesScreen() {
  const router = useRouter()
  const { routes, loading, error, refreshRoutes } = usePublishedRoutes()

  const {
    filters,
    filteredRoutes,
    setDifficulty,
    setMaxDistanceKm,
    setMaxDurationMin,
    clearFilters,
  } = useRouteFilters(routes)

  function handlePressRoute(route: RouteItem) {
    router.push({
      pathname: '/route/[id]',
      params: { id: route.id },
    })
  }

  useFocusEffect(
    useCallback(() => {
      refreshRoutes().catch((err) => {
        console.error('Error refrescando rutas publicadas:', err)
      })
    }, [refreshRoutes])
  )

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
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
            routes={filteredRoutes}
            loading={loading}
            error={error}
            onPressRoute={handlePressRoute}
          />
        </View>

        <RoutesFiltersPanel
          filters={filters}
          resultCount={filteredRoutes.length}
          onChangeDifficulty={setDifficulty}
          onChangeMaxDistanceKm={setMaxDistanceKm}
          onChangeMaxDurationMin={setMaxDurationMin}
          onClearFilters={clearFilters}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
