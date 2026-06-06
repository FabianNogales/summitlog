import { Text, View } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { colors } from '../../../theme/colors'
import { formatTripDate } from '../../../utils/tripFormat'
import type { TripDetailData } from '../../../services/tripDetail.service'

interface TripDetailHeroProps {
  detail: TripDetailData
}

export function TripDetailHero({ detail }: TripDetailHeroProps) {
  const trip = detail.trip
  const date = formatTripDate(trip.started_at)
  const published = detail.route?.publication_status === 'published'

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
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: colors.cardSecondary,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
          }}
        >
          <Feather name="map" size={20} color={colors.primary} />
        </View>

        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: colors.text,
              fontSize: 22,
              fontWeight: '800',
              marginBottom: 4,
            }}
          >
            {detail.title}
          </Text>

          <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
            {date}
          </Text>
        </View>
      </View>

      {detail.description ? (
        <Text
          style={{
            color: colors.textSecondary,
            fontSize: 14,
            lineHeight: 22,
            marginBottom: 14,
          }}
        >
          {detail.description}
        </Text>
      ) : (
        <Text
          style={{
            color: colors.textSecondary,
            fontSize: 14,
            lineHeight: 22,
            marginBottom: 14,
          }}
        >
          Esta bitácora todavía no tiene descripción.
        </Text>
      )}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        <View
          style={{
            backgroundColor: colors.cardSecondary,
            borderColor: colors.border,
            borderWidth: 1,
            borderRadius: 999,
            paddingHorizontal: 12,
            paddingVertical: 7,
            marginRight: 8,
            marginBottom: 8,
          }}
        >
          <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '700' }}>
            {detail.isOffline ? 'Pendiente de sincronizar' : 'Sincronizado'}
          </Text>
        </View>

        <View
          style={{
            backgroundColor: colors.cardSecondary,
            borderColor: colors.border,
            borderWidth: 1,
            borderRadius: 999,
            paddingHorizontal: 12,
            paddingVertical: 7,
            marginRight: 8,
            marginBottom: 8,
          }}
        >
          <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '700' }}>
            {published ? 'Ruta pública' : 'Ruta privada'}
          </Text>
        </View>
      </View>
    </View>
  )
}