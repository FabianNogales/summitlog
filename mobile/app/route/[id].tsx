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

import { colors } from '../../src/theme/colors'
import { getRouteById } from '../../src/services/route.service'
import type { RouteItem } from '../../src/types/route'
import { RouteInfoRow } from '../../src/components/routes/RouteInfoRow'
import {
  formatRouteDistance,
  formatRouteDuration,
} from '../../src/utils/routeFormat'

export default function RouteDetailScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()

  const [route, setRoute] = useState<RouteItem | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadRoute() {
      if (!id) {
        setLoading(false)
        return
      }

      try {
        const loadedRoute = await getRouteById(id)
        setRoute(loadedRoute)
      } catch (error: any) {
        Alert.alert(
          'Error',
          error.message ?? 'No se pudo cargar el detalle de la ruta'
        )
      } finally {
        setLoading(false)
      }
    }

    loadRoute()
  }, [id])

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
            Detalle de ruta
          </Text>
        </View>

        {loading ? (
          <Text style={{ color: colors.textSecondary }}>Cargando ruta...</Text>
        ) : !route ? (
          <Text style={{ color: colors.textSecondary }}>
            No se encontró la ruta.
          </Text>
        ) : (
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 18,
            }}
          >
            <Text
              style={{
                color: colors.text,
                fontSize: 22,
                fontWeight: '700',
                marginBottom: 8,
              }}
            >
              {route.title}
            </Text>

            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 14,
                marginBottom: 18,
                lineHeight: 22,
              }}
            >
              {route.description?.trim() || 'Esta ruta no tiene descripción todavía.'}
            </Text>

            <RouteInfoRow
              label="Distancia"
              value={formatRouteDistance(Number(route.distance_m ?? 0))}
            />

            <RouteInfoRow
              label="Duración estimada"
              value={formatRouteDuration(Number(route.duration_s ?? 0))}
            />

            <RouteInfoRow
              label="Dificultad"
              value={route.difficulty ?? 'No definida'}
            />

            <RouteInfoRow
              label="Categoría"
              value={route.category ?? 'No definida'}
            />

            <RouteInfoRow
              label="Elevación"
              value={
                route.elevation_gain_m != null
                  ? `${Number(route.elevation_gain_m).toFixed(0)} m`
                  : 'No disponible'
              }
            />

            <RouteInfoRow
              label="Comentarios"
              value={route.comments_enabled ? 'Habilitados' : 'Deshabilitados'}
            />

            <View style={{ marginTop: 18 }}>
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: 13,
                  marginBottom: 6,
                }}
              >
                Coordenadas iniciales
              </Text>

              <Text style={{ color: colors.text, fontSize: 14 }}>
                {route.start_lat ?? '-'}, {route.start_lng ?? '-'}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}