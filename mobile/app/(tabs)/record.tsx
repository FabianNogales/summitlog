import { Alert, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AuthButton } from '../../src/components/auth/AuthButton'
import { colors } from '../../src/theme/colors'
import { useOfflineTripRecorder } from '../../src/hooks/useOfflineTripRecorder'
import { useOfflineSync } from '../../src/hooks/useOfflineSync'

function getSyncStatusLabel(
  syncStatus: 'idle' | 'syncing' | 'synced' | 'empty' | 'error',
  pendingCount: number
) {
  if (syncStatus === 'syncing') return 'Sincronizando...'
  if (syncStatus === 'error') return 'Error al sincronizar'
  if (pendingCount === 0 && syncStatus === 'synced') return 'Todo sincronizado'
  if (pendingCount === 0) return 'No hay recorridos pendientes'
  return 'Sincronizar recorridos'
}

export default function RecordScreen() {
  const {
    activeLocalTripId,
    pointCount,
    totalDistanceM,
    lastLatitude,
    lastLongitude,
    backgroundPermissionGranted,
    backgroundTrackingActive,
    backgroundStatusMessage,
    isStarting,
    isTracking,
    isFinishing,
    startTracking,
    stopTracking,
  } = useOfflineTripRecorder()

  const {
    pendingCount,
    syncing,
    syncStatus,
    lastSyncError,
    syncNow,
  } = useOfflineSync()

  const syncStatusLabel = getSyncStatusLabel(syncStatus, pendingCount)
  const syncButtonTitle = syncing
    ? 'Sincronizando...'
    : pendingCount === 0
      ? syncStatus === 'error'
        ? 'Error al sincronizar'
        : syncStatus === 'synced'
          ? 'Todo sincronizado'
          : 'No hay recorridos pendientes'
      : 'Sincronizar recorridos'

  async function handleStartTrip() {
    try {
      await startTracking()

      Alert.alert(
        'Tracking offline iniciado',
        'El recorrido se esta guardando localmente en el dispositivo.'
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
        'El recorrido se guardo localmente y quedo pendiente de sincronizacion.'
      )
    } catch (error: any) {
      Alert.alert(
        'Error al finalizar recorrido',
        error.message ?? 'No se pudo finalizar el recorrido'
      )
    }
  }

  async function handleManualSync() {
    if (syncing) {
      return
    }

    if (pendingCount === 0) {
      Alert.alert(
        'Sincronizacion',
        'No hay recorridos pendientes por sincronizar.'
      )
      return
    }

    try {
      const result = await syncNow()
      const summary = [
        `Total pendientes: ${result.total}`,
        `Sincronizados: ${result.synced}`,
        `Ya sincronizados: ${result.alreadySynced}`,
        `Fallidos: ${result.failed}`,
      ].join('\n')

      Alert.alert(
        result.failed > 0 ? 'Sincronizacion con errores' : 'Sincronizacion completada',
        summary
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
          Inicia una actividad y SummitLog guardara el recorrido localmente,
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
            Sincronizacion offline
          </Text>

          <Text style={{ color: colors.textSecondary }}>
            Estado: {syncStatusLabel}
          </Text>

          <Text style={{ color: colors.textSecondary }}>
            Recorridos pendientes: {pendingCount}
          </Text>

          {syncStatus === 'error' && lastSyncError ? (
            <Text style={{ color: colors.danger }}>{lastSyncError}</Text>
          ) : null}
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
              Ultima ubicacion:{' '}
              {lastLatitude && lastLongitude
                ? `${lastLatitude.toFixed(5)}, ${lastLongitude.toFixed(5)}`
                : 'Aun no disponible'}
            </Text>

            <Text style={{ color: colors.textSecondary }}>
              Tracking en segundo plano:{' '}
              {backgroundTrackingActive ? 'Activo' : 'No activo'}
            </Text>

            <Text style={{ color: colors.textSecondary }}>
              Permiso background:{' '}
              {backgroundPermissionGranted ? 'Concedido' : 'No concedido'}
            </Text>

            {backgroundStatusMessage ? (
              <Text style={{ color: colors.textSecondary }}>
                {backgroundStatusMessage}
              </Text>
            ) : null}
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
              title={syncButtonTitle}
              onPress={handleManualSync}
              loading={syncing}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  )
}
