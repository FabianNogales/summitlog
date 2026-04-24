import { useEffect, useState } from 'react'
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Feather } from '@expo/vector-icons'

import { useAuth } from '../../src/hooks/useAuth'
import { colors } from '../../src/theme/colors'
import { getRecordedTripDetailById } from '../../src/services/history.service'
import type { RecordedTrip } from '../../src/types/trip'

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

export default function TripDetailScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuth()

  const [trip, setTrip] = useState<RecordedTrip | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadTrip() {
      if (!user || !id) {
        setLoading(false)
        return
      }

      try {
        const loadedTrip = await getRecordedTripDetailById(id, user.id)
        setTrip(loadedTrip)
      } catch (error: any) {
        Alert.alert(
          'Error',
          error.message ?? 'No se pudo cargar el detalle del recorrido'
        )
      } finally {
        setLoading(false)
      }
    }

    loadTrip()
  }, [id, user])

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 24,
          }}
        >
          <Pressable
            onPress={() => router.back()}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: colors.card,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}
          >
            <Feather name="arrow-left" size={18} color={colors.text} />
          </Pressable>

          <Text
            style={{
              color: colors.text,
              fontSize: 20,
              fontWeight: '700',
            }}
          >
            Detalle de actividad
          </Text>
        </View>

        {loading ? (
          <Text style={{ color: colors.textSecondary }}>Cargando...</Text>
        ) : !trip ? (
          <Text style={{ color: colors.textSecondary }}>
            No se encontró el recorrido.
          </Text>
        ) : (
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 18,
              gap: 12,
            }}
          >
            <Text
              style={{
                color: colors.text,
                fontSize: 18,
                fontWeight: '700',
              }}
            >
              {trip.title?.trim() || 'Recorrido completado'}
            </Text>

            <Text style={{ color: colors.textSecondary }}>
              Estado: {trip.status}
            </Text>

            <Text style={{ color: colors.textSecondary }}>
              Distancia: {formatDistance(Number(trip.distance_m ?? 0))}
            </Text>

            <Text style={{ color: colors.textSecondary }}>
              Duración: {formatDuration(Number(trip.duration_s ?? 0))}
            </Text>

            <Text style={{ color: colors.textSecondary }}>
              Inicio: {new Date(trip.started_at).toLocaleString()}
            </Text>

            <Text style={{ color: colors.textSecondary }}>
              Fin:{' '}
              {trip.ended_at ? new Date(trip.ended_at).toLocaleString() : 'Sin finalizar'}
            </Text>

            <Text style={{ color: colors.textSecondary }}>
              Ubicación inicial: {trip.start_lat ?? '-'}, {trip.start_lng ?? '-'}
            </Text>

            <Text style={{ color: colors.textSecondary }}>
              Ubicación final: {trip.end_lat ?? '-'}, {trip.end_lng ?? '-'}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}