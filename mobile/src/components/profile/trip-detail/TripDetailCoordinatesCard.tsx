import { Text, View } from 'react-native'
import { colors } from '../../../theme/colors'
import type { TripDetailData } from '../../../services/tripDetail.service'

interface TripDetailCoordinatesCardProps {
  detail: TripDetailData
}

function formatCoordinate(value: number | null | undefined) {
  if (value == null || !Number.isFinite(Number(value))) {
    return '-'
  }

  return Number(value).toFixed(6)
}

export function TripDetailCoordinatesCard({ detail }: TripDetailCoordinatesCardProps) {
  const trip = detail.trip

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 22,
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
          fontWeight: '800',
          marginBottom: 14,
        }}
      >
        Coordenadas
      </Text>

      <View style={{ marginBottom: 14 }}>
        <Text style={{ color: colors.textSecondary, marginBottom: 6 }}>
          Punto inicial
        </Text>
        <Text style={{ color: colors.text, fontWeight: '700' }}>
          {formatCoordinate(trip.start_lat)}, {formatCoordinate(trip.start_lng)}
        </Text>
      </View>

      <View>
        <Text style={{ color: colors.textSecondary, marginBottom: 6 }}>
          Punto final
        </Text>
        <Text style={{ color: colors.text, fontWeight: '700' }}>
          {formatCoordinate(trip.end_lat)}, {formatCoordinate(trip.end_lng)}
        </Text>
      </View>
    </View>
  )
}