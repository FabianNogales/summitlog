import {
  Alert,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useCallback, useMemo, useRef, useState } from 'react'
import { useLocalSearchParams, useRouter, type Href } from 'expo-router'
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
import type { JournalDifficulty } from '../../src/types/journal'
import {
  FORM_SCROLL_BOTTOM_PADDING,
  scrollToFocusedInput,
} from '../../src/utils/keyboard'
import { useAuth } from '../../src/hooks/useAuth'

const difficultyOptions: {
  label: string
  value: JournalDifficulty
}[] = [
  { label: 'Sin definir', value: '' },
  { label: 'Fácil', value: 'easy' },
  { label: 'Media', value: 'medium' },
  { label: 'Difícil', value: 'hard' },
]

export default function JournalEditorScreen() {
  const router = useRouter()
  const { tripId: rawTripId } = useLocalSearchParams<{ tripId?: string | string[] }>()
  const scrollRef = useRef<ScrollView | null>(null)
  const { user, loading: authLoading } = useAuth()
  const tripId = useMemo(() => {
    if (Array.isArray(rawTripId)) {
      return rawTripId[0]?.trim() || ''
    }

    return typeof rawTripId === 'string' ? rawTripId.trim() : ''
  }, [rawTripId])

  const {
    trip,
    journal,
    title,
    content,
    visibility,
    difficulty,
    category,
    commentsEnabled,
    loading,
    saving,
    error,
    hasUnsavedChanges,
    setTitle,
    setContent,
    setVisibility,
    setDifficulty,
    setCategory,
    setCommentsEnabled,
    saveJournal,
    refreshEditor,
  } = useTripJournalEditor(tripId)

  const journalMediaId = journal
    ? 'local_id' in journal
      ? journal.local_id
      : journal.id
    : undefined

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
  } = useJournalMedia(journalMediaId)

  const [formError, setFormError] = useState<string | null>(null)

  useFocusEffect(
    useCallback(() => {
      if (!authLoading && !user) {
        router.replace('/(auth)/login')
      }
    }, [authLoading, router, user])
  )
  const fallbackBackRoute = useMemo<Href>(() => {
    if (tripId) {
      return {
        pathname: '/trip/[id]',
        params: { id: tripId },
      }
    }

    return '/(tabs)/profile/history'
  }, [tripId])

  const navigateBackSafely = useCallback(() => {
    if (router.canGoBack()) {
      router.back()
      return
    }

    router.replace(fallbackBackRoute)
  }, [fallbackBackRoute, router])

  const showSavingInProgressAlert = useCallback(() => {
    Alert.alert(
      'Guardando bitácora',
      'Espera a que termine el guardado antes de salir.',
      [{ text: 'OK' }],
      { cancelable: false }
    )
  }, [])

  const handleBack = useCallback(() => {
    if (saving || uploading) {
      showSavingInProgressAlert()
      return true
    }

    if (!loading && trip && !journal) {
      Alert.alert(
        'Bitácora obligatoria',
        'Para finalizar el recorrido debes guardar una bitácora con título y contenido.'
      )
      return true
    }

    if (hasUnsavedChanges) {
      Alert.alert(
        'Descartar cambios',
        'Tienes cambios sin guardar en tu bitácora. Si sales ahora, se perderán.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Salir sin guardar', style: 'destructive', onPress: navigateBackSafely },
        ],
        { cancelable: false }
      )
      return true
    }

    navigateBackSafely()
    return true
  }, [
    saving,
    uploading,
    showSavingInProgressAlert,
    loading,
    trip,
    journal,
    hasUnsavedChanges,
    navigateBackSafely,
  ])

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', handleBack)

      return () => subscription.remove()
    }, [handleBack])
  )

  async function handleSaveJournal() {
    if (saving) {
      return
    }

    try {
      setFormError(null)
      const savedJournal = await saveJournal()

      Alert.alert(
        'Bitácora guardada',
        savedJournal
          ? 'La bitácora se guardó localmente. Puedes agregar fotos si deseas.'
          : 'No se pudo guardar.',
        [{ text: 'OK', onPress: navigateBackSafely }],
        { cancelable: false }
      )
    } catch (err: any) {
      const message = err?.message ?? 'No se pudo guardar la bitácora.'
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
          'Guardado parcial de fotos',
          `Se guardaron ${result.uploadedCount} foto(s) y fallaron ${result.failedCount}.${
            details ? `\n\n${details}` : ''
          }`
        )
        return
      }

      Alert.alert(
        'Fotos guardadas',
        `Se guardaron ${result.uploadedCount} foto(s) localmente.`
      )
    } catch (err: any) {
      Alert.alert('Error al guardar fotos', err.message ?? 'No se pudieron guardar las imágenes.')
    }
  }

  function handleRemovePhoto(mediaId: string) {
    const selectedMedia = media.find((item) => item.id === mediaId)
    if (!selectedMedia) return

    Alert.alert('Eliminar foto', 'Esta acción quitará la foto de la bitácora.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeMedia(selectedMedia)
          } catch (removeError: any) {
            Alert.alert(
              'Error al eliminar foto',
              removeError?.message ?? 'No se pudo eliminar la foto de la bitácora.'
            )
          }
        },
      },
    ])
  }

  function handleFinishJournal() {
    if (!journal) {
      Alert.alert(
        'Guarda la bitácora',
        'Primero debes guardar la bitácora antes de finalizar.'
      )
      return
    }

    if (hasUnsavedChanges) {
      Alert.alert(
        'Cambios sin guardar',
        'Guarda los cambios antes de finalizar la bitácora.'
      )
      return
    }

    router.replace('/(tabs)/profile/history')
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {authLoading || !user ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>
            Validando sesion...
          </Text>
        </View>
      ) : (
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
              accessibilityState={{ disabled: saving || uploading }}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: colors.card,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
                opacity: saving || uploading ? 0.65 : 1,
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
            <Text style={{ color: colors.textSecondary }}>No se encontró el recorrido.</Text>
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
                  Recorrido completado
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

                <View style={{ marginBottom: 18 }}>
                  <Text
                    style={{
                      color: colors.text,
                      fontSize: 14,
                      fontWeight: '600',
                      marginBottom: 10,
                    }}
                  >
                    Dificultad
                  </Text>

                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                    {difficultyOptions.map((option) => {
                      const isSelected = difficulty === option.value

                      return (
                        <Pressable
                          key={option.value || 'undefined'}
                          onPress={() => setDifficulty(option.value)}
                          style={{
                            borderRadius: 999,
                            borderWidth: 1,
                            borderColor: isSelected ? '#22c55e' : colors.border,
                            backgroundColor: isSelected ? '#22c55e' : colors.cardSecondary,
                            paddingHorizontal: 16,
                            paddingVertical: 10,
                          }}
                        >
                          <Text
                            style={{
                              color: isSelected ? '#ffffff' : colors.textSecondary,
                              fontWeight: '700',
                            }}
                          >
                            {option.label}
                          </Text>
                        </Pressable>
                      )
                    })}
                  </View>
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
                    Categoría
                  </Text>

                  <TextInput
                    value={category}
                    onChangeText={(value) => {
                      setCategory(value)
                      if (formError) setFormError(null)
                    }}
                    onFocus={(event) => scrollToFocusedInput(scrollRef, event)}
                    placeholder="Ej: trekking, trail, senderismo"
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

                <View
                  style={{
                    marginBottom: 18,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                  }}
                >
                  <Text
                    style={{
                      color: colors.text,
                      fontSize: 14,
                      fontWeight: '600',
                      flex: 1,
                    }}
                  >
                    Habilitar comentarios
                  </Text>

                  <Switch
                    value={commentsEnabled}
                    onValueChange={setCommentsEnabled}
                    trackColor={{ false: colors.cardSecondary, true: '#22c55e' }}
                    thumbColor="#ffffff"
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
                  title={journal ? 'Guardar cambios' : 'Guardar bitácora'}
                  onPress={handleSaveJournal}
                  loading={saving}
                  disabled={uploading || saving || !hasUnsavedChanges}
                />
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
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 16,
                    fontWeight: '700',
                    marginBottom: 8,
                  }}
                >
                  Fotos de la bitácora
                </Text>

                <Text style={{ color: colors.textSecondary, marginBottom: 12 }}>
                  {`Máximo ${maxPhotos} fotos por bitácora (${media.length}/${maxPhotos}).`}
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

              <AuthButton
                title="Finalizar bitácora"
                onPress={handleFinishJournal}
                disabled={!journal || hasUnsavedChanges || saving || uploading}
              />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  )
}
