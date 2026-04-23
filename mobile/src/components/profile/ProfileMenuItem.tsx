import { Pressable, Text, View } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { colors } from '../../theme/colors'

interface ProfileMenuItemProps {
  label: string
  iconName: keyof typeof Feather.glyphMap
  onPress: () => void
  danger?: boolean
}

export function ProfileMenuItem({
  label,
  iconName,
  onPress,
  danger = false,
}: ProfileMenuItemProps) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 16,
      }}
    >
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          backgroundColor: colors.cardSecondary,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 14,
        }}
      >
        <Feather
          name={iconName}
          size={16}
          color={danger ? '#FF4D4F' : colors.textSecondary}
        />
      </View>

      <Text
        style={{
          flex: 1,
          color: danger ? '#FF4D4F' : colors.text,
          fontSize: 15,
          fontWeight: '600',
        }}
      >
        {label}
      </Text>

      <Feather
        name="chevron-right"
        size={18}
        color={danger ? '#FF4D4F' : colors.textSecondary}
      />
    </Pressable>
  )
}