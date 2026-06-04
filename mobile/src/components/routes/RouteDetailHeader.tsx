import { Pressable, Text, View } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { colors } from '../../theme/colors'

interface RouteDetailHeaderProps {
  onBack: () => void
}

function RouteDetailHeader({ onBack }: RouteDetailHeaderProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
      }}
    >
      <Pressable
        onPress={onBack}
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: colors.card,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}
      >
        <Feather name="arrow-left" size={18} color={colors.text} />
      </Pressable>

      <Text
        style={{
          color: colors.text,
          fontSize: 20,
          fontWeight: '700',
        }}
      >
        Detalle de ruta
      </Text>
    </View>
  )
}
export default RouteDetailHeader