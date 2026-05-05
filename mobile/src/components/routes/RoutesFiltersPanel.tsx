import { Pressable, Text, TextInput, View } from 'react-native'
import { colors } from '../../theme/colors'
import { RouteFilterChip } from './RouteFilterChip'
import type { RouteFilters } from '../../types/routeFilters'

interface RoutesFiltersPanelProps {
  filters: RouteFilters
  resultCount: number
  onChangeDifficulty: (difficulty: 'all' | 'easy' | 'medium' | 'hard') => void
  onChangeMaxDistanceKm: (value: string) => void
  onChangeMaxDurationMin: (value: string) => void
  onClearFilters: () => void
}

export function RoutesFiltersPanel({
  filters,
  resultCount,
  onChangeDifficulty,
  onChangeMaxDistanceKm,
  onChangeMaxDurationMin,
  onClearFilters,
}: RoutesFiltersPanelProps) {
  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 18,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <Text
          style={{
            color: colors.text,
            fontSize: 16,
            fontWeight: '700',
          }}
        >
          Filtros
        </Text>

        <Pressable onPress={onClearFilters}>
          <Text
            style={{
              color: colors.primary,
              fontSize: 13,
              fontWeight: '600',
            }}
          >
            Limpiar
          </Text>
        </Pressable>
      </View>

      <Text
        style={{
          color: colors.textSecondary,
          fontSize: 13,
          marginBottom: 10,
        }}
      >
        Dificultad
      </Text>

      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          marginBottom: 16,
        }}
      >
        <RouteFilterChip
          label="Todas"
          active={filters.difficulty === 'all'}
          onPress={() => onChangeDifficulty('all')}
        />
        <RouteFilterChip
          label="Fácil"
          active={filters.difficulty === 'easy'}
          onPress={() => onChangeDifficulty('easy')}
        />
        <RouteFilterChip
          label="Media"
          active={filters.difficulty === 'medium'}
          onPress={() => onChangeDifficulty('medium')}
        />
        <RouteFilterChip
          label="Difícil"
          active={filters.difficulty === 'hard'}
          onPress={() => onChangeDifficulty('hard')}
        />
      </View>

      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: 13,
              marginBottom: 8,
            }}
          >
            Distancia máx. (km)
          </Text>

          <TextInput
            value={filters.maxDistanceKm}
            onChangeText={onChangeMaxDistanceKm}
            keyboardType="numeric"
            placeholder="Ej: 10"
            placeholderTextColor={colors.placeholder}
            style={{
              backgroundColor: colors.cardSecondary,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 12,
              color: colors.text,
            }}
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: 13,
              marginBottom: 8,
            }}
          >
            Duración máx. (min)
          </Text>

          <TextInput
            value={filters.maxDurationMin}
            onChangeText={onChangeMaxDurationMin}
            keyboardType="numeric"
            placeholder="Ej: 120"
            placeholderTextColor={colors.placeholder}
            style={{
              backgroundColor: colors.cardSecondary,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 12,
              color: colors.text,
            }}
          />
        </View>
      </View>

      <Text
        style={{
          color: colors.textSecondary,
          fontSize: 13,
        }}
      >
        Resultados encontrados: {resultCount}
      </Text>
    </View>
  )
}