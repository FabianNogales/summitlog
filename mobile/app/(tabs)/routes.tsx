import {
  KeyboardAvoidingView,
  Platform,
  View,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useFocusEffect } from '@react-navigation/native'
import { useCallback, useMemo, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'

import { ImagePreviewModal } from '../../src/components/common/ImagePreviewModal'
import { RoutesMap } from '../../src/components/map/RoutesMap'
import { RoutesFiltersPanel } from '../../src/components/routes/RoutesFiltersPanel'
import { RoutesList } from '../../src/components/routes/RoutesList'
import { RoutesScreenHeader } from '../../src/components/routes/RoutesScreenHeader'
import { RoutesSearchControls } from '../../src/components/routes/RoutesSearchControls'
import { usePublishedRoutes } from '../../src/hooks/usePublishedRoutes'
import { useRouteFilters } from '../../src/hooks/useRouteFilters'
import { colors } from '../../src/theme/colors'
import type { RouteItem } from '../../src/types/route'

const QUICK_DISTANCE_VALUES = ['', '5', '10', '20']
const QUICK_DURATION_VALUES = ['', '60', '120', '240']

function nextQuickValue(current: string, values: string[]) {
  const currentIndex = values.findIndex((value) => value === current)
  if (currentIndex < 0) return values[0]

  const nextIndex = (currentIndex + 1) % values.length
  return values[nextIndex]
}

export default function RoutesScreen() {
  const router = useRouter()
  const { routes, loading, error, refreshRoutes } = usePublishedRoutes()
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map')
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)

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
      Boolean(searchQuery.trim()) ||
      Boolean(filters.maxDistanceKm) ||
      Boolean(filters.maxDurationMin)
    )
  }, [filters, searchQuery])

  const difficultyLabel = useMemo(() => {
    if (filters.difficulty === 'easy') return 'Facil'
    if (filters.difficulty === 'medium') return 'Media'
    if (filters.difficulty === 'hard') return 'Dificil'
    return 'Todas'
  }, [filters.difficulty])

  function cycleDifficulty() {
    if (filters.difficulty === 'all') {
      setDifficulty('easy')
      return
    }

    if (filters.difficulty === 'easy') {
      setDifficulty('medium')
      return
    }

    if (filters.difficulty === 'medium') {
      setDifficulty('hard')
      return
    }

    setDifficulty('all')
  }

  function cycleMaxDistance() {
    const nextValue = nextQuickValue(filters.maxDistanceKm, QUICK_DISTANCE_VALUES)
    setMaxDistanceKm(nextValue)
  }

  function cycleMaxDuration() {
    const nextValue = nextQuickValue(filters.maxDurationMin, QUICK_DURATION_VALUES)
    setMaxDurationMin(nextValue)
  }

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
          difficultyLabel={difficultyLabel}
          onChangeSearchQuery={setSearchQuery}
          onCycleDifficulty={cycleDifficulty}
          onCycleMaxDistance={cycleMaxDistance}
          onCycleMaxDuration={cycleMaxDuration}
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
            onPreviewImage={setPreviewImageUrl}
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
      <ImagePreviewModal
        visible={Boolean(previewImageUrl)}
        imageUrl={previewImageUrl}
        onClose={() => setPreviewImageUrl(null)}
      />
    </SafeAreaView>
  )
}