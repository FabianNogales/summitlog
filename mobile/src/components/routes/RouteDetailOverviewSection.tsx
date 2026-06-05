import { useEffect, useMemo, useState } from 'react'
import { Image, Pressable, ScrollView, Text, View } from 'react-native'
import type {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native'
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
  onPreviewImage: (imageUrl: string, imageUrls?: string[]) => void
  setIsMapActive: (active: boolean) => void
}

function getRouteDisplayTitle(params: { display_title?: string; title?: string | null }) {
  return resolveRouteDisplayTitle({
    displayTitle: params.display_title,
    routeTitle: params.title,
  })
}

function getRouteDisplayImageUrl(route: RouteItem) {
  if (route.source_recorded_trip_id) {
    return route.display_image_url?.trim() ?? ''
  }

  return (
    resolveRouteDisplayImageUrl({
      displayImageUrl: route.display_image_url,
      coverImageUrl: route.cover_image_url,
    }) ?? ''
  )
}

function getRouteDisplayImageUrls(route: RouteItem) {
  let imageUrls: string[] = []

  if (route.display_image_urls?.length) {
    imageUrls = route.display_image_urls
  } else if (!route.source_recorded_trip_id) {
    imageUrls = [getRouteDisplayImageUrl(route)]
  }

  const seen = new Set<string>()
  const resolvedUrls: string[] = []

  for (const imageUrl of imageUrls) {
    const normalizedUrl = imageUrl?.trim()

    if (!normalizedUrl || seen.has(normalizedUrl)) {
      continue
    }

    seen.add(normalizedUrl)
    resolvedUrls.push(normalizedUrl)
  }

  return resolvedUrls
}

function RouteDetailOverviewSection({
  route,
  points,
  pointsLoading,
  pointsError,
  onPreviewImage,
  setIsMapActive,
}: RouteDetailOverviewSectionProps) {
  const [failedImageUrls, setFailedImageUrls] = useState<Set<string>>(new Set())
  const [carouselWidth, setCarouselWidth] = useState(0)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const routeImageUrls = useMemo(() => getRouteDisplayImageUrls(route), [route])
  const visibleImageUrls = useMemo(
    () => routeImageUrls.filter((imageUrl) => !failedImageUrls.has(imageUrl)),
    [failedImageUrls, routeImageUrls]
  )
  const carouselImageWidth = Math.max(carouselWidth, 1)

  useEffect(() => {
    setFailedImageUrls(new Set())
    setActiveImageIndex(0)
  }, [route.id, routeImageUrls])

  useEffect(() => {
    setActiveImageIndex((currentIndex) => {
      const maxIndex = Math.max(visibleImageUrls.length - 1, 0)
      return Math.min(currentIndex, maxIndex)
    })
  }, [visibleImageUrls.length])

  function handleImageError(imageUrl: string) {
    setFailedImageUrls((prev) => {
      const next = new Set(prev)
      next.add(imageUrl)
      return next
    })
  }

  function handleCarouselLayout(event: LayoutChangeEvent) {
    setCarouselWidth(event.nativeEvent.layout.width)
  }

  function handleCarouselScroll(
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) {
    if (!carouselWidth) {
      return
    }

    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / carouselWidth)
    setActiveImageIndex(
      Math.max(0, Math.min(nextIndex, visibleImageUrls.length - 1))
    )
  }

  return (
    <>
      {visibleImageUrls.length > 0 ? (
        <View
          onLayout={handleCarouselLayout}
          style={{
            marginBottom: 16,
            borderRadius: 18,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.card,
          }}
        >
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleCarouselScroll}
            scrollEventThrottle={16}
            bounces={visibleImageUrls.length > 1}
          >
            {visibleImageUrls.map((imageUrl) => (
              <Pressable
                key={imageUrl}
                onPress={() => onPreviewImage(imageUrl, visibleImageUrls)}
                style={{
                  width: carouselImageWidth,
                  height: 220,
                  backgroundColor: colors.cardSecondary,
                }}
              >
                <Image
                  source={{ uri: imageUrl }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                  onError={() => handleImageError(imageUrl)}
                />
              </Pressable>
            ))}
          </ScrollView>

          {visibleImageUrls.length > 1 ? (
            <>
              <View
                style={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  borderRadius: 999,
                  backgroundColor: 'rgba(0,0,0,0.48)',
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                }}
              >
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>
                  {activeImageIndex + 1}/{visibleImageUrls.length}
                </Text>
              </View>

              <View
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 12,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                {visibleImageUrls.map((imageUrl, index) => (
                  <View
                    key={`dot-${imageUrl}`}
                    style={{
                      width: index === activeImageIndex ? 18 : 7,
                      height: 7,
                      borderRadius: 999,
                      backgroundColor:
                        index === activeImageIndex
                          ? colors.primary
                          : 'rgba(255,255,255,0.72)',
                    }}
                  />
                ))}
              </View>
            </>
          ) : null}
        </View>
      ) : routeImageUrls.length > 0 ? (
        <View
          style={{
            height: 220,
            marginBottom: 16,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.cardSecondary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
            Imagen no disponible
          </Text>
        </View>
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
          'Esta ruta no tiene descripción todavía.'}
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
