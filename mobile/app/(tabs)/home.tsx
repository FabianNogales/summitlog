import { SafeAreaView, Text, View } from 'react-native'
import { useAuth } from '../../src/hooks/useAuth'
import { colors } from '../../src/theme/colors'

export default function HomeScreen() {
  const { profile } = useAuth()

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
        <Text
          style={{
            color: colors.text,
            fontSize: 28,
            fontWeight: '700',
            marginBottom: 12,
          }}
        >
          Bienvenido a SummitLog
        </Text>

        <Text
          style={{
            color: colors.textSecondary,
            fontSize: 16,
          }}
        >
          {profile?.username
            ? `Sesión iniciada como @${profile.username}`
            : 'Sesión iniciada correctamente'}
        </Text>
      </View>
    </SafeAreaView>
  )
}