import { useRef, useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native'
import { FontAwesome } from '@expo/vector-icons'
import { Redirect, useRouter } from 'expo-router'
import { ArrowLeft, ArrowRight, Mountain } from 'lucide-react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { AuthButton } from '../../src/components/auth/AuthButton'
import { AuthInput } from '../../src/components/auth/AuthInput'
import { useAuth } from '../../src/hooks/useAuth'
import { colors } from '../../src/theme/colors'
import {
  FORM_SCROLL_BOTTOM_PADDING,
  scrollToFocusedInput,
} from '../../src/utils/keyboard'

export default function RegisterScreen() {
  const router = useRouter()
  const { signUp, signInWithGoogle, user, loading, profileLoadError } = useAuth()
  const scrollRef = useRef<ScrollView | null>(null)

  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  function isValidEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  }

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    )
  }

  if (user) {
    return <Redirect href="/(tabs)/home" />
  }

  async function handleRegister() {
    setEmailError(null)
    setPasswordError(null)
    setConfirmPasswordError(null)
    setFormError(null)

    const normalizedEmail = email.trim()

    if (!username.trim()) {
      setFormError('El username es obligatorio.')
      return
    }

    if (!normalizedEmail) {
      setFormError('El correo electronico es obligatorio.')
      return
    }

    if (!password.trim()) {
      setPasswordError('La contrasena es obligatoria.')
      return
    }

    if (!isValidEmail(normalizedEmail)) {
      setEmailError('Ingresa un correo electronico valido.')
      return
    }

    if (password.length < 6) {
      setPasswordError('La contrasena debe tener al menos 6 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError('La confirmacion no coincide con la contrasena.')
      return
    }

    try {
      setIsSubmitting(true)

      await signUp({
        email: normalizedEmail,
        password,
        username: username.trim(),
        fullName: fullName.trim(),
      })
    } catch (error: any) {
      setFormError(error.message ?? 'No se pudo registrar el usuario')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleGoogleRegister() {
    setFormError(null)

    try {
      setIsGoogleSubmitting(true)
      const session = await signInWithGoogle()

      if (session) {
        router.replace('/(tabs)/home')
      }
    } catch (error: any) {
      if (error?.code === 'oauth_cancelled') {
        return
      }

      setFormError(error?.message ?? 'No se pudo iniciar sesion con Google')
    } finally {
      setIsGoogleSubmitting(false)
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
          <Pressable
            onPress={() => router.replace('/(auth)/login')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              alignSelf: 'flex-start',
              gap: 6,
              paddingVertical: 8,
              marginBottom: 16,
            }}
          >
            <ArrowLeft size={16} color={colors.primary} />
            <Text
              style={{
                color: colors.primary,
                fontSize: 16,
                fontWeight: '700',
              }}
            >
              Volver
            </Text>
          </Pressable>

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
              Crea tu cuenta
            </Text>
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 16,
                lineHeight: 22,
              }}
            >
              Unete a miles de senderistas
            </Text>
          </View>

          <View>
            <AuthInput
              label="Nombre de usuario"
              placeholder="tu_usuario"
              value={username}
              onChangeText={(value) => {
                setUsername(value)
                if (formError) setFormError(null)
              }}
              iconName="user"
              onFocus={(event) => scrollToFocusedInput(scrollRef, event)}
            />

            <AuthInput
              label="Nombre completo"
              placeholder="Nombre completo"
              value={fullName}
              onChangeText={(value) => {
                setFullName(value)
                if (formError) setFormError(null)
              }}
              iconName="edit-3"
              autoCapitalize="words"
              onFocus={(event) => scrollToFocusedInput(scrollRef, event)}
            />

            <AuthInput
              label="Correo electronico"
              placeholder="tu@email.com"
              value={email}
              onChangeText={(value) => {
                setEmail(value)
                if (emailError) setEmailError(null)
                if (formError) setFormError(null)
              }}
              iconName="mail"
              keyboardType="email-address"
              errorText={emailError}
              onFocus={(event) => scrollToFocusedInput(scrollRef, event)}
            />

            <AuthInput
              label="Contrasena"
              placeholder="Contrasena"
              value={password}
              onChangeText={(value) => {
                setPassword(value)
                if (passwordError) setPasswordError(null)
                if (formError) setFormError(null)
              }}
              iconName="lock"
              secureTextEntry
              errorText={passwordError}
              onFocus={(event) => scrollToFocusedInput(scrollRef, event)}
            />

            <AuthInput
              label="Confirmar contrasena"
              placeholder="Contrasena"
              value={confirmPassword}
              onChangeText={(value) => {
                setConfirmPassword(value)
                if (confirmPasswordError) setConfirmPasswordError(null)
                if (formError) setFormError(null)
              }}
              iconName="lock"
              secureTextEntry
              errorText={confirmPasswordError}
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

            {profileLoadError ? (
              <Text
                style={{
                  color: colors.warning,
                  fontSize: 12,
                  marginTop: -4,
                  marginBottom: 14,
                }}
              >
                {profileLoadError}
              </Text>
            ) : null}

            <AuthButton
              title="Crear cuenta"
              onPress={handleRegister}
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
              <View
                style={{
                  height: 1,
                  backgroundColor: colors.border,
                  flex: 1,
                }}
              />
              <Text
                style={{
                  color: colors.textMuted,
                  fontSize: 14,
                }}
              >
                o continua con
              </Text>
              <View
                style={{
                  height: 1,
                  backgroundColor: colors.border,
                  flex: 1,
                }}
              />
            </View>

            <AuthButton
              title="Continuar con Google"
              onPress={handleGoogleRegister}
              loading={isGoogleSubmitting}
              variant="secondary"
              leftIcon={<FontAwesome name="google" size={20} color={colors.text} />}
            />

            <Pressable
              onPress={() => router.replace('/(auth)/login')}
              style={{ marginTop: 20 }}
            >
              <Text
                style={{
                  textAlign: 'center',
                  color: colors.textSecondary,
                  fontSize: 16,
                }}
              >
                Ya tienes cuenta?{' '}
                <Text style={{ color: colors.primary, fontWeight: '700' }}>
                  Inicia sesion
                </Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
