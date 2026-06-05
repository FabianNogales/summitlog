import {
  KeyboardAvoidingView,
  Platform,
  View,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useFocusEffect } from '@react-navigation/native'
import { useCallback, useMemo, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'

import { RoutesMap } from '../../src/components/map/RoutesMap'
import { RoutesFiltersPanel } from '../../src/components/routes/RoutesFiltersPanel'
import { RoutesList } from '../../src/components/routes/RoutesList'
import { RoutesScreenHeader } from '../../src/components/routes/RoutesScreenHeader'
import { RoutesSearchControls } from '../../src/components/routes/RoutesSearchControls'
import { usePublishedRoutes } from '../../src/hooks/usePublishedRoutes'
import { useRouteFilters } from '../../src/hooks/useRouteFilters'
import { colors } from '../../src/theme/colors'
import type { RouteItem } from '../../src/types/route'

export default function RoutesScreen() {
  const router = useRouter()
  const { routes, loading, error, refreshRoutes } = usePublishedRoutes()
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map')

  const {
    filters,
    searchQuery,
    filteredRoutes,
    setSearchQuery,
    setDifficulty,
    setMaxDistanceKm,
    setMaxDurationMin,
    clearFilters,
  } = useRouteFilters(routes)

  const hasActiveFilters = useMemo(() => {
    return (
      filters.difficulty !== 'all' ||
      Boolean(filters.maxDistanceKm) ||
      Boolean(filters.maxDurationMin)
    )
  }, [filters])

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
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <RoutesScreenHeader
          viewMode={viewMode}
          onToggleViewMode={() => setViewMode((prev) => (prev === 'map' ? 'list' : 'map'))}
        />

        <RoutesSearchControls
          filters={filters}
          searchQuery={searchQuery}
          resultCount={filteredRoutes.length}
          hasActiveFilters={hasActiveFilters}
          showAdvancedFilters={showAdvancedFilters}
          onChangeSearchQuery={setSearchQuery}
          onToggleAdvancedFilters={() => setShowAdvancedFilters((prev) => !prev)}
          onClearFilters={clearFilters}
        />

        {viewMode === 'map' ? (
          <View style={{ flex: 1 }}>
            <RoutesMap
              routes={filteredRoutes}
              loading={loading}
              error={error}
              onPressRoute={handlePressRoute}
            />
          </View>
        ) : (
          <RoutesList
            routes={filteredRoutes}
            loading={loading}
            error={error}
            onPressRoute={handlePressRoute}
          />
        )}

        {showAdvancedFilters ? (
          <RoutesFiltersPanel
            filters={filters}
            resultCount={filteredRoutes.length}
            onChangeDifficulty={setDifficulty}
            onChangeMaxDistanceKm={setMaxDistanceKm}
            onChangeMaxDurationMin={setMaxDurationMin}
            onClearFilters={clearFilters}
          />
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
