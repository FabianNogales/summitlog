import { Pressable, Text, View } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { colors } from '../../theme/colors'
import type { RecordedTrip } from '../../types/trip'
import { formatRecordedTripFallbackTitle } from '../../utils/date'
import {
  formatTripDate,
  formatTripDistance,
  formatTripDuration,
} from '../../utils/tripFormat'

interface TripHistoryItemProps {
  trip: RecordedTrip
  onPress: () => void
}

export function TripHistoryItem({ trip, onPress }: TripHistoryItemProps) {
  const title =
    trip.display_title?.trim() ||
    trip.title?.trim() ||
    formatRecordedTripFallbackTitle(trip.started_at)

  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: colors.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 16,
        marginBottom: 12,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
        }}
      >
        <Text
          style={{
            color: colors.text,
            fontSize: 16,
            fontWeight: '700',
            flex: 1,
            marginRight: 8,
          }}
        >
          {title}
        </Text>

        <Feather name="chevron-right" size={18} color={colors.textSecondary} />
      </View>

      <Text
        style={{
          color: colors.textSecondary,
          fontSize: 13,
          marginBottom: 12,
        }}
      >
        {formatTripDate(trip.started_at)}
      </Text>

      <View style={{ flexDirection: 'row', gap: 14 }}>
        <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
          {formatTripDistance(Number(trip.distance_m ?? 0))}
        </Text>

        <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
          {formatTripDuration(Number(trip.duration_s ?? 0))}
        </Text>
      </View>
    </Pressable>
  )
}