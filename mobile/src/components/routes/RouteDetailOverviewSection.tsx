import { Image, Pressable, Text, View } from 'react-native'
import { colors } from '../../theme/colors'
import type { RouteItem, RoutePoint } from '../../types/route'
import {
  resolveRouteDisplayDescription,
  resolveRouteDisplayImageUrl,
  resolveRouteDisplayTitle,
} from '../../utils/routeDisplay'
import { formatRouteDistance, formatRouteDuration } from '../../utils/routeFormat'
import { RouteDetailMap } from './RouteDetailMap'
import { RouteInfoRow } from './RouteInfoRow'

interface RouteDetailOverviewSectionProps {
  route: RouteItem
  points: RoutePoint[]
  pointsLoading: boolean
  pointsError: string | null
  onPreviewImage: (imageUrl: string) => void
  setIsMapActive: (active: boolean) => void
}

function getRouteDisplayTitle(params: { display_title?: string; title?: string | null }) {
  return resolveRouteDisplayTitle({
    displayTitle: params.display_title,
    routeTitle: params.title,
  })
}

function getRouteDisplayImageUrl(params: {
  display_image_url?: string | null
  cover_image_url?: string | null
}) {
  return (
    resolveRouteDisplayImageUrl({
      displayImageUrl: params.display_image_url,
      coverImageUrl: params.cover_image_url,
    }) ?? ''
  )
}

function RouteDetailOverviewSection({
  route,
  points,
  pointsLoading,
  pointsError,
  onPreviewImage,
  setIsMapActive,
}: RouteDetailOverviewSectionProps) {
  const displayImageUrl = getRouteDisplayImageUrl(route)

  return (
    <>
      {displayImageUrl ? (
        <Pressable
          onPress={() => onPreviewImage(displayImageUrl)}
          style={{
            marginBottom: 16,
            borderRadius: 18,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.card,
          }}
        >
          <Image
            source={{ uri: displayImageUrl }}
            style={{ width: '100%', height: 180 }}
            resizeMode="cover"
          />
        </Pressable>
      ) : null}

      <Text
        style={{
          color: colors.text,
          fontSize: 24,
          fontWeight: '700',
          marginBottom: 8,
        }}
      >
        {getRouteDisplayTitle(route)}
      </Text>

      <Text
        style={{
          color: colors.textSecondary,
          fontSize: 14,
          lineHeight: 22,
          marginBottom: 18,
        }}
      >
        {resolveRouteDisplayDescription({ routeDescription: route.description }) ||
          'Esta ruta no tiene descripciÃ³n todavÃ­a.'}
      </Text>

      <RouteDetailMap
        route={route}
        points={points}
        setIsMapActive={setIsMapActive}
      />

      {pointsLoading ? (
        <Text style={{ color: colors.textSecondary, marginBottom: 18 }}>
          Cargando trazado de la ruta...
        </Text>
      ) : pointsError ? (
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 12,
            marginBottom: 18,
          }}
        >
          <Text style={{ color: colors.danger }}>{pointsError}</Text>
        </View>
      ) : null}

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
          label="DuraciÃ³n estimada"
          value={formatRouteDuration(Number(route.duration_s ?? 0))}
        />

        <RouteInfoRow
          label="Dificultad"
          value={route.difficulty ?? 'No definida'}
        />

        <RouteInfoRow
          label="CategorÃ­a"
          value={route.category ?? 'No definida'}
        />

        <RouteInfoRow
          label="ElevaciÃ³n"
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
  )
}
export default RouteDetailOverviewSection