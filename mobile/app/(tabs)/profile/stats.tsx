import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, Text, View } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { colors } from '../../../src/theme/colors'
import { useUserStats } from '../../../src/hooks/useUserStats'
import { ProfileStat } from '../../../src/components/profile/ProfileStat'

function formatKilometers(value: number | null) {
  return value != null ? `${value.toFixed(2)} km` : 'No disponible'
}

function formatHours(seconds: number | null) {
  if (seconds == null || seconds === 0) {
    return 'No disponible'
  }

  return `${(seconds / 3600).toFixed(1)} h`
}

function formatMinutes(value: number | null) {
  return value != null ? `${value.toFixed(1)} min` : 'No disponible'
}

function formatDate(value: string | null) {
  if (!value) {
    return 'No disponible'
  }

  return new Date(value).toLocaleDateString()
}

export default function ProfileStatsScreen() {
  const router = useRouter()
  const { stats, loading, error } = useUserStats()

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 20,
          }}
        >
          <Pressable
            onPress={() => router.back()}
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
                    stats.averageDistanceKm != null
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
