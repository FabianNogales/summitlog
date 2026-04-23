import { Text, View } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { colors } from '../../theme/colors'

export function AuthHeader() {
  return (
    <View
      style={{
        height: 210,
        backgroundColor: '#5E8B8C',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
      }}
    >
      <View
        style={{
          width: 84,
          height: 84,
          borderRadius: 42,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.25)',
          backgroundColor: 'rgba(255,255,255,0.10)',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        }}
      >
        <MaterialCommunityIcons
          name="image-filter-hdr"
          size={40}
          color={colors.text}
        />
      </View>

      <Text
        style={{
          color: colors.text,
          fontSize: 22,
          fontWeight: '700',
          marginBottom: 6,
        }}
      >
        SummitLog
      </Text>

      <Text
        style={{
          color: 'rgba(255,255,255,0.85)',
          fontSize: 14,
          textAlign: 'center',
        }}
      >
        Explora, registra y comparte tus rutas
      </Text>
    </View>
  )
}