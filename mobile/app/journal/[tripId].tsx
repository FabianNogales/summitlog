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
import { useRef, useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Feather } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'

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
    hasUnsavedChanges,
    setTitle,
    setContent,
    setVisibility,
    saveJournal,
    refreshEditor,
  } = useTripJournalEditor(tripId)

  const {
    media,
    loading: mediaLoading,
    uploading,
    error: mediaError,
    deletingMediaIds,
    pickAndUploadImages,
    removeMedia,
    refreshMedia,
    maxPhotos,
  } = useJournalMedia(journal?.id)

  const [formError, setFormError] = useState<string | null>(null)

  function handleBack() {
    if (!hasUnsavedChanges || saving || uploading) {
      router.back()
      return
    }

    Alert.alert(
      'Descartar cambios',
      'Tienes cambios sin guardar en tu bitacora. Si sales ahora, se perderan.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Salir sin guardar', style: 'destructive', onPress: () => router.back() },
      ]
    )
  }

  useFocusEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (saving || uploading) {
        return true
      }

      if (hasUnsavedChanges) {
        handleBack()
        return true
      }

      return false
    })

    return () => subscription.remove()
  })

  async function handleSaveJournal() {
    try {
      setFormError(null)
      const savedJournal = await saveJournal()

      Alert.alert(
        'Bitacora guardada',
        savedJournal ? 'La bitacora se guardo correctamente.' : 'No se pudo guardar.'
      )
    } catch (err: any) {
      const message = err?.message ?? 'No se pudo guardar la bitacora'
      setFormError(message)
    }
  }

  async function handleAddPhotos() {
    try {
      const result = await pickAndUploadImages()

      if (result.uploadedCount === 0 && result.failedCount === 0) {
        return
      }

      if (result.failedCount > 0) {
        const details = result.failures
          .slice(0, 2)
          .map((item) => `${item.fileName}: ${item.reason}`)
          .join('\n')

        Alert.alert(
          'Carga parcial de fotos',
          `Se subieron ${result.uploadedCount} foto(s) y fallaron ${result.failedCount}.${
            details ? `\n\n${details}` : ''
          }`
        )
        return
      }

      Alert.alert('Fotos cargadas', `Se subieron ${result.uploadedCount} foto(s) correctamente.`)
    } catch (err: any) {
      Alert.alert('Error al subir fotos', err.message ?? 'No se pudieron subir las imagenes')
    }
  }

  function handleRemovePhoto(mediaId: string) {
    const selectedMedia = media.find((item) => item.id === mediaId)
    if (!selectedMedia) return

    Alert.alert('Eliminar foto', 'Esta accion quitara la foto de la bitacora.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            const result = await removeMedia(selectedMedia)

            if (result.orphanedFilePath) {
              Alert.alert(
                'Foto eliminada con advertencia',
                'La foto se elimino de la bitacora, pero el archivo remoto no pudo borrarse. Quedo un archivo huerfano en Storage.'
              )
            }
          } catch (removeError: any) {
            Alert.alert(
              'Error al eliminar foto',
              removeError?.message ?? 'No se pudo eliminar la foto de la bitacora.'
            )
          }
        },
      },
    ])
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
              onPress={handleBack}
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
              {journal ? 'Editar bitacora' : 'Crear bitacora'}
            </Text>
          </View>

          {loading ? (
            <Text style={{ color: colors.textSecondary }}>Cargando editor...</Text>
          ) : error ? (
            <View>
              <Text style={{ color: colors.danger, marginBottom: 10 }}>{error}</Text>
              <Pressable
                onPress={refreshEditor}
                style={{
                  alignSelf: 'flex-start',
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.cardSecondary,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                }}
              >
                <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Reintentar</Text>
              </Pressable>
            </View>
          ) : !trip ? (
            <Text style={{ color: colors.textSecondary }}>No se encontro el recorrido.</Text>
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
                  Duracion: {formatTripDuration(Number(trip.duration_s ?? 0))}
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
                    Titulo
                  </Text>

                  <TextInput
                    value={title}
                    onChangeText={(value) => {
                      setTitle(value)
                      if (formError) setFormError(null)
                    }}
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
                    onChangeText={(value) => {
                      setContent(value)
                      if (formError) setFormError(null)
                    }}
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

                <JournalVisibilitySelector value={visibility} onChange={setVisibility} />

                {formError ? (
                  <Text
                    style={{
                      color: colors.danger,
                      fontSize: 13,
                      marginBottom: 12,
                    }}
                  >
                    {formError}
                  </Text>
                ) : null}

                <AuthButton
                  title={journal ? 'Guardar cambios' : 'Guardar bitacora'}
                  onPress={handleSaveJournal}
                  loading={saving}
                  disabled={uploading || !hasUnsavedChanges}
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
                    marginBottom: 8,
                  }}
                >
                  Fotos de la bitacora
                </Text>

                <Text style={{ color: colors.textSecondary, marginBottom: 12 }}>
                  {`Maximo ${maxPhotos} fotos por bitacora (${media.length}/${maxPhotos}).`}
                </Text>

                {!journal ? (
                  <Text style={{ color: colors.textSecondary }}>
                    Guarda primero la bitacora para poder adjuntar fotos.
                  </Text>
                ) : (
                  <>
                    <View style={{ marginBottom: 16 }}>
                      <AuthButton
                        title="Agregar fotos"
                        onPress={handleAddPhotos}
                        loading={uploading}
                        disabled={media.length >= maxPhotos || deletingMediaIds.length > 0}
                      />
                    </View>

                    {mediaLoading ? (
                      <Text style={{ color: colors.textSecondary, marginBottom: 10 }}>
                        Cargando fotos...
                      </Text>
                    ) : null}

                    {mediaError ? (
                      <View style={{ marginBottom: 12 }}>
                        <Text style={{ color: colors.danger, marginBottom: 10 }}>{mediaError}</Text>
                        <Pressable
                          onPress={refreshMedia}
                          style={{
                            alignSelf: 'flex-start',
                            borderRadius: 10,
                            borderWidth: 1,
                            borderColor: colors.border,
                            backgroundColor: colors.cardSecondary,
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                          }}
                        >
                          <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>
                            Reintentar
                          </Text>
                        </Pressable>
                      </View>
                    ) : null}

                    <JournalMediaGrid
                      media={media}
                      deletingMediaIds={deletingMediaIds}
                      onRemove={(item) => handleRemovePhoto(item.id)}
                    />
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
