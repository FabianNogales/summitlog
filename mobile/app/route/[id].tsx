import { Alert, Pressable, SafeAreaView, ScrollView, Text, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Feather } from '@expo/vector-icons'

import { colors } from '../../src/theme/colors'
import { RouteInfoRow } from '../../src/components/routes/RouteInfoRow'
import { RouteDetailMap } from '../../src/components/routes/RouteDetailMap'
import { RouteReportItem } from '../../src/components/routes/RouteReportItem'
import {
  formatRouteDistance,
  formatRouteDuration,
} from '../../src/utils/routeFormat'
import { useRouteDetail } from '../../src/hooks/useRouteDetail'

export default function RouteDetailScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { route, points, reports, loading, error } = useRouteDetail(id)

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
        ) : error ? (
          <Text style={{ color: colors.textSecondary }}>{error}</Text>
        ) : !route ? (
          <Text style={{ color: colors.textSecondary }}>
            No se encontró la ruta.
          </Text>
        ) : (
          <>
            <Text
              style={{
                color: colors.text,
                fontSize: 24,
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
                lineHeight: 22,
                marginBottom: 18,
              }}
            >
              {route.description?.trim() || 'Esta ruta no tiene descripción todavía.'}
            </Text>

            <RouteDetailMap route={route} points={points} />

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
            </View>

            <View style={{ marginBottom: 18 }}>
              <Text
                style={{
                  color: colors.text,
                  fontSize: 18,
                  fontWeight: '700',
                  marginBottom: 12,
                }}
              >
                Reportes recientes
              </Text>

              {reports.length === 0 ? (
                <View
                  style={{
                    backgroundColor: colors.card,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: colors.border,
                    padding: 16,
                  }}
                >
                  <Text style={{ color: colors.textSecondary }}>
                    Esta ruta todavía no tiene reportes visibles.
                  </Text>
                </View>
              ) : (
                reports.map((report) => (
                  <RouteReportItem key={report.id} report={report} />
                ))
              )}
            </View>

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
                  fontSize: 16,
                  fontWeight: '700',
                  marginBottom: 10,
                }}
              >
                Coordenadas iniciales
              </Text>

              <Text style={{ color: colors.textSecondary, marginBottom: 14 }}>
                {route.start_lat ?? '-'}, {route.start_lng ?? '-'}
              </Text>

              <Text
                style={{
                  color: colors.text,
                  fontSize: 16,
                  fontWeight: '700',
                  marginBottom: 10,
                }}
              >
                Coordenadas finales
              </Text>

              <Text style={{ color: colors.textSecondary }}>
                {route.end_lat ?? '-'}, {route.end_lng ?? '-'}
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}