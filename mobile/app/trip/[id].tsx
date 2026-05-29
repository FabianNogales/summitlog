import { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Feather } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useAuth } from '../../src/hooks/useAuth'
import { colors } from '../../src/theme/colors'
import { getRecordedTripDetailById } from '../../src/services/history.service'
import { getOfflineRecordedTripById } from '../../src/services/offlineTrip.service'
import type { RecordedTrip } from '../../src/types/trip'
import type { OfflineRecordedTrip } from '../../src/types/offlineTrip'
import { AuthButton } from '../../src/components/auth/AuthButton'

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

function mapOfflineTripToRecordedTrip(trip: OfflineRecordedTrip): RecordedTrip {
  return {
    id: trip.local_id,
    user_id: trip.user_id,
    status: trip.status,
    is_private: true,
    title: 'Recorrido pendiente de sincronizar',
    summary: null,
    started_at: trip.started_at,
    ended_at: trip.ended_at,
    distance_m: trip.distance_m,
    duration_s: trip.duration_s,
    elevation_gain_m: null,
    avg_speed_mps: null,
    max_speed_mps: null,
    start_lat: trip.start_lat,
    start_lng: trip.start_lng,
    end_lat: trip.end_lat,
    end_lng: trip.end_lng,
    created_at: trip.created_at,
    updated_at: trip.updated_at,
    local_id: trip.local_id,
    remote_id: trip.remote_id,
    sync_status: trip.sync_status,
    is_offline: true,
  } as RecordedTrip
}

export default function TripDetailScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuth()

  const [trip, setTrip] = useState<RecordedTrip | null>(null)
  const [loading, setLoading] = useState(true)

  const loadTrip = useCallback(async () => {
    if (!user || !id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      const localTrip = await getOfflineRecordedTripById(id)

      if (localTrip) {
        setTrip(mapOfflineTripToRecordedTrip(localTrip))
        return
      }

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
  }, [id, user])

  useEffect(() => {
    loadTrip()
  }, [loadTrip])

  function handleEditJournal() {
    if (!trip) return

    router.push({
      pathname: '/journal/[tripId]',
      params: { tripId: trip.local_id ?? trip.id },
    })
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          padding: 20,
          paddingBottom: 40,
        }}
      >
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

            {trip.is_offline ? (
              <View
                style={{
                  alignSelf: 'flex-start',
                  backgroundColor: colors.cardSecondary,
                  borderRadius: 999,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                }}
              >
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                  Pendiente de sincronizar
                </Text>
              </View>
            ) : null}

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
              {trip.ended_at
                ? new Date(trip.ended_at).toLocaleString()
                : 'Sin finalizar'}
            </Text>

            <Text style={{ color: colors.textSecondary }}>
              Ubicación inicial: {trip.start_lat ?? '-'}, {trip.start_lng ?? '-'}
            </Text>

            <Text style={{ color: colors.textSecondary }}>
              Ubicación final: {trip.end_lat ?? '-'}, {trip.end_lng ?? '-'}
            </Text>

            <View style={{ marginTop: 18 }}>
              <AuthButton
                title="Editar bitácora"
                onPress={handleEditJournal}
                disabled={trip.status !== 'completed'}
              />
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}