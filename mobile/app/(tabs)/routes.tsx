import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useFocusEffect } from '@react-navigation/native'
import { useCallback, useMemo, useState } from 'react'
import { Filter, List, Map, Search, SlidersHorizontal } from 'lucide-react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { ImagePreviewModal } from '../../src/components/common/ImagePreviewModal'
import { RoutesMap } from '../../src/components/map/RoutesMap'
import { RoutesFiltersPanel } from '../../src/components/routes/RoutesFiltersPanel'
import { usePublishedRoutes } from '../../src/hooks/usePublishedRoutes'
import { useRouteFilters } from '../../src/hooks/useRouteFilters'
import { colors } from '../../src/theme/colors'
import type { RouteItem } from '../../src/types/route'
import {
  formatRouteDifficultyLabel,
  formatRouteListDistance,
  formatRouteListDuration,
} from '../../src/utils/routeFormat'
import {
  resolveRouteDisplayImageUrl,
  resolveRouteDisplayTitle,
} from '../../src/utils/routeDisplay'

const QUICK_DISTANCE_VALUES = ['', '5', '10', '20']
const QUICK_DURATION_VALUES = ['', '60', '120', '240']

function nextQuickValue(current: string, values: string[]) {
  const currentIndex = values.findIndex((value) => value === current)
  if (currentIndex < 0) return values[0]

  const nextIndex = (currentIndex + 1) % values.length
  return values[nextIndex]
}

function getRouteDisplayTitle(route: RouteItem) {
  return resolveRouteDisplayTitle({
    displayTitle: route.display_title,
    routeTitle: route.title,
  })
}

function getRouteDisplayImageUrl(route: RouteItem) {
  return (
    resolveRouteDisplayImageUrl({
      displayImageUrl: route.display_image_url,
      coverImageUrl: route.cover_image_url,
    }) ?? ''
  )

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
        <View
          style={{
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 10,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 13,
                marginBottom: 4,
              }}
            >
              Bienvenido de vuelta,
            </Text>

            <Text
              style={{
                color: colors.text,
                fontSize: 22,
                fontWeight: '800',
                lineHeight: 26,
              }}
            >
              Explorar rutas
            </Text>
          </View>

          <Pressable
            onPress={() => setViewMode((prev) => (prev === 'map' ? 'list' : 'map'))}
            style={{
              backgroundColor: colors.cardSecondary,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 16,
              minHeight: 42,
              paddingHorizontal: 12,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
            }}
          >
            {viewMode === 'map' ? (
              <List size={14} color={colors.primary} />
            ) : (
              <Map size={14} color={colors.primary} />
            )}
            <Text
              style={{
                color: colors.text,
                fontSize: 14,
                fontWeight: '700',
              }}
            >
              {viewMode === 'map' ? 'Lista' : 'Mapa'}
            </Text>
          </Pressable>
        </View>

        <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
          <View
            style={{
              backgroundColor: colors.cardSecondary,
              borderColor: colors.border,
              borderWidth: 1,
              borderRadius: 16,
              minHeight: 52,
              paddingHorizontal: 14,
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 10,
            }}
          >
            <Search size={18} color={colors.textSecondary} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Buscar rutas, lugares..."
              placeholderTextColor={colors.placeholder}
              style={{
                flex: 1,
                color: colors.text,
                fontSize: 14,
                marginLeft: 10,
              }}
            />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 16 }}
          >
            <Pressable
              onPress={cycleDifficulty}
              style={{
                backgroundColor:
                  filters.difficulty !== 'all' ? colors.chipActiveBg : colors.cardSecondary,
                borderColor:
                  filters.difficulty !== 'all' ? colors.chipActiveBg : colors.border,
                borderWidth: 1,
                borderRadius: 16,
                minHeight: 40,
                paddingHorizontal: 12,
                marginRight: 8,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Filter
                size={13}
                color={filters.difficulty !== 'all' ? colors.chipActiveText : colors.textSecondary}
              />
              <Text
                style={{
                  color:
                    filters.difficulty !== 'all' ? colors.chipActiveText : colors.textSecondary,
                  fontSize: 14,
                  fontWeight: '600',
                  marginLeft: 7,
                }}
              >
                Dificultad
              </Text>
            </Pressable>

            <Pressable
              onPress={cycleMaxDistance}
              style={{
                backgroundColor: filters.maxDistanceKm ? colors.chipActiveBg : colors.cardSecondary,
                borderColor: filters.maxDistanceKm ? colors.chipActiveBg : colors.border,
                borderWidth: 1,
                borderRadius: 16,
                minHeight: 40,
                paddingHorizontal: 12,
                marginRight: 8,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Filter
                size={13}
                color={filters.maxDistanceKm ? colors.chipActiveText : colors.textSecondary}
              />
              <Text
                style={{
                  color: filters.maxDistanceKm ? colors.chipActiveText : colors.textSecondary,
                  fontSize: 14,
                  fontWeight: '600',
                  marginLeft: 7,
                }}
              >
                Distancia
              </Text>
            </Pressable>

            <Pressable
              onPress={cycleMaxDuration}
              style={{
                backgroundColor: filters.maxDurationMin ? colors.chipActiveBg : colors.cardSecondary,
                borderColor: filters.maxDurationMin ? colors.chipActiveBg : colors.border,
                borderWidth: 1,
                borderRadius: 16,
                minHeight: 40,
                paddingHorizontal: 12,
                marginRight: 8,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Filter
                size={13}
                color={filters.maxDurationMin ? colors.chipActiveText : colors.textSecondary}
              />
              <Text
                style={{
                  color: filters.maxDurationMin ? colors.chipActiveText : colors.textSecondary,
                  fontSize: 14,
                  fontWeight: '600',
                  marginLeft: 7,
                }}
              >
                Duracion
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setShowAdvancedFilters((prev) => !prev)}
              style={{
                backgroundColor: showAdvancedFilters ? colors.chipActiveBg : colors.cardSecondary,
                borderColor: showAdvancedFilters ? colors.chipActiveBg : colors.border,
                borderWidth: 1,
                borderRadius: 16,
                minHeight: 40,
                paddingHorizontal: 12,
                marginRight: 8,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <SlidersHorizontal
                size={13}
                color={showAdvancedFilters ? colors.chipActiveText : colors.textSecondary}
              />
              <Text
                style={{
                  color: showAdvancedFilters ? colors.chipActiveText : colors.textSecondary,
                  fontSize: 14,
                  fontWeight: '600',
                  marginLeft: 7,
                }}
              >
                Filtros personalizados
              </Text>
            </Pressable>
          </ScrollView>

          {hasActiveFilters ? (
            <Pressable
              onPress={clearFilters}
              style={{ alignSelf: 'flex-end', marginTop: 8, paddingVertical: 2 }}
            >
              <Text
                style={{
                  color: colors.primary,
                  fontSize: 13,
                  fontWeight: '600',
                }}
              >
                Limpiar filtros
              </Text>
            </Pressable>
          ) : null}

          <Text
            style={{
              color: colors.textSecondary,
              fontSize: 13,
              marginTop: hasActiveFilters ? 0 : 8,
            }}
          >
            {filteredRoutes.length} rutas encontradas
          </Text>

          {(filters.difficulty !== 'all' ||
            filters.maxDistanceKm ||
            filters.maxDurationMin ||
            searchQuery.trim()) && (
            <Text
              style={{
                color: colors.textMuted,
                fontSize: 12,
                marginTop: 4,
              }}
            >
              {`Filtros activos: dificultad ${difficultyLabel}${
                searchQuery.trim() ? `, busqueda "${searchQuery.trim()}"` : ''
              }`}
            </Text>
          )}
        </View>

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
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
          >
            {loading ? (
              <Text style={{ color: colors.textSecondary }}>Cargando rutas...</Text>
            ) : error ? (
              <Text style={{ color: colors.text }}>{error}</Text>
            ) : filteredRoutes.length === 0 ? (
              <Text style={{ color: colors.textSecondary }}>No hay rutas para mostrar.</Text>
            ) : (
              filteredRoutes.map((route) => (
                <Pressable
                  key={route.id}
                  onPress={() => handlePressRoute(route)}
                  style={{
                    marginBottom: 12,
                    borderRadius: 18,
                    overflow: 'hidden',
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.card,
                  }}
                >
                  {getRouteDisplayImageUrl(route) ? (
                    <Pressable onPress={() => setPreviewImageUrl(getRouteDisplayImageUrl(route))}>
                      <Image
                        source={{ uri: getRouteDisplayImageUrl(route) }}
                        style={{ width: '100%', height: 120 }}
                        resizeMode="cover"
                      />
                    </Pressable>
                  ) : (
                    <View
                      style={{
                        width: '100%',
                        height: 120,
                        backgroundColor: colors.cardSecondary,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                        Sin imagen
                      </Text>
                    </View>
                  )}

                  <View style={{ padding: 12 }}>
                    <Text
                      style={{
                        color: colors.text,
                        fontSize: 16,
                        fontWeight: '700',
                        marginBottom: 8,
                      }}
                      numberOfLines={1}
                    >
                      {getRouteDisplayTitle(route)}
                    </Text>

                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text
                        style={{
                          color: colors.primary,
                          fontSize: 12,
                          fontWeight: '700',
                          marginRight: 10,
                        }}
                      >
                        {formatRouteDifficultyLabel(route.difficulty)}
                      </Text>
                      <Text style={{ color: colors.textSecondary, fontSize: 12, marginRight: 10 }}>
                        {formatRouteListDistance(Number(route.distance_m ?? 0))}
                      </Text>
                      <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                        {formatRouteListDuration(Number(route.duration_s ?? 0))}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              ))
            )}
          </ScrollView>
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