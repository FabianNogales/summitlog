import { Text, View } from 'react-native'
import { colors } from '../../../theme/colors'
import {
  formatTripDateTime,
  formatTripDifficulty,
  formatTripStatus,
  formatTripVisibility,
} from '../../../utils/tripFormat'
import type { TripDetailData } from '../../../services/tripDetail.service'

interface TripDetailInfoCardProps {
  detail: TripDetailData
}

interface InfoRowProps {
  label: string
  value: string
}

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 14,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <Text style={{ color: colors.textSecondary, flex: 1 }}>{label}</Text>
      <Text
        style={{
          color: colors.text,
          fontWeight: '700',
          flex: 1,
          textAlign: 'right',
        }}
      >
        {value}
      </Text>
    </View>
  )
}

export function TripDetailInfoCard({ detail }: TripDetailInfoCardProps) {
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
          marginBottom: 4,
        }}
      >
        Información del recorrido
      </Text>

      <InfoRow label="Estado" value={formatTripStatus(trip.status)} />
      <InfoRow label="Dificultad" value={formatTripDifficulty(detail.difficulty)} />
      <InfoRow label="Categoría" value={detail.category ?? 'No definida'} />
      <InfoRow label="Visibilidad" value={formatTripVisibility(detail.visibility)} />
      <InfoRow
        label="Comentarios"
        value={
          detail.commentsEnabled == null
            ? 'No definido'
            : detail.commentsEnabled
              ? 'Habilitados'
              : 'Deshabilitados'
        }
      />
      <InfoRow label="Inicio" value={formatTripDateTime(trip.started_at)} />
      <InfoRow label="Fin" value={formatTripDateTime(trip.ended_at)} />
    </View>
  )
}