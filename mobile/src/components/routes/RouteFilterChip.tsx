import { Pressable, Text } from 'react-native'
import { colors } from '../../theme/colors'

interface RouteFilterChipProps {
  label: string
  active: boolean
  onPress: () => void
}

export function RouteFilterChip({
  label,
  active,
  onPress,
}: RouteFilterChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: active ? colors.primary : colors.cardSecondary,
        borderWidth: 1,
        borderColor: active ? colors.primary : colors.border,
        marginRight: 8,
      }}
    >
      <Text
        style={{
          color: active ? colors.text : colors.textSecondary,
          fontSize: 13,
          fontWeight: '600',
        }}
      >
        {label}
      </Text>
    </Pressable>
  )
}