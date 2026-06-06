import { Text, View } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { colors } from '../../theme/colors'

export function HistoryEmptyState() {
  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 24,
        alignItems: 'center',
      }}
    >
      <View
        style={{
          width: 54,
          height: 54,
          borderRadius: 27,
          backgroundColor: colors.cardSecondary,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 14,
        }}
      >
        <Feather name="map-pin" size={24} color={colors.textSecondary} />
      </View>

      <Text
        style={{
          color: colors.text,
          fontSize: 16,
          fontWeight: '700',
          marginBottom: 8,
        }}
      >
        Aún no tienes actividades registradas
      </Text>

      <Text
        style={{
          color: colors.textSecondary,
          fontSize: 14,
          textAlign: 'center',
          lineHeight: 20,
        }}
      >
        Inicia un recorrido para comenzar a construir tu historial de actividades.
      </Text>
    </View>
  )
}