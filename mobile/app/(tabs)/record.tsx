import { Alert, SafeAreaView, Text, View } from 'react-native'
import { AuthButton } from '../../src/components/auth/AuthButton'
import { colors } from '../../src/theme/colors'
import { useTripRecorder } from '../../src/hooks/useTripRecorder'

export default function RecordScreen() {
  const {
    activeTripId,
    pointCount,
    totalDistanceM,
    lastLatitude,
    lastLongitude,
    isStarting,
    isTracking,
    isFinishing,
    startTracking,
    stopTracking,
  } = useTripRecorder()

  async function handleStartTrip() {
    try {
      await startTracking()

      Alert.alert(
        'Tracking iniciado',
        'El recorrido está activo y ya comenzó a guardar puntos GPS.'
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
        'Recorrido finalizado',
        'El recorrido se guardó correctamente como completado.'
      )
    } catch (error: any) {
      Alert.alert(
        'Error al finalizar recorrido',
        error.message ?? 'No se pudo finalizar el recorrido'
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
          Inicia una actividad y SummitLog irá guardando puntos GPS mientras el
          tracking esté activo.
        </Text>

        {activeTripId ? (
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
              Tracking activo
            </Text>

            <Text style={{ color: colors.textSecondary }}>
              Trip ID: {activeTripId}
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
          <AuthButton
            title="Terminar recorrido"
            onPress={handleStopTrip}
            loading={isFinishing}
          />
        ) : (
          <AuthButton
            title="Iniciar recorrido"
            onPress={handleStartTrip}
            loading={isStarting}
          />
        )}
      </View>
    </SafeAreaView>
  )
}