import { Text, View } from 'react-native'

import { colors } from '../../theme/colors'
import { formatTripDistance, formatTripDuration } from '../../utils/tripFormat'

interface JournalTripSummary {
  started_at: string
  distance_m: number
  duration_s: number
}

interface JournalTripSummaryCardProps {
  trip: JournalTripSummary
}

export function JournalTripSummaryCard({ trip }: JournalTripSummaryCardProps) {
  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 18,
        marginBottom: 18,
      }}
    >
      <Text
        style={{
          color: colors.text,
          fontSize: 18,
          fontWeight: '700',
          marginBottom: 6,
        }}
      >
        Recorrido completado
      </Text>

      <Text style={{ color: colors.textSecondary, marginBottom: 10 }}>
        {new Date(trip.started_at).toLocaleDateString()}
      </Text>

      <Text style={{ color: colors.textSecondary }}>
        Distancia: {formatTripDistance(Number(trip.distance_m ?? 0))}
      </Text>

      <Text style={{ color: colors.textSecondary }}>
        Duración: {formatTripDuration(Number(trip.duration_s ?? 0))}
      </Text>
    </View>
  )
}