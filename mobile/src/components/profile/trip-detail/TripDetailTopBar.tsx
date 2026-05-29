import { Pressable, Text, View } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { colors } from '../../../theme/colors'

interface TripDetailTopBarProps {
  title: string
  onBack: () => void
}

export function TripDetailTopBar({ title, onBack }: TripDetailTopBarProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
      }}
    >
      <Pressable
        onPress={onBack}
        style={{
          width: 38,
          height: 38,
          borderRadius: 19,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
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
          fontWeight: '800',
          flex: 1,
        }}
        numberOfLines={1}
      >
        {title}
      </Text>
    </View>
  )
}