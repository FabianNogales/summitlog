import { Pressable, Text, View } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { colors } from '../../theme/colors'
import type { RecordedTrip } from '../../types/trip'

interface TripHistoryItemProps {
  trip: RecordedTrip
  onPress: () => void
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString()
}

function formatDistance(distanceMeters: number) {
  return `${(distanceMeters / 1000).toFixed(2)} km`
}

function formatDuration(durationSeconds: number) {
  const minutes = Math.floor(durationSeconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`
  }

  return `${minutes} min`
}

export function TripHistoryItem({ trip, onPress }: TripHistoryItemProps) {
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
          {trip.title?.trim() || 'Recorrido completado'}
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
        {formatDate(trip.started_at)}
      </Text>

      <View style={{ flexDirection: 'row', gap: 14 }}>
        <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
          {formatDistance(Number(trip.distance_m ?? 0))}
        </Text>

        <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
          {formatDuration(Number(trip.duration_s ?? 0))}
        </Text>
      </View>
    </Pressable>
  )
}