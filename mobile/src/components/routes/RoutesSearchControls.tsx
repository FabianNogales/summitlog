import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { Search, SlidersHorizontal } from 'lucide-react-native'
import { colors } from '../../theme/colors'
import type { RouteFilters } from '../../types/routeFilters'

interface RoutesSearchControlsProps {
  filters: RouteFilters
  searchQuery: string
  resultCount: number
  hasActiveFilters: boolean
  showAdvancedFilters: boolean
  onChangeSearchQuery: (value: string) => void
  onToggleAdvancedFilters: () => void
  onClearFilters: () => void
}

export function RoutesSearchControls({
  filters,
  searchQuery,
  resultCount,
  hasActiveFilters,
  showAdvancedFilters,
  onChangeSearchQuery,
  onToggleAdvancedFilters,
  onClearFilters,
}: RoutesSearchControlsProps) {
  const difficultyLabels = {
    easy: 'Fácil',
    medium: 'Media',
    hard: 'Difícil',
  } as const
  const activeFilterLabels: string[] = []

  if (filters.difficulty !== 'all') {
    activeFilterLabels.push(`dificultad ${difficultyLabels[filters.difficulty]}`)
  }

  if (filters.maxDistanceKm) {
    activeFilterLabels.push(`distancia hasta ${filters.maxDistanceKm} km`)
  }

  if (filters.maxDurationMin) {
    activeFilterLabels.push(`duración hasta ${filters.maxDurationMin} min`)
  }

  const customFiltersChipActive = showAdvancedFilters || hasActiveFilters

  return (
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
          onChangeText={onChangeSearchQuery}
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
          onPress={onToggleAdvancedFilters}
          style={{
            backgroundColor: customFiltersChipActive ? colors.chipActiveBg : colors.cardSecondary,
            borderColor: customFiltersChipActive ? colors.chipActiveBg : colors.border,
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
            color={customFiltersChipActive ? colors.chipActiveText : colors.textSecondary}
          />
          <Text
            style={{
              color: customFiltersChipActive ? colors.chipActiveText : colors.textSecondary,
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
          onPress={onClearFilters}
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
        {resultCount} rutas encontradas
      </Text>

      {hasActiveFilters ? (
        <Text
          style={{
            color: colors.textMuted,
            fontSize: 12,
            marginTop: 4,
          }}
        >
          {`Filtros activos: ${activeFilterLabels.join(', ')}`}
        </Text>
      ) : null}
    </View>
  )
}
