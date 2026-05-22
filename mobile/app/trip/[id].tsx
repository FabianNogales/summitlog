import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Feather } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useAuth } from '../../src/hooks/useAuth'
import { colors } from '../../src/theme/colors'
import { getRecordedTripDetailById } from '../../src/services/history.service'
import {
  getRouteBySourceRecordedTripId,
  publishRecordedTripAsRoute,
} from '../../src/services/routePublish.service'
import type { RecordedTrip } from '../../src/types/trip'
import { AuthButton } from '../../src/components/auth/AuthButton'
import {
  FORM_SCROLL_BOTTOM_PADDING,
  scrollToFocusedInput,
} from '../../src/utils/keyboard'

const DIFFICULTY_OPTIONS = [
  { label: 'Sin definir', value: '' },
  { label: 'Facil', value: 'easy' },
  { label: 'Media', value: 'medium' },
  { label: 'Dificil', value: 'hard' },
]

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
  const scrollRef = useRef<ScrollView | null>(null)

  const [trip, setTrip] = useState<RecordedTrip | null>(null)
  const [loading, setLoading] = useState(true)
  const [publishingRoute, setPublishingRoute] = useState(false)
  const [publishedRouteId, setPublishedRouteId] = useState<string | null>(null)
  const [routeTitle, setRouteTitle] = useState('')
  const [routeDescription, setRouteDescription] = useState('')
  const [routeDifficulty, setRouteDifficulty] = useState('')
  const [routeCategory, setRouteCategory] = useState('')
  const [routeCommentsEnabled, setRouteCommentsEnabled] = useState(true)
  const [publishError, setPublishError] = useState<string | null>(null)

  const loadTrip = useCallback(async () => {
    if (!user || !id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const loadedTrip = await getRecordedTripDetailById(id, user.id)
      setTrip(loadedTrip)
      setRouteTitle(loadedTrip.title?.trim() || 'Ruta publicada desde recorrido')
      setRouteDescription(loadedTrip.summary?.trim() || '')
      setRouteDifficulty('')
      setRouteCategory('')
      setRouteCommentsEnabled(true)
      setPublishError(null)

      const existingRoute = await getRouteBySourceRecordedTripId(loadedTrip.id)
      setPublishedRouteId(existingRoute?.id ?? null)

      if (existingRoute) {
        setRouteTitle(existingRoute.title || loadedTrip.title?.trim() || '')
        setRouteDescription(existingRoute.description?.trim() || loadedTrip.summary?.trim() || '')
        setRouteDifficulty(existingRoute.difficulty?.trim() || '')
        setRouteCategory(existingRoute.category?.trim() || '')
        setRouteCommentsEnabled(existingRoute.comments_enabled)
      }
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

  const canPublishRoute = trip?.status === 'completed' && !publishedRouteId

  async function handlePublishRoute() {
    if (!trip || !canPublishRoute || publishingRoute) {
      return
    }

    if (!routeTitle.trim()) {
      setPublishError('El titulo es obligatorio para publicar la ruta.')
      return
    }

    setPublishError(null)

    try {
      setPublishingRoute(true)
      const result = await publishRecordedTripAsRoute({
        recordedTripId: trip.id,
        title: routeTitle,
        description: routeDescription || null,
        difficulty: routeDifficulty || null,
        category: routeCategory || null,
        commentsEnabled: routeCommentsEnabled,
      })
      setPublishedRouteId(result.routeId)
      await loadTrip()

      Alert.alert(
        result.alreadyPublished ? 'Ruta ya publicada' : 'Ruta publicada',
        result.alreadyPublished
          ? 'Este recorrido ya estaba convertido en una ruta publica.'
          : 'El recorrido se convirtio en ruta publica correctamente.'
      )
    } catch (error: any) {
      const message =
        error.message ?? 'No se pudo convertir el recorrido en ruta.'
      setPublishError(message)
      Alert.alert(
        'Error al publicar ruta',
        message
      )
    } finally {
      setPublishingRoute(false)
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{
            flexGrow: 1,
            padding: 20,
            paddingBottom: FORM_SCROLL_BOTTOM_PADDING,
          }}
          keyboardShouldPersistTaps="handled"
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
              {trip.status !== 'completed' ? (
                <View
                  style={{
                    backgroundColor: colors.cardSecondary,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 14,
                    padding: 12,
                  }}
                >
                  <Text style={{ color: colors.textSecondary }}>
                    Solo puedes publicar recorridos con estado completed.
                  </Text>
                </View>
              ) : null}

              {publishedRouteId ? (
                <View
                  style={{
                    backgroundColor: colors.cardSecondary,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 14,
                    padding: 12,
                    gap: 10,
                  }}
                >
                  <Text style={{ color: colors.success, fontWeight: '700' }}>
                    Ruta publicada
                  </Text>
                  <AuthButton
                    title="Ver ruta publica"
                    onPress={() =>
                      router.push({
                        pathname: '/route/[id]',
                        params: { id: publishedRouteId },
                      })
                    }
                  />
                </View>
              ) : null}

              {canPublishRoute ? (
                <View
                  style={{
                    backgroundColor: colors.cardSecondary,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 14,
                    padding: 14,
                    gap: 12,
                  }}
                >
                  <Text
                    style={{
                      color: colors.text,
                      fontWeight: '700',
                      fontSize: 16,
                    }}
                  >
                    Publicar como ruta
                  </Text>

                  <View>
                    <Text style={{ color: colors.textSecondary, marginBottom: 6 }}>
                      Titulo
                    </Text>
                    <TextInput
                      value={routeTitle}
                      onChangeText={setRouteTitle}
                      onFocus={(event) => scrollToFocusedInput(scrollRef, event)}
                      placeholder="Titulo de la ruta"
                      placeholderTextColor={colors.placeholder}
                      style={{
                        backgroundColor: colors.card,
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: 10,
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        color: colors.text,
                      }}
                    />
                  </View>

                  <View>
                    <Text style={{ color: colors.textSecondary, marginBottom: 6 }}>
                      Descripcion
                    </Text>
                    <TextInput
                      value={routeDescription}
                      onChangeText={setRouteDescription}
                      onFocus={(event) => scrollToFocusedInput(scrollRef, event)}
                      placeholder="Descripcion de la ruta"
                      placeholderTextColor={colors.placeholder}
                      multiline
                      textAlignVertical="top"
                      style={{
                        backgroundColor: colors.card,
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: 10,
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        minHeight: 96,
                        color: colors.text,
                      }}
                    />
                  </View>

                  <View>
                    <Text style={{ color: colors.textSecondary, marginBottom: 8 }}>
                      Dificultad
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                      {DIFFICULTY_OPTIONS.map((option) => {
                        const active = routeDifficulty === option.value

                        return (
                          <Pressable
                            key={option.value || 'none'}
                            onPress={() => setRouteDifficulty(option.value)}
                            style={{
                              paddingHorizontal: 12,
                              paddingVertical: 9,
                              borderRadius: 20,
                              borderWidth: 1,
                              marginRight: 8,
                              marginBottom: 8,
                              borderColor: active ? colors.primary : colors.border,
                              backgroundColor: active ? colors.primary : colors.card,
                            }}
                          >
                            <Text
                              style={{
                                color: active ? colors.text : colors.textSecondary,
                                fontWeight: '600',
                              }}
                            >
                              {option.label}
                            </Text>
                          </Pressable>
                        )
                      })}
                    </View>
                  </View>

                  <View>
                    <Text style={{ color: colors.textSecondary, marginBottom: 6 }}>
                      Categoria
                    </Text>
                    <TextInput
                      value={routeCategory}
                      onChangeText={setRouteCategory}
                      onFocus={(event) => scrollToFocusedInput(scrollRef, event)}
                      placeholder="Ej: trekking, trail, senderismo"
                      placeholderTextColor={colors.placeholder}
                      style={{
                        backgroundColor: colors.card,
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: 10,
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        color: colors.text,
                      }}
                    />
                  </View>

                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Text style={{ color: colors.textSecondary }}>
                      Habilitar comentarios
                    </Text>
                    <Switch
                      value={routeCommentsEnabled}
                      onValueChange={setRouteCommentsEnabled}
                      trackColor={{
                        false: colors.border,
                        true: colors.primary,
                      }}
                      thumbColor={colors.card}
                    />
                  </View>

                  {publishError ? (
                    <Text style={{ color: colors.danger }}>{publishError}</Text>
                  ) : null}

                  <AuthButton
                    title="Publicar como ruta"
                    onPress={handlePublishRoute}
                    loading={publishingRoute}
                  />
                </View>
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
