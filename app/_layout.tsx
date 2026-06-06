import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider } from '../src/context/AuthContext'
import { initOfflineDb } from '../src/services/offlineDb.service'
import '../src/tasks/backgroundLocationTask'

export default function RootLayout() {
  useEffect(() => {
    initOfflineDb().catch((error) => {
      console.error('Error inicializando base offline:', error)
    })
  }, [])

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)/login" />
          <Stack.Screen name="(auth)/register" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="auth/callback" />
          <Stack.Screen name="profile/edit" />
          <Stack.Screen name="trip/[id]" />
          <Stack.Screen name="route/[id]" />
          <Stack.Screen name="journal/[tripId]" />
          <Stack.Screen name="moderation/index" />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  )
}
