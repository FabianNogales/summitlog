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
  const [emailError, setEmailError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  function isValidEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  }

  useEffect(() => {
    const errorMessage =
      typeof authError === 'string' ? authError.trim() : undefined

    if (!errorMessage || authErrorShownRef.current === errorMessage) {
      return
    }

    authErrorShownRef.current = errorMessage
    setFormError(errorMessage)
  }, [authError])

  if (user) {
    return <Redirect href="/(tabs)/home" />
  }

  async function handleLogin() {
    setFormError(null)
    setEmailError(null)

    const normalizedEmail = email.trim()

    if (!normalizedEmail || !password.trim()) {
      setFormError('Ingresa tu correo y tu contrasena.')
      return
    }

    if (!isValidEmail(normalizedEmail)) {
      setEmailError('Ingresa un correo electronico valido.')
      return
    }

    try {
      setIsSubmitting(true)
      await signIn(normalizedEmail, password)
    } catch (error: any) {
      setFormError(error.message ?? 'No se pudo iniciar sesion')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleGoogleLogin() {
    setFormError(null)
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
        error?.message ?? 'No se pudo iniciar sesion con Google'
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
            flexGrow: 1,
            paddingHorizontal: 24,
            paddingTop: 20,
            paddingBottom: FORM_SCROLL_BOTTOM_PADDING,
            justifyContent: 'center',
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ width: '100%', maxWidth: 420, justifyContent: 'center' }}>
            <View style={{ marginBottom: 22 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 14,
                }}
              >
                <Mountain size={20} color={colors.primary} />
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 26,
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
                  fontSize: 28,
                  fontWeight: '800',
                  lineHeight: 32,
                  marginBottom: 8,
                }}
              >
                Bienvenido de vuelta
              </Text>
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: 15,
                  lineHeight: 20,
                }}
              >
                Inicia sesion para continuar tu aventura
              </Text>
            </View>

            <View style={{ paddingBottom: 6 }}>
              <AuthInput
                label="Correo electronico"
                placeholder="Correo electronico"
                value={email}
                onChangeText={(value) => {
                  setEmail(value)
                  if (emailError) setEmailError(null)
                  if (formError) setFormError(null)
                }}
                iconName="mail"
                keyboardType="email-address"
                hideLabel
                errorText={emailError}
                onFocus={(event) => scrollToFocusedInput(scrollRef, event)}
              />

              <AuthInput
                label="Contrasena"
                placeholder="Contrasena"
                value={password}
                onChangeText={(value) => {
                  setPassword(value)
                  if (formError) setFormError(null)
                }}
                iconName="lock"
                secureTextEntry
                hideLabel
                onFocus={(event) => scrollToFocusedInput(scrollRef, event)}
              />

              {formError ? (
                <Text
                  style={{
                    color: colors.danger,
                    fontSize: 13,
                    marginTop: -2,
                    marginBottom: 14,
                  }}
                >
                  {formError}
                </Text>
              ) : null}

              <AuthButton
                title="Iniciar sesion"
                onPress={handleLogin}
                loading={isSubmitting}
                rightIcon={<ArrowRight size={18} color={colors.text} />}
              />

              <View
                style={{
                  marginTop: 20,
                  marginBottom: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <View style={{ height: 1, backgroundColor: colors.border, flex: 1 }} />
                <Text
                  style={{
                    color: colors.textMuted,
                    fontSize: 13,
                  }}
                >
                  o continua con
                </Text>
                <View style={{ height: 1, backgroundColor: colors.border, flex: 1 }} />
              </View>

              <AuthButton
                title="Continuar con Google"
                onPress={handleGoogleLogin}
                loading={isGoogleSubmitting}
                variant="secondary"
                leftIcon={<FontAwesome name="google" size={20} color={colors.text} />}
              />

              <Pressable
                onPress={() => router.replace('/(auth)/register')}
                style={{ marginTop: 18, paddingBottom: 10 }}
              >
                <Text
                  style={{
                    textAlign: 'center',
                    color: colors.textSecondary,
                    fontSize: 15,
                  }}
                >
                  Sin cuenta?{' '}
                  <Text style={{ color: colors.primary, fontWeight: '700' }}>
                    Registrate
                  </Text>
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
