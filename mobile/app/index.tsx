import { ActivityIndicator, SafeAreaView, View } from 'react-native'
import { Redirect } from 'expo-router'
import { useAuth } from '../src/hooks/useAuth'
import { colors } from '../src/theme/colors'

export default function IndexScreen() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    )
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />
  }

  return <Redirect href="/(tabs)/home" />
}