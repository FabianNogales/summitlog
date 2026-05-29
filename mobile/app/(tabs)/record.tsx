import React from 'react'
import { Alert, View } from 'react-native'
import { useRouter } from 'expo-router'
import { colors } from '../../src/theme/colors'
import { useOfflineTripRecorder } from '../../src/hooks/useOfflineTripRecorder'
import { useOfflineSync } from '../../src/hooks/useOfflineSync'

import { TrackingMap } from '../../src/components/map/TrackingMap'
import { RecordBottomPanel } from '../../src/components/map/RecordBottomPanel'

export default function RecordScreen() {
  const router = useRouter()

  const {
    totalDistanceM,
    totalElevationGainM,
    totalCalories,
    isStarting,
    isTracking,
    isFinishing,
    startTracking,
    stopTracking,
    pathPoints,
  } = useOfflineTripRecorder()

  const {
    pendingCount,
    syncing,
    syncStatus,
    lastSyncError,
    lastSyncResult,
    syncNow,
  } = useOfflineSync()

  const syncButtonTitle = syncing
    ? 'Sincronizando...'
    : pendingCount > 0
      ? `Sincronizar (${pendingCount}) pendientes`
      : 'No hay recorridos pendientes'

  const syncHelperText = syncing
    ? 'Sincronizando recorridos pendientes...'
    : syncStatus === 'error'
      ? lastSyncError ?? 'Hubo un problema al sincronizar.'
      : pendingCount > 0
        ? `Tienes ${pendingCount} elemento(s) pendiente(s).`
        : lastSyncResult
          ? 'Todo sincronizado.'
          : 'Sin pendientes por sincronizar.'

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
      const tripLocalId = await stopTracking()

      if (!tripLocalId) {
        Alert.alert(
          'Recorrido finalizado',
          'El recorrido se guardó, pero no se pudo abrir el editor de bitácora.'
        )
        return
      }

      router.replace(`/journal/${tripLocalId}`)
    } catch (error: any) {
      Alert.alert(
        'Error al finalizar recorrido',
        error.message ?? 'No se pudo finalizar el recorrido'
      )
    }
  }

  async function handleManualSync() {
    if (syncing || pendingCount === 0) return

    try {
      const result = await syncNow()

      const summary = [
        `Sincronizados: ${result.synced}`,
        `Ya sincronizados: ${result.alreadySynced}`,
        `Fallidos: ${result.failed}`,
      ].join('\n')

      Alert.alert(
        result.failed > 0 ? 'Sincronización parcial' : 'Sincronización completada',
        summary
      )
    } catch (error: any) {
      Alert.alert('Error al sincronizar', error.message ?? 'Error desconocido')
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <TrackingMap
        coordinates={pathPoints}
        isTracking={isTracking}
      />

      <RecordBottomPanel
        isTracking={isTracking}
        isStarting={isStarting}
        isFinishing={isFinishing}
        distanceM={totalDistanceM}
        elevationGainM={totalElevationGainM}
        calories={totalCalories}
        onStart={handleStartTrip}
        onStop={handleStopTrip}
        pendingCount={pendingCount}
        syncing={syncing}
        onSync={handleManualSync}
        syncButtonTitle={syncButtonTitle}
        syncHelperText={syncHelperText}
      />
    </View>
  )
}