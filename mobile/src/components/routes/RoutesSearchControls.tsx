import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { Filter, Search, SlidersHorizontal } from 'lucide-react-native'
import { colors } from '../../theme/colors'
import type { RouteFilters } from '../../types/routeFilters'

interface RoutesSearchControlsProps {
  filters: RouteFilters
  searchQuery: string
  resultCount: number
  hasActiveFilters: boolean
  showAdvancedFilters: boolean
  difficultyLabel: string
  onChangeSearchQuery: (value: string) => void
  onCycleDifficulty: () => void
  onCycleMaxDistance: () => void
  onCycleMaxDuration: () => void
  onToggleAdvancedFilters: () => void
  onClearFilters: () => void
}

export function RoutesSearchControls({
  filters,
  searchQuery,
  resultCount,
  hasActiveFilters,
  showAdvancedFilters,
  difficultyLabel,
  onChangeSearchQuery,
  onCycleDifficulty,
  onCycleMaxDistance,
  onCycleMaxDuration,
  onToggleAdvancedFilters,
  onClearFilters,
}: RoutesSearchControlsProps) {
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
          onPress={onCycleDifficulty}
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
          onPress={onCycleMaxDistance}
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
          onPress={onCycleMaxDuration}
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
          onPress={onToggleAdvancedFilters}
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
  )
}