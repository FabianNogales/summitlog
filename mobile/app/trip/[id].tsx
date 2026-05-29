import { useEffect, useMemo, useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

import { colors } from '../../src/theme/colors'
import { useAuth } from '../../src/hooks/useAuth'
import { useTripDetail } from '../../src/hooks/useTripDetail'
import { TripDetailTopBar } from '../../src/components/profile/trip-detail/TripDetailTopBar'
import { TripDetailHero } from '../../src/components/profile/trip-detail/TripDetailHero'
import { TripDetailStatsGrid } from '../../src/components/profile/trip-detail/TripDetailStatsGrid'
import { TripDetailMapPreview } from '../../src/components/profile/trip-detail/TripDetailMapPreview'
import { TripDetailInfoCard } from '../../src/components/profile/trip-detail/TripDetailInfoCard'
import { TripDetailCoordinatesCard } from '../../src/components/profile/trip-detail/TripDetailCoordinatesCard'
import { EditJournalButton } from '../../src/components/profile/trip-detail/EditJournalButton'

export default function TripDetailScreen() {
  const router = useRouter()
  const { id: rawId } = useLocalSearchParams<{ id?: string | string[] }>()
  const { user, loading: authLoading } = useAuth()
  const [isMapActive, setIsMapActive] = useState(false)

  const tripId = useMemo(() => {
    if (Array.isArray(rawId)) {
      return rawId[0]?.trim() || ''
    }

    return typeof rawId === 'string' ? rawId.trim() : ''
  }, [rawId])

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/(auth)/login')
    }
  }, [authLoading, router, user])

  const {
    detail,
    loading: detailLoading,
    error,
    refreshing,
    refreshDetail,
  } = useTripDetail(!authLoading && user && tripId ? tripId : undefined)

  const loading = authLoading || detailLoading

  function handleBack() {
    if (router.canGoBack()) {
      router.back()
      return
    }

    router.replace('/(tabs)/profile')
  }

  function handleEditJournal() {
    if (!detail) return

    const trip = detail.trip
    const journalTripId = 'local_id' in trip ? trip.local_id : trip.id
    if (!journalTripId) return

    router.push({
      pathname: '/journal/[tripId]',
      params: { tripId: journalTripId },
    })
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      onStartShouldSetResponder={() => {
        if (isMapActive) setIsMapActive(false)
        return false
      }}
    >
      {authLoading || !user ? (
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>
            Validando sesión...
          </Text>
        </View>
      ) : (
        <ScrollView
          scrollEnabled={!isMapActive}
          contentContainerStyle={{
            flexGrow: 1,
            padding: 20,
            paddingBottom: 40,
          }}
        >
          <TripDetailTopBar title="Detalle de actividad" onBack={handleBack} />

          {loading ? (
            <Text style={{ color: colors.textSecondary }}>
              Cargando detalle...
            </Text>
          ) : error ? (
            <View
              style={{
                backgroundColor: colors.card,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 18,
              }}
            >
              <Text style={{ color: colors.danger, marginBottom: 12 }}>
                {error}
              </Text>

              <Pressable
                disabled={refreshing}
                onPress={refreshDetail}
                style={{
                  alignSelf: 'flex-start',
                  backgroundColor: colors.cardSecondary,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  opacity: refreshing ? 0.6 : 1,
                }}
              >
                <Text style={{ color: colors.textSecondary, fontWeight: '700' }}>
                  Reintentar
                </Text>
              </Pressable>
            </View>
          ) : !detail ? (
            <Text style={{ color: colors.textSecondary }}>
              No se encontró el recorrido.
            </Text>
          ) : (
            <>
              <TripDetailHero detail={detail} />

              <TripDetailStatsGrid detail={detail} />

              <TripDetailMapPreview
                detail={detail}
                setIsMapActive={setIsMapActive}
              />

              <TripDetailInfoCard detail={detail} />

              <TripDetailCoordinatesCard detail={detail} />

              <EditJournalButton detail={detail} onPress={handleEditJournal} />
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}
