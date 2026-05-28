import { useEffect, useRef, useState } from 'react'
import {
  Alert,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Feather } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'

import { useAuth } from '../../src/hooks/useAuth'
import { colors } from '../../src/theme/colors'
import { AuthButton } from '../../src/components/auth/AuthButton'
import { AuthInput } from '../../src/components/auth/AuthInput'
import {
  FORM_SCROLL_BOTTOM_PADDING,
  scrollToFocusedInput,
} from '../../src/utils/keyboard'

const MAX_FULL_NAME_LENGTH = 80
const MAX_USERNAME_LENGTH = 30
const MAX_BIO_LENGTH = 250

function normalizeSpaces(value: string) {
  return value.trim().replace(/\s+/g, ' ')
}

export default function EditProfileScreen() {
  const router = useRouter()
  const { user, profile, updateMyProfile } = useAuth()
  const scrollRef = useRef<ScrollView | null>(null)

  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [bio, setBio] = useState('')
  const [initialUsername, setInitialUsername] = useState('')
  const [initialFullName, setInitialFullName] = useState('')
  const [initialBio, setInitialBio] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [fullNameError, setFullNameError] = useState<string | null>(null)
  const [bioError, setBioError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (profile) {
      const nextUsername = profile.username ?? ''
      const nextFullName = profile.full_name ?? ''
      const nextBio = profile.bio ?? ''

      setUsername(nextUsername)
      setFullName(nextFullName)
      setBio(nextBio)
      setInitialUsername(nextUsername)
      setInitialFullName(nextFullName)
      setInitialBio(nextBio)
    }
  }, [profile])

  const hasUnsavedChanges =
    username !== initialUsername || fullName !== initialFullName || bio !== initialBio

  function handleGoBack() {
    if (!hasUnsavedChanges || isSubmitting) {
      router.back()
      return
    }

    Alert.alert(
      'Descartar cambios',
      'Tienes cambios sin guardar. Si sales ahora, se perderan.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Salir sin guardar', style: 'destructive', onPress: () => router.back() },
      ]
    )
  }

  useFocusEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isSubmitting) return true

      if (hasUnsavedChanges) {
        handleGoBack()
        return true
      }

      return false
    })

    return () => subscription.remove()
  })

  async function handleSave() {
    const normalizedUsername = normalizeSpaces(username).replace(/\s+/g, '')
    const normalizedFullName = normalizeSpaces(fullName)
    const normalizedBio = normalizeSpaces(bio)

    setUsernameError(null)
    setFullNameError(null)
    setBioError(null)
    setFormError(null)

    if (!normalizedUsername) {
      setUsernameError('El username es obligatorio.')
      return
    }

    if (normalizedUsername.length < 3) {
      setUsernameError('El username debe tener al menos 3 caracteres.')
      return
    }

    if (normalizedUsername.length > MAX_USERNAME_LENGTH) {
      setUsernameError(`El username no puede superar ${MAX_USERNAME_LENGTH} caracteres.`)
      return
    }

    if (normalizedFullName.length > MAX_FULL_NAME_LENGTH) {
      setFullNameError(`El nombre no puede superar ${MAX_FULL_NAME_LENGTH} caracteres.`)
      return
    }

    if (normalizedBio.length > MAX_BIO_LENGTH) {
      setBioError(`La bio no puede superar ${MAX_BIO_LENGTH} caracteres.`)
      return
    }

    try {
      setIsSubmitting(true)

      await updateMyProfile({
        username: normalizedUsername,
        full_name: normalizedFullName || null,
        bio: normalizedBio || null,
      })

      setInitialUsername(normalizedUsername)
      setInitialFullName(normalizedFullName)
      setInitialBio(normalizedBio)
      router.back()
    } catch (error: any) {
      setFormError(error.message ?? 'No se pudo actualizar el perfil')
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
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 24,
            }}
          >
            <Pressable
              onPress={handleGoBack}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: colors.card,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}
            >
              <Feather name="arrow-left" size={18} color={colors.text} />
            </Pressable>

            <Text
              style={{
                color: colors.text,
                fontSize: 20,
                fontWeight: '700',
              }}
            >
              Editar Perfil
            </Text>
          </View>

          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 18,
            }}
          >
            <AuthInput
              label="Nombre de usuario"
              placeholder="fabian_nogales"
              value={username}
              onChangeText={(value) => {
                setUsername(value)
                if (usernameError) setUsernameError(null)
                if (formError) setFormError(null)
              }}
              iconName="user"
              errorText={usernameError}
              onFocus={(event) => scrollToFocusedInput(scrollRef, event)}
            />

            <AuthInput
              label="Nombre completo"
              placeholder="Fabian Nogales"
              value={fullName}
              onChangeText={(value) => {
                setFullName(value)
                if (fullNameError) setFullNameError(null)
                if (formError) setFormError(null)
              }}
              iconName="edit-3"
              autoCapitalize="words"
              errorText={fullNameError}
              onFocus={(event) => scrollToFocusedInput(scrollRef, event)}
            />

            <View style={{ marginBottom: 18 }}>
              <Text
                style={{
                  color: colors.text,
                  fontSize: 14,
                  fontWeight: '600',
                  marginBottom: 8,
                }}
              >
                Correo electronico
              </Text>

              <View
                style={{
                  backgroundColor: colors.cardSecondary,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 14,
                  minHeight: 54,
                  justifyContent: 'center',
                  paddingHorizontal: 14,
                }}
              >
                <Text style={{ color: colors.textSecondary, fontSize: 15 }}>
                  {user?.email ?? 'Sin correo'}
                </Text>
              </View>
            </View>

            <View style={{ marginBottom: 24 }}>
              <Text
                style={{
                  color: colors.text,
                  fontSize: 14,
                  fontWeight: '600',
                  marginBottom: 8,
                }}
              >
                Bio
              </Text>

              <TextInput
                value={bio}
                onChangeText={(value) => {
                  setBio(value)
                  if (bioError) setBioError(null)
                  if (formError) setFormError(null)
                }}
                onFocus={(event) => scrollToFocusedInput(scrollRef, event)}
                placeholder="Cuentanos algo sobre ti..."
                placeholderTextColor={colors.placeholder}
                multiline
                textAlignVertical="top"
                style={{
                  minHeight: 110,
                  backgroundColor: colors.cardSecondary,
                  borderWidth: 1,
                  borderColor: bioError ? colors.danger : colors.border,
                  borderRadius: 14,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  color: colors.text,
                  fontSize: 15,
                }}
              />

              <Text
                style={{
                  color: bioError ? colors.danger : colors.textSecondary,
                  fontSize: 12,
                  marginTop: 6,
                }}
              >
                {bioError ?? `${bio.length}/${MAX_BIO_LENGTH}`}
              </Text>
            </View>

            {formError ? (
              <Text
                style={{
                  color: colors.danger,
                  fontSize: 13,
                  marginTop: -6,
                  marginBottom: 14,
                }}
              >
                {formError}
              </Text>
            ) : null}

            <AuthButton
              title="Guardar cambios"
              onPress={handleSave}
              loading={isSubmitting}
              disabled={!hasUnsavedChanges}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
