import { useMemo, useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

import { colors } from '../../src/theme/colors'
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
<<<<<<< Updated upstream
  const { id: rawId } = useLocalSearchParams<{ id?: string | string[] }>()
  const [isMapActive, setIsMapActive] = useState(false)

  const tripId = useMemo(() => {
    if (Array.isArray(rawId)) {
      return rawId[0]?.trim() || ''
=======
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user, loading: authLoading } = useAuth()

  const [trip, setTrip] = useState<RecordedTrip | null>(null)
  const [loading, setLoading] = useState(true)

  const loadTrip = useCallback(async () => {
    if (authLoading || !user || !id) {
      setLoading(false)
      return
>>>>>>> Stashed changes
    }

    return typeof rawId === 'string' ? rawId.trim() : ''
  }, [rawId])

<<<<<<< Updated upstream
  const {
    detail,
    loading,
    error,
    refreshing,
    refreshDetail,
  } = useTripDetail(tripId || undefined)
=======
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
  }, [authLoading, id, user])

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/(auth)/login')
      return
    }

    loadTrip()
  }, [authLoading, loadTrip, router, user])
>>>>>>> Stashed changes

  function handleEditJournal() {
    if (!detail) return

    const trip = detail.trip
    const journalTripId = 'local_id' in trip ? trip.local_id : trip.id
    if (!journalTripId) return;

    router.push({
      pathname: '/journal/[tripId]',
      params: { tripId: journalTripId },
    })
  }

  return (
<<<<<<< Updated upstream
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      onStartShouldSetResponder={() => {
        if (isMapActive) setIsMapActive(false)
        return false
      }}
    >
=======
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {authLoading || !user ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>
            Validando sesion...
          </Text>
        </View>
      ) : (
>>>>>>> Stashed changes
      <ScrollView
        scrollEnabled={!isMapActive}
        contentContainerStyle={{
          flexGrow: 1,
          padding: 20,
          paddingBottom: 40,
        }}
      >
        <TripDetailTopBar title="Detalle de actividad" onBack={() => router.back()} />

        {loading ? (
          <Text style={{ color: colors.textSecondary }}>Cargando detalle...</Text>
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
            <Text style={{ color: colors.danger, marginBottom: 12 }}>{error}</Text>

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

            <TripDetailMapPreview detail={detail} setIsMapActive={setIsMapActive} />

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
