import { useEffect, useRef, useState } from 'react'
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native'
import { FontAwesome } from '@expo/vector-icons'
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router'
import { ArrowRight, Mountain } from 'lucide-react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { AuthButton } from '../../src/components/auth/AuthButton'
import { AuthInput } from '../../src/components/auth/AuthInput'
import { useAuth } from '../../src/hooks/useAuth'
import { colors } from '../../src/theme/colors'
import {
  FORM_SCROLL_BOTTOM_PADDING,
  scrollToFocusedInput,
} from '../../src/utils/keyboard'

export default function LoginScreen() {
  const router = useRouter()
  const { signIn, signInWithGoogle, user } = useAuth()
  const { authError } = useLocalSearchParams<{ authError?: string }>()
  const authErrorShownRef = useRef<string | null>(null)
  const scrollRef = useRef<ScrollView | null>(null)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false)

  useEffect(() => {
    const errorMessage =
      typeof authError === 'string' ? authError.trim() : undefined

    if (!errorMessage || authErrorShownRef.current === errorMessage) {
      return
    }

    authErrorShownRef.current = errorMessage
    Alert.alert('Error con Google', errorMessage)
  }, [authError])

  if (user) {
    return <Redirect href="/(tabs)/home" />
  }

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Campos incompletos', 'Ingresa tu correo y tu contraseña.')
      return
    }

    try {
      setIsSubmitting(true)
      await signIn(email.trim(), password)
    } catch (error: any) {
      Alert.alert(
        'Error al iniciar sesión',
        error.message ?? 'No se pudo iniciar sesión'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleGoogleLogin() {
    try {
      setIsGoogleSubmitting(true)
      console.log('[Login] Google sign-in started')
      const session = await signInWithGoogle()
      console.log('[Login] Google sign-in finished, hasSession:', Boolean(session))

      if (session) {
        router.replace('/(tabs)/home')
      }
    } catch (error: any) {
      if (error?.code === 'oauth_cancelled') {
        console.log('[Login] Google sign-in cancelled by user')
        return
      }

      console.log('[Login] Google sign-in error:', error?.message ?? 'unknown')
      Alert.alert(
        'Error con Google',
        error?.message ?? 'No se pudo iniciar sesión con Google'
      )
    } finally {
      setIsGoogleSubmitting(false)
      console.log('[Login] google loading false')
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
            paddingHorizontal: 24,
            paddingTop: 20,
            paddingBottom: FORM_SCROLL_BOTTOM_PADDING,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ marginBottom: 20 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                marginBottom: 16,
              }}
            >
              <Mountain size={20} color={colors.primary} />
              <Text
                style={{
                  color: colors.text,
                  fontSize: 28,
                  fontWeight: '800',
                  letterSpacing: -0.1,
                }}
              >
                Summit<Text style={{ color: colors.primary }}>Log</Text>
              </Text>
            </View>

            <Text
              style={{
                color: colors.text,
                fontSize: 30,
                fontWeight: '800',
                lineHeight: 34,
                marginBottom: 8,
              }}
            >
              Bienvenido de vuelta
            </Text>
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 16,
                lineHeight: 22,
              }}
            >
              Inicia sesión para continuar tu aventura
            </Text>
          </View>

          <AuthInput
            label="Correo electrónico"
            placeholder="Correo electrónico"
            value={email}
            onChangeText={setEmail}
            iconName="mail"
            keyboardType="email-address"
            hideLabel
            onFocus={(event) => scrollToFocusedInput(scrollRef, event)}
          />

          <AuthInput
            label="Contraseña"
            placeholder="Contraseña"
            value={password}
            onChangeText={setPassword}
            iconName="lock"
            secureTextEntry
            hideLabel
            onFocus={(event) => scrollToFocusedInput(scrollRef, event)}
          />

          <Pressable
            onPress={() =>
              Alert.alert(
                'Próximamente',
                'La recuperación de contraseña la implementaremos después.'
              )
            }
            style={{ marginBottom: 24, marginTop: -4 }}
          >
            <Text
              style={{
                color: colors.primary,
                textAlign: 'right',
                fontSize: 14,
                fontWeight: '600',
              }}
            >
              ¿Olvidaste tu contraseña?
            </Text>
          </Pressable>

          <AuthButton
            title="Iniciar sesión"
            onPress={handleLogin}
            loading={isSubmitting}
            rightIcon={<ArrowRight size={18} color={colors.text} />}
          />

          <View
            style={{
              marginTop: 22,
              marginBottom: 16,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <View style={{ height: 1, backgroundColor: colors.border, flex: 1 }} />
            <Text
              style={{
                color: colors.textMuted,
                fontSize: 14,
              }}
            >
              o continúa con
            </Text>
            <View style={{ height: 1, backgroundColor: colors.border, flex: 1 }} />
          </View>

          <AuthButton
            title="Continuar con Google"
            onPress={handleGoogleLogin}
            loading={isGoogleSubmitting}
            variant="secondary"
            leftIcon={<FontAwesome name="google" size={22} color={colors.text} />}
          />

          <Pressable
            onPress={() => router.replace('/(auth)/register')}
            style={{ marginTop: 22, paddingBottom: 10 }}
          >
            <Text
              style={{
                textAlign: 'center',
                color: colors.textSecondary,
                fontSize: 16,
              }}
            >
              ¿Sin cuenta?{' '}
              <Text style={{ color: colors.primary, fontWeight: '700' }}>
                Regístrate
              </Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
