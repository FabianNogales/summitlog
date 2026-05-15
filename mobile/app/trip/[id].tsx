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
import {
  getRouteBySourceRecordedTripId,
  publishRecordedTripAsRoute,
} from '../../src/services/routePublish.service'
import type { RecordedTrip } from '../../src/types/trip'
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

export default function TripDetailScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuth()

  const [trip, setTrip] = useState<RecordedTrip | null>(null)
  const [loading, setLoading] = useState(true)
  const [publishingRoute, setPublishingRoute] = useState(false)
  const [publishedRouteId, setPublishedRouteId] = useState<string | null>(null)

  useEffect(() => {
    async function loadTrip() {
      if (!user || !id) {
        setLoading(false)
        return
      }

      try {
        const loadedTrip = await getRecordedTripDetailById(id, user.id)
        setTrip(loadedTrip)

        const existingRoute = await getRouteBySourceRecordedTripId(loadedTrip.id)
        setPublishedRouteId(existingRoute?.id ?? null)
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

  async function handlePublishRoute() {
    if (!trip) {
      return
    }

    try {
      setPublishingRoute(true)
      const { route, created } = await publishRecordedTripAsRoute(trip)
      setPublishedRouteId(route.id)

      Alert.alert(
        created ? 'Ruta publicada' : 'Ruta ya existente',
        created
          ? 'El recorrido se convirtio en ruta publicada.'
          : 'Este recorrido ya estaba convertido y se reutilizo la ruta existente.'
      )
    } catch (error: any) {
      Alert.alert(
        'Error al publicar ruta',
        error.message ?? 'No se pudo convertir el recorrido en ruta.'
      )
    } finally {
      setPublishingRoute(false)
    }
  }

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
            No se encontro el recorrido.
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

            <Text style={{ color: colors.textSecondary }}>Estado: {trip.status}</Text>

            <Text style={{ color: colors.textSecondary }}>
              Distancia: {formatDistance(Number(trip.distance_m ?? 0))}
            </Text>

            <Text style={{ color: colors.textSecondary }}>
              Duracion: {formatDuration(Number(trip.duration_s ?? 0))}
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
              Ubicacion inicial: {trip.start_lat ?? '-'}, {trip.start_lng ?? '-'}
            </Text>

            <Text style={{ color: colors.textSecondary }}>
              Ubicacion final: {trip.end_lat ?? '-'}, {trip.end_lng ?? '-'}
            </Text>

            <View style={{ marginTop: 18, gap: 12 }}>
              {trip.status === 'completed' ? (
                publishedRouteId ? (
                  <>
                    <Text style={{ color: colors.success, fontWeight: '700' }}>
                      Ya convertido en ruta
                    </Text>
                    <AuthButton
                      title="Ver ruta publicada"
                      onPress={() =>
                        router.push({
                          pathname: '/route/[id]',
                          params: { id: publishedRouteId },
                        })
                      }
                    />
                  </>
                ) : (
                  <AuthButton
                    title="Publicar como ruta"
                    onPress={handlePublishRoute}
                    loading={publishingRoute}
                  />
                )
              ) : null}

              <AuthButton
                title="Bitacora del recorrido"
                onPress={() =>
                  router.push({
                    pathname: '/journal/[tripId]',
                    params: { tripId: trip.id },
                  })
                }
              />
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
