import { useEffect, useRef, useState } from 'react'
import {
  Alert,
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

import { useAuth } from '../../src/hooks/useAuth'
import { colors } from '../../src/theme/colors'
import { AuthButton } from '../../src/components/auth/AuthButton'
import { AuthInput } from '../../src/components/auth/AuthInput'
import {
  FORM_SCROLL_BOTTOM_PADDING,
  scrollToFocusedInput,
} from '../../src/utils/keyboard'

export default function EditProfileScreen() {
  const router = useRouter()
  const { user, profile, updateMyProfile } = useAuth()
  const scrollRef = useRef<ScrollView | null>(null)

  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [bio, setBio] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (profile) {
      setUsername(profile.username ?? '')
      setFullName(profile.full_name ?? '')
      setBio(profile.bio ?? '')
    }
  }, [profile])

  async function handleSave() {
    const normalizedUsername = username.trim()

    if (!normalizedUsername) {
      Alert.alert('Campo obligatorio', 'El username es obligatorio.')
      return
    }

    if (normalizedUsername.length < 3) {
      Alert.alert('Username invalido', 'El username debe tener al menos 3 caracteres.')
      return
    }

    try {
      setIsSubmitting(true)

      await updateMyProfile({
        username: normalizedUsername,
        full_name: fullName.trim() || null,
        bio: bio.trim() || null,
      })

      Alert.alert('Éxito', 'Tu perfil se actualizó correctamente.')
      router.back()
    } catch (error: any) {
      Alert.alert(
        'Error al actualizar perfil',
        error.message ?? 'No se pudo actualizar el perfil'
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
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 24,
            }}
          >
            <Pressable
              onPress={() => router.back()}
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

            <View style={{ marginBottom: 18 }}>
              <Text
                style={{
                  color: colors.text,
                  fontSize: 14,
                  fontWeight: '600',
                  marginBottom: 8,
                }}
              >
                Correo electrónico
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
                onChangeText={setBio}
                onFocus={(event) => scrollToFocusedInput(scrollRef, event)}
                placeholder="Cuéntanos algo sobre ti..."
                placeholderTextColor={colors.placeholder}
                multiline
                textAlignVertical="top"
                style={{
                  minHeight: 110,
                  backgroundColor: colors.cardSecondary,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 14,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  color: colors.text,
                  fontSize: 15,
                }}
              />
            </View>

            <AuthButton
              title="Guardar cambios"
              onPress={handleSave}
              loading={isSubmitting}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
