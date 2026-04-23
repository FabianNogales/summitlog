import { Pressable, Text, View } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { colors } from '../../theme/colors'

interface ProfileHeaderProps {
  title?: string
  onPressSettings?: () => void
}

export function ProfileHeader({
  title = 'Mi Perfil',
  onPressSettings,
}: ProfileHeaderProps) {
  return (
    <View
      style={{
        backgroundColor: '#2B6E73',
        paddingTop: 56,
        paddingHorizontal: 20,
        paddingBottom: 72,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Text
          style={{
            color: colors.text,
            fontSize: 18,
            fontWeight: '700',
          }}
        >
          {title}
        </Text>

        <Pressable onPress={onPressSettings}>
          <Feather name="settings" size={22} color={colors.text} />
        </Pressable>
      </View>
    </View>
  )
}