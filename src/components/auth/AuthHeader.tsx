import { Text, View } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { colors } from '../../theme/colors'

export function AuthHeader() {
  return (
    <View
      style={{
        height: 210,
        backgroundColor: colors.bgElevated,
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
          borderColor: colors.borderTransparent,
          backgroundColor: colors.bgElevatedTransparent,
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
          color: colors.textSecondaryLight,
          fontSize: 14,
          textAlign: 'center',
        }}
      >
        Explora, registra y comparte tus rutas
      </Text>
    </View>
  )
}