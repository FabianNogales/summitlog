import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useFocusEffect } from '@react-navigation/native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useAuth } from '../../src/hooks/useAuth'
import { ImagePreviewModal } from '../../src/components/common/ImagePreviewModal'
import { colors } from '../../src/theme/colors'
import RouteReportsSectionView, {
  type DraftRouteReportPhoto,
} from '../../src/components/routes/RouteReportsSection'
import RouteCommentsSectionView from '../../src/components/routes/RouteCommentsSection'
import RouteDetailHeaderView from '../../src/components/routes/RouteDetailHeader'
import RouteDetailOverviewSectionView from '../../src/components/routes/RouteDetailOverviewSection'
import { useRouteDetail } from '../../src/hooks/useRouteDetail'
import {
  createRouteReport,
  MAX_ROUTE_REPORT_DESCRIPTION_LENGTH,
  MIN_ROUTE_REPORT_DESCRIPTION_LENGTH,
  resolveRouteReport,
  ROUTE_REPORT_SEVERITIES,
  ROUTE_REPORT_TYPES,
  type RouteReportSeverity,
  type RouteReportType,
} from '../../src/services/routeReport.service'
import {
  createRouteComment,
  getRouteComments,
  MAX_ROUTE_COMMENT_LENGTH,
} from '../../src/services/routeComment.service'
import type { RouteComment } from '../../src/types/routeComment'
import { ContentReportModal } from '../../src/components/community/ContentReportModal'
import { createContentReport } from '../../src/services/contentReport.service'
import type { ContentReportReason } from '../../src/types/contentReport'
import {
  FORM_SCROLL_BOTTOM_PADDING,
  scrollToFocusedInput,
} from '../../src/utils/keyboard'
export default function RouteDetailScreen() {
  const router = useRouter()
  const { id: rawId } = useLocalSearchParams<{ id?: string | string[] }>()
  const { user } = useAuth()
  const scrollRef = useRef<ScrollView | null>(null)
  const routeId = useMemo(() => {
    if (Array.isArray(rawId)) {
      return rawId[0]?.trim() || ''
    }

    return typeof rawId === 'string' ? rawId.trim() : ''
  }, [rawId])
  const {
    route,
    points,
    reports,
    loading,
    error,
    pointsLoading,
    pointsError,
    reportsLoading,
    reportsError,
    refreshRouteDetail,
  } = useRouteDetail(routeId || undefined)
  const [isReportFormOpen, setIsReportFormOpen] = useState(false)
  const [reportType, setReportType] = useState<RouteReportType>('mud')
  const [reportStatus, setReportStatus] = useState<RouteReportSeverity>('medium')
  const [description, setDescription] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submittingReport, setSubmittingReport] = useState(false)
  const [selectedReportPhoto, setSelectedReportPhoto] =
    useState<DraftRouteReportPhoto | null>(null)
  const [comments, setComments] = useState<RouteComment[]>([])
  const [commentsLoading, setCommentsLoading] = useState(true)
  const [commentsError, setCommentsError] = useState<string | null>(null)
  const [commentInput, setCommentInput] = useState('')
  const [commentSubmitting, setCommentSubmitting] = useState(false)
  const [reportCommentDraft, setReportCommentDraft] = useState<RouteComment | null>(null)
  const [reportReason, setReportReason] = useState<ContentReportReason>('spam')
  const [reportDescription, setReportDescription] = useState('')
  const [reportSubmitting, setReportSubmitting] = useState(false)
  const [reportError, setReportError] = useState<string | null>(null)
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)
  const [previewImageUrls, setPreviewImageUrls] = useState<string[]>([])

  
  const [isMapActive, setIsMapActive] = useState(false)

  const trimmedDescription = description.trim()
  const descriptionTooShort =
    trimmedDescription.length > 0 &&
    trimmedDescription.length < MIN_ROUTE_REPORT_DESCRIPTION_LENGTH
  const descriptionTooLong =
    trimmedDescription.length > MAX_ROUTE_REPORT_DESCRIPTION_LENGTH
  const trimmedComment = commentInput.trim()
  const commentTooLong = trimmedComment.length > MAX_ROUTE_COMMENT_LENGTH

  const reportTypeOptions = useMemo(() => ROUTE_REPORT_TYPES, [])
  const reportSeverityOptions = useMemo(() => ROUTE_REPORT_SEVERITIES, [])

  const loadComments = useCallback(
    async (routeId: string) => {
      if (!routeId) {
        setComments([])
        setCommentsLoading(false)
        return
      }

      try {
        setCommentsLoading(true)
        setCommentsError(null)
        const loadedComments = await getRouteComments(routeId)
        setComments(loadedComments)
      } catch (error: any) {
        setCommentsError(
          error?.message ?? 'No se pudieron cargar los comentarios de la ruta.'
        )
      } finally {
        setCommentsLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    if (!routeId) {
      setComments([])
      setCommentsError('No se encontró la ruta para cargar comentarios.')
      setCommentsLoading(false)
      return
    }

    setCommentsError(null)
    loadComments(routeId)
  }, [routeId, loadComments])

  useFocusEffect(
    useCallback(() => {
      if (!routeId) {
        return
      }

      refreshRouteDetail().catch((err) => {
        console.error('Error refrescando detalle de ruta:', err)
      })
    }, [routeId, refreshRouteDetail])
  )

  function resetReportForm() {
    setReportType('mud')
    setReportStatus('medium')
    setDescription('')
    setSelectedReportPhoto(null)
    setSubmitError(null)
  }

  function handlePreviewImage(imageUrl: string, imageUrls?: string[]) {
    setPreviewImageUrl(imageUrl)
    setPreviewImageUrls(imageUrls?.length ? imageUrls : [imageUrl])
  }

  function handleCloseImagePreview() {
    setPreviewImageUrl(null)
    setPreviewImageUrls([])
  }

  async function handlePickReportPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()

    if (!permission.granted) {
      setSubmitError(
        'Se necesita permiso para acceder a la galería. Habilítalo desde configuración del dispositivo.'
      )
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: false,
      allowsEditing: false,
      quality: 0.8,
      selectionLimit: 1,
    })

    if (result.canceled || !result.assets?.length) {
      return
    }

    const selected = result.assets[0]
    setSelectedReportPhoto({
      uri: selected.uri,
      fileName: selected.fileName ?? null,
      mimeType: selected.mimeType ?? null,
      fileSize: selected.fileSize ?? null,
    })
    setSubmitError(null)
  }

  async function handleResolveReport(reportId: string) {
    try {
      await resolveRouteReport(reportId)
      // Refrescamos los detalles de la ruta para que vuelva a pedir los reportes a Supabase
      await refreshRouteDetail()
      Alert.alert('Reporte resuelto', 'El reporte se ha marcado como resuelto con éxito.')
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'No se pudo resolver el reporte.')
    }
  }

  async function handleSubmitReport() {
    if (submittingReport) {
      return
    }

    if (!route?.id) {
      setSubmitError('No se encontró la ruta para reportar.')
      return
    }

    if (!user) {
      Alert.alert('Inicia sesión', 'Debes iniciar sesión para reportar una condición.')
      return
    }

    if (!reportType) {
      setSubmitError('Selecciona un tipo de condición.')
      return
    }

    if (!reportStatus) {
      setSubmitError('Selecciona un nivel de severidad.')
      return
    }

    if (trimmedDescription.length < MIN_ROUTE_REPORT_DESCRIPTION_LENGTH) {
      setSubmitError(
        `La descripción debe tener al menos ${MIN_ROUTE_REPORT_DESCRIPTION_LENGTH} caracteres.`
      )
      return
    }

    if (trimmedDescription.length > MAX_ROUTE_REPORT_DESCRIPTION_LENGTH) {
      setSubmitError(
        `La descripción no puede superar ${MAX_ROUTE_REPORT_DESCRIPTION_LENGTH} caracteres.`
      )
      return
    }

    try {
      setSubmittingReport(true)
      setSubmitError(null)

      await createRouteReport({
        routeId: route.id,
        reportType,
        reportStatus,
        description: trimmedDescription,
        photo: selectedReportPhoto
          ? {
              fileUri: selectedReportPhoto.uri,
              fileName: selectedReportPhoto.fileName,
              mimeType: selectedReportPhoto.mimeType,
              fileSize: selectedReportPhoto.fileSize,
            }
          : undefined,
      })

      await refreshRouteDetail()
      setIsReportFormOpen(false)
      resetReportForm()
      Alert.alert('Reporte enviado', 'Tu reporte de condición se registró correctamente.')
    } catch (submitErr: any) {
      setSubmitError(
        submitErr?.message ?? 'No se pudo enviar el reporte de condición.'
      )
    } finally {
      setSubmittingReport(false)
    }
  }

  async function handleSubmitRouteComment() {
    if (!routeId) {
      setCommentsError('No se encontró la ruta para comentar.')
      return
    }

    if (!user) {
      Alert.alert('Inicia sesión', 'Debes iniciar sesión para comentar rutas.')
      return
    }

    if (!route?.comments_enabled) {
      setCommentsError('Los comentarios están deshabilitados para esta ruta.')
      return
    }

    if (trimmedComment.length < 3) {
      setCommentsError('El comentario debe tener al menos 3 caracteres.')
      return
    }

    if (trimmedComment.length > MAX_ROUTE_COMMENT_LENGTH) {
      setCommentsError(
        `El comentario no puede superar ${MAX_ROUTE_COMMENT_LENGTH} caracteres.`
      )
      return
    }

    if (commentSubmitting) {
      return
    }

    try {
      setCommentSubmitting(true)
      setCommentsError(null)
      await createRouteComment({
        routeId,
        content: trimmedComment,
      })
      setCommentInput('')
      await loadComments(routeId)
    } catch (error: any) {
      const message = typeof error?.message === 'string' ? error.message : ''
      if (message.toLowerCase().includes('deshabilitados')) {
        setCommentsError('Los comentarios fueron deshabilitados para esta ruta.')
        return
      }

      setCommentsError(
        error?.message ?? 'No se pudo crear el comentario de la ruta.'
      )
    } finally {
      setCommentSubmitting(false)
    }
  }

  function handleOpenReportComment(comment: RouteComment) {
    if (!user) {
      Alert.alert('Inicia sesión', 'Debes iniciar sesión para denunciar contenido.')
      return
    }

    if (comment.user_id && comment.user_id === user.id) {
      return
    }

    setReportCommentDraft(comment)
    setReportReason('spam')
    setReportDescription('')
    setReportError(null)
  }

  function handleCloseReportModal() {
    setReportCommentDraft(null)
    setReportReason('spam')
    setReportDescription('')
    setReportError(null)
  }

  async function handleSubmitCommentReport() {
    if (!reportCommentDraft) {
      return
    }

    if (!user) {
      Alert.alert('Inicia sesión', 'Debes iniciar sesión para denunciar contenido.')
      return
    }

    if (reportSubmitting) {
      return
    }

    try {
      setReportSubmitting(true)
      setReportError(null)

      await createContentReport({
        targetType: 'comment',
        targetId: reportCommentDraft.id,
        targetOwnerId: reportCommentDraft.user_id,
        reason: reportReason,
        description: reportDescription,
      })

      handleCloseReportModal()
      Alert.alert('Denuncia enviada', 'La denuncia se envio correctamente.')
    } catch (error: any) {
      setReportError(error?.message ?? 'No se pudo enviar la denuncia.')
    } finally {
      setReportSubmitting(false)
    }
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      onStartShouldSetResponder={() => {
        if (isMapActive) setIsMapActive(false)
        return false
      }}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollRef}
          scrollEnabled={!isMapActive}
          contentContainerStyle={{
            flexGrow: 1,
            padding: 20,
            paddingBottom: FORM_SCROLL_BOTTOM_PADDING,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <RouteDetailHeaderView onBack={() => router.back()} />

          {loading ? (
            <Text style={{ color: colors.textSecondary }}>Cargando ruta...</Text>
          ) : error ? (
            <Text style={{ color: colors.textSecondary }}>{error}</Text>
          ) : !route ? (
            <Text style={{ color: colors.textSecondary }}>
              No se encontró la ruta.
            </Text>
          ) : (
            <>
              <RouteDetailOverviewSectionView
                route={route}
                points={points}
                pointsLoading={pointsLoading}
                pointsError={pointsError}
                onPreviewImage={handlePreviewImage}
                setIsMapActive={setIsMapActive}
              />

              <RouteReportsSectionView
                reports={reports}
                reportsLoading={reportsLoading}
                reportsError={reportsError}
                currentUserId={user?.id}
                userCanReport={Boolean(user)}
                isReportFormOpen={isReportFormOpen}
                reportType={reportType}
                reportStatus={reportStatus}
                description={description}
                trimmedDescriptionLength={trimmedDescription.length}
                descriptionTooShort={descriptionTooShort}
                descriptionTooLong={descriptionTooLong}
                selectedReportPhoto={selectedReportPhoto}
                submitError={submitError}
                submittingReport={submittingReport}
                reportTypeOptions={reportTypeOptions}
                reportSeverityOptions={reportSeverityOptions}
                onRefreshReports={() => refreshRouteDetail()}
                onResolveReport={handleResolveReport}
                onOpenReportForm={() => {
                  resetReportForm()
                  setIsReportFormOpen(true)
                  setSubmitError(null)
                }}
                onChangeReportType={setReportType}
                onChangeReportStatus={setReportStatus}
                onChangeDescription={setDescription}
                onDescriptionFocus={(event) => scrollToFocusedInput(scrollRef, event)}
                onPreviewImage={handlePreviewImage}
                onRemoveReportPhoto={() => setSelectedReportPhoto(null)}
                onPickReportPhoto={handlePickReportPhoto}
                onSubmitReport={handleSubmitReport}
                onCancelReport={() => {
                  resetReportForm()
                  setIsReportFormOpen(false)
                  setSubmitError(null)
                }}
              />

              <RouteCommentsSectionView
                comments={comments}
                commentsLoading={commentsLoading}
                commentsError={commentsError}
                canRetry={Boolean(routeId)}
                currentUserId={user?.id}
                commentsEnabled={route.comments_enabled}
                commentInput={commentInput}
                trimmedCommentLength={trimmedComment.length}
                commentTooLong={commentTooLong}
                commentSubmitting={commentSubmitting}
                onRetryComments={() => {
                  if (routeId) loadComments(routeId)
                }}
                onOpenReportComment={handleOpenReportComment}
                onChangeCommentInput={setCommentInput}
                onCommentInputFocus={(event) => scrollToFocusedInput(scrollRef, event)}
                onSubmitComment={handleSubmitRouteComment}
              />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <ContentReportModal
        visible={Boolean(reportCommentDraft)}
        targetLabel="comentario de ruta"
        reason={reportReason}
        description={reportDescription}
        loading={reportSubmitting}
        errorMessage={reportError}
        onChangeReason={setReportReason}
        onChangeDescription={setReportDescription}
        onClose={handleCloseReportModal}
        onSubmit={handleSubmitCommentReport}
      />
      <ImagePreviewModal
        visible={Boolean(previewImageUrl)}
        imageUrl={previewImageUrl}
        imageUrls={previewImageUrls}
        onClose={handleCloseImagePreview}
      />
    </SafeAreaView>
  )
}
