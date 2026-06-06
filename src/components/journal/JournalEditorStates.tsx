import { Pressable, Text, View } from 'react-native'

import { colors } from '../../theme/colors'

export function JournalAuthLoadingState() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>
        Validando sesión...
      </Text>
    </View>
  )
}

export function JournalEditorLoadingState() {
  return <Text style={{ color: colors.textSecondary }}>Cargando editor...</Text>
}

interface JournalEditorErrorStateProps {
  error: string
  onRetry: () => void
}

export function JournalEditorErrorState({
  error,
  onRetry,
}: JournalEditorErrorStateProps) {
  return (
    <View>
      <Text style={{ color: colors.danger, marginBottom: 10 }}>{error}</Text>
      <Pressable
        onPress={onRetry}
        style={{
          alignSelf: 'flex-start',
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
  )
}

export function JournalTripMissingState() {
  return <Text style={{ color: colors.textSecondary }}>No se encontró el recorrido.</Text>
}