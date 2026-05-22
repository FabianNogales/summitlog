import { useRef, useState } from 'react'
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from 'react-native'
import { Redirect, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

import { AuthButton } from '../../src/components/auth/AuthButton'
import { AuthHeader } from '../../src/components/auth/AuthHeader'
import { AuthInput } from '../../src/components/auth/AuthInput'
import { AuthTabs } from '../../src/components/auth/AuthTabs'
import { useAuth } from '../../src/hooks/useAuth'
import { colors } from '../../src/theme/colors'
import {
  FORM_SCROLL_BOTTOM_PADDING,
  scrollToFocusedInput,
} from '../../src/utils/keyboard'

export default function RegisterScreen() {
  const router = useRouter()
  const { signUp, user } = useAuth()
  const scrollRef = useRef<ScrollView | null>(null)

  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (user) {
    return <Redirect href="/(tabs)/home" />
  }

  async function handleRegister() {
    if (!username.trim() || !email.trim() || !password.trim()) {
      Alert.alert(
        'Campos incompletos',
        'Username, correo y contraseña son obligatorios.'
      )
      return
    }

    if (password.length < 6) {
      Alert.alert(
        'Contraseña inválida',
        'La contraseña debe tener al menos 6 caracteres.'
      )
      return
    }

    if (password !== confirmPassword) {
      Alert.alert(
        'Contraseñas distintas',
        'La confirmación no coincide con la contraseña.'
      )
      return
    }

    try {
      setIsSubmitting(true)

      await signUp({
        email: email.trim(),
        password,
        username: username.trim(),
        fullName: fullName.trim(),
      })
    } catch (error: any) {
      Alert.alert(
        'Error al crear cuenta',
        error.message ?? 'No se pudo registrar el usuario'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{
            flexGrow: 1,
            padding: 20,
            paddingBottom: FORM_SCROLL_BOTTOM_PADDING,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 28,
              overflow: 'hidden',
            }}
          >
            <AuthHeader />

            <View style={{ padding: 20 }}>
              <AuthTabs
                activeTab="register"
                onPressLogin={() => router.replace('/(auth)/login')}
                onPressRegister={() => {}}
              />

              <AuthInput
                label="Nombre de usuario"
                placeholder="fabian_nogales"
                value={username}
                onChangeText={setUsername}
                iconName="user"
                onFocus={(event) => scrollToFocusedInput(scrollRef, event)}
              />

              <AuthInput
                label="Nombre completo"
                placeholder="Fabian Nogales"
                value={fullName}
                onChangeText={setFullName}
                iconName="edit-3"
                autoCapitalize="words"
                onFocus={(event) => scrollToFocusedInput(scrollRef, event)}
              />

              <AuthInput
                label="Correo electrónico"
                placeholder="tu@email.com"
                value={email}
                onChangeText={setEmail}
                iconName="mail"
                keyboardType="email-address"
                onFocus={(event) => scrollToFocusedInput(scrollRef, event)}
              />

              <AuthInput
                label="Contraseña"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                iconName="lock"
                secureTextEntry
                onFocus={(event) => scrollToFocusedInput(scrollRef, event)}
              />

              <AuthInput
                label="Confirmar contraseña"
                placeholder="••••••••"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                iconName="lock"
                secureTextEntry
                onFocus={(event) => scrollToFocusedInput(scrollRef, event)}
              />

              <AuthButton
                title="Crear Cuenta"
                onPress={handleRegister}
                loading={isSubmitting}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
