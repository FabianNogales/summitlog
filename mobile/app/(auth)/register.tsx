import { useRef, useState } from 'react'
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
              Únete a miles de senderistas
            </Text>
          </View>

          <View>
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
              placeholder="Contraseña"
              value={password}
              onChangeText={setPassword}
              iconName="lock"
              secureTextEntry
              onFocus={(event) => scrollToFocusedInput(scrollRef, event)}
            />

            <AuthInput
              label="Confirmar contraseña"
              placeholder="Contraseña"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              iconName="lock"
              secureTextEntry
              onFocus={(event) => scrollToFocusedInput(scrollRef, event)}
            />

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
                o continúa con
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
              onPress={() => {}}
              variant="secondary"
              leftIcon={<FontAwesome name="google" size={20} color={colors.text} />}
              disabled
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
                ¿Ya tienes cuenta?{' '}
                <Text style={{ color: colors.primary, fontWeight: '700' }}>
                  Inicia sesión
                </Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
