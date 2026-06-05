import { Image, Pressable, ScrollView, Text, View } from 'react-native'
import { colors } from '../../theme/colors'
import type { RouteItem } from '../../types/route'
import {
  resolveRouteDisplayImageUrl,
  resolveRouteDisplayTitle,
} from '../../utils/routeDisplay'
import {
  formatRouteDifficultyLabel,
  formatRouteListDistance,
  formatRouteListDuration,
} from '../../utils/routeFormat'

interface RoutesListProps {
  routes: RouteItem[]
  loading: boolean
  error: string | null
  onPressRoute: (route: RouteItem) => void
}

function getRouteDisplayTitle(route: RouteItem) {
  return resolveRouteDisplayTitle({
    displayTitle: route.display_title,
    routeTitle: route.title,
  })
}

function getRouteDisplayImageUrl(route: RouteItem) {
  return (
    resolveRouteDisplayImageUrl({
      displayImageUrl: route.display_image_url,
      coverImageUrl: route.cover_image_url,
    }) ?? ''
  )
}

function RouteListCard({
  route,
  onPressRoute,
}: {
  route: RouteItem
  onPressRoute: (route: RouteItem) => void
}) {
  const displayImageUrl = getRouteDisplayImageUrl(route)

  return (
    <Pressable
      onPress={() => onPressRoute(route)}
      style={{
        marginBottom: 12,
        borderRadius: 18,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.card,
      }}
    >
      {displayImageUrl ? (
        <Image
          source={{ uri: displayImageUrl }}
          style={{ width: '100%', height: 120 }}
          resizeMode="cover"
        />
      ) : (
        <View
          style={{
            width: '100%',
            height: 120,
            backgroundColor: colors.cardSecondary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
            Sin imagen
          </Text>
        </View>
      )}

      <View style={{ padding: 12 }}>
        <Text
          style={{
            color: colors.text,
            fontSize: 16,
            fontWeight: '700',
            marginBottom: 8,
          }}
          numberOfLines={1}
        >
          {getRouteDisplayTitle(route)}
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text
            style={{
              color: colors.primary,
              fontSize: 12,
              fontWeight: '700',
              marginRight: 10,
            }}
          >
            {formatRouteDifficultyLabel(route.difficulty)}
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 12, marginRight: 10 }}>
            {formatRouteListDistance(Number(route.distance_m ?? 0))}
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
            {formatRouteListDuration(Number(route.duration_s ?? 0))}
          </Text>
        </View>
      </View>
    </Pressable>
  )
}

export function RoutesList({
  routes,
  loading,
  error,
  onPressRoute,
}: RoutesListProps) {
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
    >
      {loading ? (
        <Text style={{ color: colors.textSecondary }}>Cargando rutas...</Text>
      ) : error ? (
        <Text style={{ color: colors.text }}>{error}</Text>
      ) : routes.length === 0 ? (
        <Text style={{ color: colors.textSecondary }}>No hay rutas para mostrar.</Text>
      ) : (
        routes.map((route) => (
          <RouteListCard
            key={route.id}
            route={route}
            onPressRoute={onPressRoute}
          />
        ))
      )}
    </ScrollView>
  )
}
