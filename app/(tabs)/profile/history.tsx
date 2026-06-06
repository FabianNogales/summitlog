import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native'
import { Feather } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

import { HistoryEmptyState } from '../../../src/components/profile/HistoryEmptyState'
import { TripHistoryItem } from '../../../src/components/profile/TripHistoryItem'
import { useTripHistory } from '../../../src/hooks/useTripHistory'
import { colors } from '../../../src/theme/colors'

export default function ProfileHistoryScreen() {
  const router = useRouter()
  const { trips, loading, refreshing, error, pendingSyncCount, refreshHistory } =
    useTripHistory({ includeStats: false })

  function handleBackToProfile() {
    router.replace('/(tabs)/profile')
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshHistory}
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

          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: colors.text,
                fontSize: 24,
                fontWeight: '700',
                marginBottom: 4,
              }}
            >
              Historial completo
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
              Todos tus recorridos completados
            </Text>
          </View>

          <Pressable
            onPress={refreshHistory}
            style={{
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

        {pendingSyncCount > 0 ? (
          <View
            style={{
              marginBottom: 14,
              backgroundColor: colors.cardSecondary,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              padding: 10,
            }}
          >
            <Text style={{ color: colors.textSecondary }}>
              Tienes {pendingSyncCount} recorrido(s) pendiente(s) de sincronizar. Este
              historial muestra recorridos ya sincronizados.
            </Text>
          </View>
        ) : null}

        {loading ? (
          <View
            style={{
              minHeight: 220,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ color: colors.textSecondary, marginTop: 12 }}>
              Cargando historial...
            </Text>
          </View>
        ) : error ? (
          <View
            style={{
              minHeight: 220,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700' }}>
              Error
            </Text>
            <Text
              style={{
                color: colors.textSecondary,
                marginTop: 8,
                marginBottom: 12,
                textAlign: 'center',
              }}
            >
              {error}
            </Text>
            <Pressable
              onPress={refreshHistory}
              style={{
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
        ) : trips.length === 0 ? (
          <HistoryEmptyState />
        ) : (
          <View>
            {trips.map((trip) => (
              <TripHistoryItem
                key={trip.id}
                trip={trip}
                onPress={() =>
                  router.push({
                    pathname: '/trip/[id]',
                    params: { id: trip.id },
                  })
                }
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
