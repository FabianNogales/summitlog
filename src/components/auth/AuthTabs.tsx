import { Pressable, Text, View } from 'react-native'
import { colors } from '../../theme/colors'

type AuthTabValue = 'login' | 'register'

interface AuthTabsProps {
  activeTab: AuthTabValue
  onPressLogin: () => void
  onPressRegister: () => void
}

export function AuthTabs({
  activeTab,
  onPressLogin,
  onPressRegister,
}: AuthTabsProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: colors.cardSecondary,
        borderRadius: 14,
        padding: 6,
        marginBottom: 24,
      }}
    >
      <Pressable
        onPress={onPressLogin}
        style={{
          flex: 1,
          backgroundColor:
            activeTab === 'login' ? colors.card : 'transparent',
          borderRadius: 10,
          paddingVertical: 12,
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            color:
              activeTab === 'login' ? colors.text : colors.textSecondary,
            fontWeight: '600',
          }}
        >
          Iniciar Sesión
        </Text>
      </Pressable>

      <Pressable
        onPress={onPressRegister}
        style={{
          flex: 1,
          backgroundColor:
            activeTab === 'register' ? colors.card : 'transparent',
          borderRadius: 10,
          paddingVertical: 12,
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            color:
              activeTab === 'register' ? colors.text : colors.textSecondary,
            fontWeight: '600',
          }}
        >
          Crear Cuenta
        </Text>
      </Pressable>
    </View>
  )
}