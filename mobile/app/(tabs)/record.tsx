import { Alert, SafeAreaView, Text, View } from 'react-native'
import { AuthButton } from '../../src/components/auth/AuthButton'
import { colors } from '../../src/theme/colors'
import { useOfflineTripRecorder } from '../../src/hooks/useOfflineTripRecorder'
import { useOfflineSync } from '../../src/hooks/useOfflineSync'

export default function RecordScreen() {
  const {
    activeLocalTripId,
    pointCount,
    totalDistanceM,
    lastLatitude,
    lastLongitude,
    isStarting,
    isTracking,
    isFinishing,
    startTracking,
    stopTracking,
  } = useOfflineTripRecorder()

  const {
    pendingCount,
    syncing,
    syncNow,
  } = useOfflineSync()

  async function handleStartTrip() {
    try {
      await startTracking()

      Alert.alert(
        'Tracking offline iniciado',
        'El recorrido se está guardando localmente en el dispositivo.'
      )
    } catch (error: any) {
      Alert.alert(
        'Error al iniciar recorrido',
        error.message ?? 'No se pudo iniciar el recorrido'
      )
    }
  }

  async function handleStopTrip() {
    try {
      await stopTracking()

      Alert.alert(
        'Recorrido guardado',
        'El recorrido se guardó localmente y quedó pendiente de sincronización.'
      )
    } catch (error: any) {
      Alert.alert(
        'Error al finalizar recorrido',
        error.message ?? 'No se pudo finalizar el recorrido'
      )
    }
  }

  async function handleManualSync() {
    try {
      const result = await syncNow()

      Alert.alert(
        'Sincronización completada',
        `Total pendientes: ${result.total}\nSincronizados: ${result.synced}\nFallidos: ${result.failed}`
      )
    } catch (error: any) {
      Alert.alert(
        'Error al sincronizar',
        error.message ?? 'No se pudieron sincronizar los recorridos'
      )
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
        <Text
          style={{
            color: colors.text,
            fontSize: 28,
            fontWeight: '700',
            marginBottom: 12,
          }}
        >
          Registrar recorrido
        </Text>

        <Text
          style={{
            color: colors.textSecondary,
            fontSize: 15,
            marginBottom: 24,
            lineHeight: 22,
          }}
        >
          Inicia una actividad y SummitLog guardará el recorrido localmente,
          incluso si no tienes internet.
        </Text>

        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 16,
            marginBottom: 20,
            gap: 8,
          }}
        >
          <Text style={{ color: colors.text, fontWeight: '700' }}>
            Sincronización offline
          </Text>

          <Text style={{ color: colors.textSecondary }}>
            Recorridos pendientes: {pendingCount}
          </Text>
        </View>

        {activeLocalTripId ? (
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 16,
              marginBottom: 20,
              gap: 8,
            }}
          >
            <Text style={{ color: colors.text, fontWeight: '700' }}>
              Tracking offline activo
            </Text>

            <Text style={{ color: colors.textSecondary }}>
              Local Trip ID: {activeLocalTripId}
            </Text>

            <Text style={{ color: colors.textSecondary }}>
              Puntos guardados: {pointCount}
            </Text>

            <Text style={{ color: colors.textSecondary }}>
              Distancia acumulada: {(totalDistanceM / 1000).toFixed(2)} km
            </Text>

            <Text style={{ color: colors.textSecondary }}>
              Última ubicación:{' '}
              {lastLatitude && lastLongitude
                ? `${lastLatitude.toFixed(5)}, ${lastLongitude.toFixed(5)}`
                : 'Aún no disponible'}
            </Text>
          </View>
        ) : null}

        {isTracking ? (
          <View style={{ gap: 12 }}>
            <AuthButton
              title="Terminar recorrido"
              onPress={handleStopTrip}
              loading={isFinishing}
            />
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            <AuthButton
              title="Iniciar recorrido"
              onPress={handleStartTrip}
              loading={isStarting}
            />

            <AuthButton
              title="Sincronizar ahora"
              onPress={handleManualSync}
              loading={syncing}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  )
}