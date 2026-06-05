import {
  Alert,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import { useCallback, useMemo, useRef, useState } from 'react'
import { useLocalSearchParams, useRouter, type Href } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'

import { colors } from '../../src/theme/colors'
import { useTripJournalEditor } from '../../src/hooks/useTripJournalEditor'
import { useJournalMedia } from '../../src/hooks/useJournalMedia'
import { FORM_SCROLL_BOTTOM_PADDING } from '../../src/utils/keyboard'
import { useAuth } from '../../src/hooks/useAuth'
import { JournalEditorHeader } from '../../src/components/journal/JournalEditorHeader'
import {
  JournalAuthLoadingState,
  JournalEditorErrorState,
  JournalEditorLoadingState,
  JournalTripMissingState,
} from '../../src/components/journal/JournalEditorStates'
import { JournalTripSummaryCard } from '../../src/components/journal/JournalTripSummaryCard'
import { JournalEditorForm } from '../../src/components/journal/JournalEditorForm'
import { JournalMediaSection } from '../../src/components/journal/JournalMediaSection'

export default function JournalEditorScreen() {
  const router = useRouter()
  const { tripId: rawTripId } = useLocalSearchParams<{ tripId?: string | string[] }>()
  const scrollRef = useRef<ScrollView | null>(null)
  const { user, loading: authLoading } = useAuth()
  const [formError, setFormError] = useState<string | null>(null)

  const tripId = useMemo(() => {
    if (Array.isArray(rawTripId)) {
      return rawTripId[0]?.trim() || ''
    }

    return typeof rawTripId === 'string' ? rawTripId.trim() : ''
  }, [rawTripId])

  const {
    mode,
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

  const journalMediaParams = journal
    ? 'local_id' in journal
      ? { journalId: journal.local_id, mode: 'local' as const }
      : { journalId: journal.id, mode: 'remote' as const, userId: user?.id }
    : { mode, userId: user?.id }

  const {
    media,
    loading: mediaLoading,
    uploading,
    error: mediaError,
    deletingMediaIds,
    pendingNewImageIds,
    mediaDirty,
    pickAndStageImages,
    removeMedia,
    applyPendingMediaChanges,
    refreshMedia,
    maxPhotos,
  } = useJournalMedia(journalMediaParams)

  const hasPendingChanges = hasUnsavedChanges || mediaDirty

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

  const navigateToTripPreview = useCallback(() => {
    if (!tripId) {
      router.replace('/(tabs)/profile/history')
      return
    }

    router.replace({
      pathname: '/trip/[id]',
      params: { id: tripId },
    })
  }, [router, tripId])

  const showSavingInProgressAlert = useCallback(() => {
    Alert.alert(
      'Guardando bitácora',
      'Espera a que termine el guardado antes de salir.',
      [{ text: 'OK' }],
      { cancelable: false }
    )
  }, [])

  const confirmExitWithoutSaving = useCallback(() => {
    Alert.alert(
      'Salir de la bitácora',
      'Si sales ahora, se perderán los datos no guardados de la bitácora.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Salir', style: 'destructive', onPress: navigateBackSafely },
      ],
      { cancelable: false }
    )
  }, [navigateBackSafely])

  const handleBack = useCallback(() => {
    if (saving || uploading) {
      showSavingInProgressAlert()
      return true
    }

    if (hasPendingChanges) {
      confirmExitWithoutSaving()
      return true
    }

    navigateBackSafely()
    return true
  }, [
    saving,
    uploading,
    showSavingInProgressAlert,
    hasPendingChanges,
    confirmExitWithoutSaving,
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
      const savedJournal = await saveJournal({ allowNoFormChanges: mediaDirty })
      const savedJournalId = savedJournal
        ? 'local_id' in savedJournal
          ? savedJournal.local_id
          : savedJournal.id
        : null

      if (!savedJournalId) {
        throw new Error('No se encontro la bitacora para guardar las fotos.')
      }

      const mediaResult = await applyPendingMediaChanges(savedJournalId)
      await refreshEditor()

      if (mediaResult.failedCount > 0) {
        const details = mediaResult.failures
          .slice(0, 2)
          .map((item) => `${item.fileName}: ${item.reason}`)
          .join('\n')

        Alert.alert(
          'Guardado parcial',
          `La bitacora se guardo, pero fallaron ${mediaResult.failedCount} foto(s).${
            details ? `\n\n${details}` : ''
          }`
        )
        return
      }

      navigateToTripPreview()
    } catch (err: any) {
      const message = err?.message ?? 'No se pudo guardar la bitácora.'
      setFormError(message)
    }
  }

  async function handleAddPhotos() {
    try {
      const result = await pickAndStageImages()

      if (result.selectedCount === 0 && result.failedCount === 0) {
        return
      }

      if (result.failedCount > 0) {
        const details = result.failures
          .slice(0, 2)
          .map((item) => `${item.fileName}: ${item.reason}`)
          .join('\n')

        Alert.alert(
          'Seleccion parcial de fotos',
          `Se agregaron ${result.selectedCount} foto(s) pendientes y fallaron ${result.failedCount}.${
            details ? `\n\n${details}` : ''
          }`
        )
        return
      }

      Alert.alert(
        'Fotos pendientes',
        `Se agregaron ${result.selectedCount} foto(s). Guarda los cambios para aplicarlas.`
      )
    } catch (err: any) {
      Alert.alert('Error al agregar fotos', err.message ?? 'No se pudieron agregar las imagenes.')
    }
  }

  function handleRemovePhoto(mediaId: string) {
    const selectedMedia = media.find((item) => item.id === mediaId)
    if (!selectedMedia) return

    if (pendingNewImageIds.includes(mediaId)) {
      removeMedia(selectedMedia).catch((removeError: any) => {
        Alert.alert(
          'Error al quitar foto',
          removeError?.message ?? 'No se pudo quitar la foto pendiente.'
        )
      })
      return
    }

    Alert.alert('Eliminar foto', 'La foto se eliminara cuando guardes los cambios.', [
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {authLoading || !user ? (
        <JournalAuthLoadingState />
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
            <JournalEditorHeader
              hasJournal={Boolean(journal)}
              saving={saving}
              uploading={uploading}
              onBack={handleBack}
            />

            {loading ? (
              <JournalEditorLoadingState />
            ) : error ? (
              <JournalEditorErrorState error={error} onRetry={refreshEditor} />
            ) : !trip ? (
              <JournalTripMissingState />
            ) : (
              <>
                <JournalTripSummaryCard trip={trip} />

                <JournalEditorForm
                  scrollRef={scrollRef}
                  hasJournal={Boolean(journal)}
                  title={title}
                  content={content}
                  visibility={visibility}
                  difficulty={difficulty}
                  category={category}
                  commentsEnabled={commentsEnabled}
                  formError={formError}
                  saving={saving || uploading}
                  uploading={uploading}
                  hasUnsavedChanges={hasPendingChanges}
                  onChangeTitle={setTitle}
                  onChangeContent={setContent}
                  onChangeVisibility={setVisibility}
                  onChangeDifficulty={setDifficulty}
                  onChangeCategory={setCategory}
                  onChangeCommentsEnabled={setCommentsEnabled}
                  onClearFormError={() => setFormError(null)}
                  onSave={handleSaveJournal}
                  mediaSection={
                    <JournalMediaSection
                      hasJournal={Boolean(journal)}
                      media={media}
                      mediaLoading={mediaLoading}
                      mediaError={mediaError}
                      uploading={uploading}
                      deletingMediaIds={deletingMediaIds}
                      pendingMediaIds={pendingNewImageIds}
                      embedded
                      maxPhotos={maxPhotos}
                      onAddPhotos={handleAddPhotos}
                      onRefreshMedia={refreshMedia}
                      onRemovePhoto={handleRemovePhoto}
                    />
                  }
                />
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  )
}
