import { Text, View } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { colors } from '../../../theme/colors'
import {
  formatTripAltitude,
  formatTripDistance,
  formatTripDuration,
  formatTripElevation,
} from '../../../utils/tripFormat'
import type { TripDetailData } from '../../../services/tripDetail.service'

interface TripDetailStatsGridProps {
  detail: TripDetailData
}

interface StatCardProps {
  icon: keyof typeof Feather.glyphMap
  label: string
  value: string
}

function StatCard({ icon, label, value }: StatCardProps) {
  return (
    <View
      style={{
        width: '48%',
        backgroundColor: colors.card,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 14,
        marginBottom: 12,
      }}
    >
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 17,
          backgroundColor: colors.cardSecondary,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 10,
        }}
      >
        <Feather name={icon} size={17} color={colors.primary} />
      </View>

      <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 4 }}>
        {label}
      </Text>

      <Text style={{ color: colors.text, fontSize: 17, fontWeight: '800' }}>
        {value}
      </Text>
    </View>
  )
}

export function TripDetailStatsGrid({ detail }: TripDetailStatsGridProps) {
  const trip = detail.trip

  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 6,
      }}
    >
      <StatCard
        icon="navigation"
        label="Distancia"
        value={formatTripDistance(Number(trip.distance_m ?? 0))}
      />

      <StatCard
        icon="clock"
        label="Duración"
        value={formatTripDuration(Number(trip.duration_s ?? 0))}
      />

      <StatCard
        icon="trending-up"
        label="Desnivel"
        value={formatTripElevation(Number(trip.elevation_gain_m ?? 0))}
      />

      <StatCard
        icon="bar-chart-2"
        label="Altitud máx."
        value={formatTripAltitude(detail.maxAltitudeM)}
      />
    </View>
  )
}