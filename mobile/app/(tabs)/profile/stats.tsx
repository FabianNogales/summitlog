import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useState } from 'react'
import { colors } from '../../../src/theme/colors'
import { useUserStats } from '../../../src/hooks/useUserStats'
import { ProfileStat } from '../../../src/components/profile/ProfileStat'

function formatKilometers(value: number | null) {
  if (value == null || !Number.isFinite(value)) {
    return 'No disponible'
  }

  return `${value.toFixed(2)} km`
}

function formatHours(seconds: number | null) {
  if (seconds == null || !Number.isFinite(seconds) || seconds <= 0) {
    return 'No disponible'
  }

  return `${(seconds / 3600).toFixed(1)} h`
}

function formatMinutes(value: number | null) {
  if (value == null || !Number.isFinite(value)) {
    return 'No disponible'
  }

  return `${value.toFixed(1)} min`
}

function formatDate(value: string | null) {
  if (!value) {
    return 'No disponible'
  }

  return new Date(value).toLocaleDateString()
}

export default function ProfileStatsScreen() {
  const router = useRouter()
  const { stats, pendingSyncCount, loading, error, refreshStats } = useUserStats()
  const [refreshing, setRefreshing] = useState(false)

  function handleBackToProfile() {
    router.replace('/(tabs)/profile')
  }

  async function handleRefresh() {
    try {
      setRefreshing(true)
      await refreshStats()
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 20,
          }}
        >
          <Pressable
            onPress={handleBackToProfile}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: colors.card,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}
          >
            <Feather name="chevron-left" size={20} color={colors.text} />
          </Pressable>

          <View>
            <Text
              style={{
                color: colors.text,
                fontSize: 24,
                fontWeight: '700',
                marginBottom: 4,
              }}
            >
              Estadísticas
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
              Datos de tu actividad personal
            </Text>
          </View>

          <Pressable
            onPress={handleRefresh}
            style={{
              marginLeft: 'auto',
              borderRadius: 10,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.cardSecondary,
              paddingHorizontal: 12,
              paddingVertical: 8,
            }}
          >
            <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>
              Actualizar
            </Text>
          </Pressable>
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
          {pendingSyncCount > 0 ? (
            <View
              style={{
                marginBottom: 14,
                backgroundColor: colors.cardSecondary,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 10,
              }}
            >
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                {`Tienes ${pendingSyncCount} recorrido(s) pendiente(s) de sincronizacion. Estas estadisticas pueden cambiar despues de sincronizar.`}
              </Text>
            </View>
          ) : null}

          {loading ? (
            <View
              style={{
                height: 180,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={{ color: colors.textSecondary, marginTop: 12 }}>
                Cargando estadísticas...
              </Text>
            </View>
          ) : error ? (
            <View
              style={{
                minHeight: 180,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700' }}>
                Error
              </Text>
              <Text style={{ color: colors.textSecondary, marginTop: 8, textAlign: 'center' }}>
                {error}
              </Text>
              <Pressable
                onPress={handleRefresh}
                style={{
                  marginTop: 12,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.cardSecondary,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                }}
              >
                <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>
                  Reintentar
                </Text>
              </Pressable>
            </View>
          ) : stats.totalTrips === 0 ? (
            <View
              style={{
                minHeight: 180,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700' }}>
                Aún no tienes estadísticas disponibles.
              </Text>
              <Text style={{ color: colors.textSecondary, marginTop: 8, textAlign: 'center' }}>
                Registra primero algún viaje para ver tu actividad.
              </Text>
            </View>
          ) : (
            <>
              <Text
                style={{
                  color: colors.text,
                  fontSize: 16,
                  fontWeight: '700',
                  marginBottom: 16,
                }}
              >
                Resumen global
              </Text>

              <View style={{ flexDirection: 'row', marginBottom: 16 }}>
                <ProfileStat value={stats.totalTrips} label="Viajes registrados" />
                <ProfileStat value={stats.completedTrips} label="Finalizados" />
              </View>

              <View style={{ flexDirection: 'row', marginBottom: 16 }}>
                <ProfileStat value={formatKilometers(stats.totalDistanceKm)} label="Distancia total" />
                <ProfileStat value={formatHours(stats.totalDurationS)} label="Tiempo total" />
              </View>

              <View style={{ flexDirection: 'row', marginBottom: 16 }}>
                <ProfileStat value={
                    stats.averageDistanceKm != null && Number.isFinite(stats.averageDistanceKm)
                      ? `${stats.averageDistanceKm.toFixed(2)} km`
                      : 'No disponible'
                  } label="Promedio distancia" />
                <ProfileStat value={formatMinutes(stats.averageDurationMinutes)} label="Promedio tiempo" />
              </View>

              <View style={{ flexDirection: 'row' }}>
                <ProfileStat value={formatDate(stats.lastActivityAt)} label="Última actividad" />
                <ProfileStat
                  value={
                    stats.totalGpsPoints != null
                      ? stats.totalGpsPoints
                      : 'No disponible'
                  }
                  label="Puntos GPS"
                />
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
