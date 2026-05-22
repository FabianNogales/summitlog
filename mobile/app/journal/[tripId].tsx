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
import { useRef } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Feather } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'

import { colors } from '../../src/theme/colors'
import { useTripJournalEditor } from '../../src/hooks/useTripJournalEditor'
import { JournalVisibilitySelector } from '../../src/components/journal/JournalVisibilitySelector'
import { AuthButton } from '../../src/components/auth/AuthButton'
import { formatTripDistance, formatTripDuration } from '../../src/utils/tripFormat'
import { useJournalMedia } from '../../src/hooks/useJournalMedia'
import { JournalMediaGrid } from '../../src/components/journal/JournalMediaGrid'
import {
  FORM_SCROLL_BOTTOM_PADDING,
  scrollToFocusedInput,
} from '../../src/utils/keyboard'

export default function JournalEditorScreen() {
  const router = useRouter()
  const { tripId } = useLocalSearchParams<{ tripId: string }>()
  const scrollRef = useRef<ScrollView | null>(null)

  const {
    trip,
    journal,
    title,
    content,
    visibility,
    loading,
    saving,
    error,
    setTitle,
    setContent,
    setVisibility,
    saveJournal,
  } = useTripJournalEditor(tripId)

  const {
    media,
    uploading,
    pickAndUploadImages,
  } = useJournalMedia(journal?.id)

  async function handleSaveJournal() {
    try {
      const savedJournal = await saveJournal()

      Alert.alert(
        'Éxito',
        savedJournal ? 'La bitácora se guardó correctamente.' : 'No se pudo guardar.'
      )
    } catch (err: any) {
      Alert.alert(
        'Error al guardar bitácora',
        err.message ?? 'No se pudo guardar la bitácora'
      )
    }
  }

  async function handleAddPhotos() {
    try {
      const { uploadedCount } = await pickAndUploadImages()

      if (uploadedCount === 0) {
        return
      }

      Alert.alert(
        'Fotos cargadas',
        'Las imágenes se subieron correctamente a la bitácora.'
      )
    } catch (err: any) {
      Alert.alert(
        'Error al subir fotos',
        err.message ?? 'No se pudieron subir las imágenes'
      )
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
            {journal ? 'Editar bitácora' : 'Crear bitácora'}
          </Text>
        </View>

        {loading ? (
          <Text style={{ color: colors.textSecondary }}>Cargando editor...</Text>
        ) : error ? (
          <Text style={{ color: colors.textSecondary }}>{error}</Text>
        ) : !trip ? (
          <Text style={{ color: colors.textSecondary }}>
            No se encontró el recorrido.
          </Text>
        ) : (
          <>
            <View
              style={{
                backgroundColor: colors.card,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 18,
                marginBottom: 18,
              }}
            >
              <Text
                style={{
                  color: colors.text,
                  fontSize: 18,
                  fontWeight: '700',
                  marginBottom: 6,
                }}
              >
                {trip.title?.trim() || 'Recorrido completado'}
              </Text>

              <Text style={{ color: colors.textSecondary, marginBottom: 10 }}>
                {new Date(trip.started_at).toLocaleDateString()}
              </Text>

              <Text style={{ color: colors.textSecondary }}>
                Distancia: {formatTripDistance(Number(trip.distance_m ?? 0))}
              </Text>

              <Text style={{ color: colors.textSecondary }}>
                Duración: {formatTripDuration(Number(trip.duration_s ?? 0))}
              </Text>
            </View>

            <View
              style={{
                backgroundColor: colors.card,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 18,
                marginBottom: 18,
              }}
            >
              <View style={{ marginBottom: 18 }}>
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 14,
                    fontWeight: '600',
                    marginBottom: 8,
                  }}
                >
                  Título
                </Text>

                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  onFocus={(event) => scrollToFocusedInput(scrollRef, event)}
                  placeholder="Ej: Mi experiencia en el recorrido"
                  placeholderTextColor={colors.placeholder}
                  style={{
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

              <View style={{ marginBottom: 18 }}>
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 14,
                    fontWeight: '600',
                    marginBottom: 8,
                  }}
                >
                  Contenido
                </Text>

                <TextInput
                  value={content}
                  onChangeText={setContent}
                  onFocus={(event) => scrollToFocusedInput(scrollRef, event)}
                  placeholder="Describe tu experiencia, observaciones, clima, dificultad, sensaciones..."
                  placeholderTextColor={colors.placeholder}
                  multiline
                  textAlignVertical="top"
                  style={{
                    minHeight: 140,
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

              <JournalVisibilitySelector
                value={visibility}
                onChange={setVisibility}
              />

              <AuthButton
                title={journal ? 'Guardar cambios' : 'Guardar bitácora'}
                onPress={handleSaveJournal}
                loading={saving}
              />
            </View>

            <View
              style={{
                backgroundColor: colors.card,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 18,
              }}
            >
              <Text
                style={{
                  color: colors.text,
                  fontSize: 16,
                  fontWeight: '700',
                  marginBottom: 12,
                }}
              >
                Fotos de la bitácora
              </Text>

              {!journal ? (
                <Text style={{ color: colors.textSecondary }}>
                  Guarda primero la bitácora para poder adjuntar fotos.
                </Text>
              ) : (
                <>
                  <View style={{ marginBottom: 16 }}>
                    <AuthButton
                      title="Agregar fotos"
                      onPress={handleAddPhotos}
                      loading={uploading}
                    />
                  </View>

                  <JournalMediaGrid media={media} />
                </>
              )}
            </View>
          </>
        )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

