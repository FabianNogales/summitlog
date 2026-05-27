import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Feather } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useAuth } from '../../src/hooks/useAuth'
import { colors } from '../../src/theme/colors'
import { RouteInfoRow } from '../../src/components/routes/RouteInfoRow'
import { RouteDetailMap } from '../../src/components/routes/RouteDetailMap'
import { RouteReportItem } from '../../src/components/routes/RouteReportItem'
import { AuthButton } from '../../src/components/auth/AuthButton'
import {
  formatRouteDistance,
  formatRouteDuration,
} from '../../src/utils/routeFormat'
import { useRouteDetail } from '../../src/hooks/useRouteDetail'
import {
  createRouteReport,
  resolveRouteReport,
  ROUTE_REPORT_SEVERITIES,
  ROUTE_REPORT_TYPES,
  type RouteReportSeverity,
  type RouteReportType,
} from '../../src/services/routeReport.service'
import {
  createRouteComment,
  getRouteComments,
} from '../../src/services/routeComment.service'
import type { RouteComment } from '../../src/types/routeComment'
import { ContentReportModal } from '../../src/components/community/ContentReportModal'
import { createContentReport } from '../../src/services/contentReport.service'
import type { ContentReportReason } from '../../src/types/contentReport'
import {
  FORM_SCROLL_BOTTOM_PADDING,
  scrollToFocusedInput,
} from '../../src/utils/keyboard'
import { getAuthorDisplayName } from '../../src/utils/displayName'

function formatReportTypeLabel(reportType: RouteReportType) {
  switch (reportType) {
    case 'mud':
      return 'Barro'
    case 'landslide':
      return 'Derrumbe'
    case 'closed':
      return 'Ruta cerrada'
    case 'danger':
      return 'Peligro'
    case 'broken_bridge':
      return 'Puente roto'
    case 'bad_signage':
      return 'Mala senalizacion'
    default:
      return 'Otro'
  }
}

function formatSeverityLabel(status: RouteReportSeverity) {
  switch (status) {
    case 'low':
      return 'Baja'
    case 'medium':
      return 'Media'
    case 'high':
      return 'Alta'
    default:
      return status
  }
}

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

  
  const [isMapActive, setIsMapActive] = useState(false)

  const trimmedDescription = description.trim()
  const descriptionTooShort = trimmedDescription.length > 0 && trimmedDescription.length < 10
  const trimmedComment = commentInput.trim()

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
      setCommentsError('No se encontro la ruta para cargar comentarios.')
      setCommentsLoading(false)
      return
    }

    setCommentsError(null)
    loadComments(routeId)
  }, [routeId, loadComments])

  function resetReportForm() {
    setReportType('mud')
    setReportStatus('medium')
    setDescription('')
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
    if (!route?.id) {
      setSubmitError('No se encontro la ruta para reportar.')
      return
    }

    if (!user) {
      Alert.alert('Inicia sesion', 'Debes iniciar sesion para reportar una condicion.')
      return
    }

    if (!reportType) {
      setSubmitError('Selecciona un tipo de condicion.')
      return
    }

    if (!reportStatus) {
      setSubmitError('Selecciona un nivel de severidad.')
      return
    }

    if (trimmedDescription.length < 10) {
      setSubmitError('La descripcion debe tener al menos 10 caracteres.')
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
      })

      await refreshRouteDetail()
      setIsReportFormOpen(false)
      resetReportForm()
      Alert.alert('Reporte enviado', 'Tu reporte de condicion se registro correctamente.')
    } catch (submitErr: any) {
      setSubmitError(
        submitErr?.message ?? 'No se pudo enviar el reporte de condicion.'
      )
    } finally {
      setSubmittingReport(false)
    }
  }

  async function handleSubmitRouteComment() {
    if (!routeId) {
      setCommentsError('No se encontro la ruta para comentar.')
      return
    }

    if (!user) {
      Alert.alert('Inicia sesion', 'Debes iniciar sesion para comentar rutas.')
      return
    }

    if (!route?.comments_enabled) {
      setCommentsError('Los comentarios estan deshabilitados para esta ruta.')
      return
    }

    if (trimmedComment.length < 3) {
      setCommentsError('El comentario debe tener al menos 3 caracteres.')
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
      setCommentsError(
        error?.message ?? 'No se pudo crear el comentario de la ruta.'
      )
    } finally {
      setCommentSubmitting(false)
    }
  }

  function handleOpenReportComment(comment: RouteComment) {
    if (!user) {
      Alert.alert('Inicia sesion', 'Debes iniciar sesion para denunciar contenido.')
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
      Alert.alert('Inicia sesion', 'Debes iniciar sesion para denunciar contenido.')
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
        return false }
      }
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
              Detalle de ruta
            </Text>
          </View>

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
              <Text
                style={{
                  color: colors.text,
                  fontSize: 24,
                  fontWeight: '700',
                  marginBottom: 8,
                }}
              >
                {route.title}
              </Text>

              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: 14,
                  lineHeight: 22,
                  marginBottom: 18,
                }}
              >
                {route.description?.trim() || 'Esta ruta no tiene descripción todavía.'}
              </Text>

              <RouteDetailMap 
                route={route} 
                points={points} 
                setIsMapActive={setIsMapActive} 
              />

              {pointsLoading ? (
                <Text style={{ color: colors.textSecondary, marginBottom: 18 }}>
                  Cargando trazado de la ruta...
                </Text>
              ) : pointsError ? (
                <View
                  style={{
                    backgroundColor: colors.card,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: colors.border,
                    padding: 12,
                    marginBottom: 18,
                  }}
                >
                  <Text style={{ color: colors.danger }}>{pointsError}</Text>
                </View>
              ) : null}

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
                <RouteInfoRow
                  label="Distancia"
                  value={formatRouteDistance(Number(route.distance_m ?? 0))}
                />

                <RouteInfoRow
                  label="Duración estimada"
                  value={formatRouteDuration(Number(route.duration_s ?? 0))}
                />

                <RouteInfoRow
                  label="Dificultad"
                  value={route.difficulty ?? 'No definida'}
                />

                <RouteInfoRow
                  label="Categoría"
                  value={route.category ?? 'No definida'}
                />

                <RouteInfoRow
                  label="Elevación"
                  value={
                    route.elevation_gain_m != null
                      ? `${Number(route.elevation_gain_m).toFixed(0)} m`
                      : 'No disponible'
                  }
                />

                <RouteInfoRow
                  label="Comentarios"
                  value={route.comments_enabled ? 'Habilitados' : 'Deshabilitados'}
                />
              </View>

              <View style={{ marginBottom: 18 }}>
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 18,
                    fontWeight: '700',
                    marginBottom: 12,
                  }}
                >
                  Reportes recientes
                </Text>

                {reportsLoading ? (
                  <Text style={{ color: colors.textSecondary }}>
                    Cargando reportes...
                  </Text>
                ) : reportsError ? (
                  <View
                    style={{
                      backgroundColor: colors.card,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: colors.border,
                      padding: 16,
                    }}
                  >
                    <Text style={{ color: colors.danger, marginBottom: 10 }}>
                      {reportsError}
                    </Text>
                    <Pressable
                      onPress={() => refreshRouteDetail()}
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
                ) : reports.length === 0 ? (
                  <View
                    style={{
                      backgroundColor: colors.card,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: colors.border,
                      padding: 16,
                    }}
                  >
                    <Text style={{ color: colors.textSecondary }}>
                      Esta ruta todavía no tiene reportes visibles.
                    </Text>
                  </View>
                ) : (
                  reports.map((report) => (
                    <RouteReportItem 
                      key={report.id} 
                      report={report} 
                      currentUserId={user?.id} 
                      onResolve={handleResolveReport} 
                    />
                  ))
                )}
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
                    fontSize: 18,
                    fontWeight: '700',
                    marginBottom: 10,
                  }}
                >
                  Reportar condicion
                </Text>

                {!user ? (
                  <Text style={{ color: colors.textSecondary }}>
                    Debes iniciar sesion para enviar reportes de condicion.
                  </Text>
                ) : (
                  <>
                    {!isReportFormOpen ? (
                      <AuthButton
                        title="Reportar condicion"
                        onPress={() => {
                          resetReportForm()
                          setIsReportFormOpen(true)
                          setSubmitError(null)
                        }}
                      />
                    ) : (
                      <View style={{ gap: 12 }}>
                        <Text
                          style={{
                            color: colors.textSecondary,
                            fontSize: 13,
                          }}
                        >
                          Ayuda a otros usuarios describiendo el estado actual del sendero.
                        </Text>

                        <View>
                          <Text style={{ color: colors.textSecondary, marginBottom: 8 }}>
                            Tipo de condicion
                          </Text>
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                            {reportTypeOptions.map((typeOption) => {
                              const active = reportType === typeOption
                              return (
                                <Pressable
                                  key={typeOption}
                                  onPress={() => setReportType(typeOption)}
                                  style={{
                                    paddingHorizontal: 12,
                                    paddingVertical: 9,
                                    borderRadius: 20,
                                    borderWidth: 1,
                                    marginRight: 8,
                                    marginBottom: 8,
                                    borderColor: active ? colors.primary : colors.border,
                                    backgroundColor: active ? colors.primary : colors.cardSecondary,
                                  }}
                                >
                                  <Text
                                    style={{
                                      color: active ? colors.text : colors.textSecondary,
                                      fontWeight: '600',
                                    }}
                                  >
                                    {formatReportTypeLabel(typeOption)}
                                  </Text>
                                </Pressable>
                              )
                            })}
                          </View>
                        </View>

                        <View>
                          <Text style={{ color: colors.textSecondary, marginBottom: 8 }}>
                            Severidad
                          </Text>
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                            {reportSeverityOptions.map((severityOption) => {
                              const active = reportStatus === severityOption
                              return (
                                <Pressable
                                  key={severityOption}
                                  onPress={() => setReportStatus(severityOption)}
                                  style={{
                                    paddingHorizontal: 12,
                                    paddingVertical: 9,
                                    borderRadius: 20,
                                    borderWidth: 1,
                                    marginRight: 8,
                                    marginBottom: 8,
                                    borderColor: active ? colors.primary : colors.border,
                                    backgroundColor: active ? colors.primary : colors.cardSecondary,
                                  }}
                                >
                                  <Text
                                    style={{
                                      color: active ? colors.text : colors.textSecondary,
                                      fontWeight: '600',
                                    }}
                                  >
                                    {formatSeverityLabel(severityOption)}
                                  </Text>
                                </Pressable>
                              )
                            })}
                          </View>
                        </View>

                        <View>
                          <Text style={{ color: colors.textSecondary, marginBottom: 8 }}>
                            Descripcion
                          </Text>
                          <TextInput
                            value={description}
                            onChangeText={setDescription}
                            onFocus={(event) => scrollToFocusedInput(scrollRef, event)}
                            placeholder="Describe la condicion actual de la ruta..."
                            placeholderTextColor={colors.placeholder}
                            multiline
                            textAlignVertical="top"
                            style={{
                              minHeight: 110,
                              backgroundColor: colors.cardSecondary,
                              borderWidth: 1,
                              borderColor: colors.border,
                              borderRadius: 12,
                              paddingHorizontal: 12,
                              paddingVertical: 10,
                              color: colors.text,
                            }}
                          />
                          <Text
                            style={{
                              marginTop: 6,
                              color: descriptionTooShort ? colors.danger : colors.textSecondary,
                              fontSize: 12,
                            }}
                          >
                            Minimo 10 caracteres.
                          </Text>
                        </View>

                        {submitError ? (
                          <Text style={{ color: colors.danger }}>{submitError}</Text>
                        ) : null}

                        <AuthButton
                          title="Enviar reporte"
                          onPress={handleSubmitReport}
                          loading={submittingReport}
                        />

                        <Pressable
                          disabled={submittingReport}
                          onPress={() => {
                            resetReportForm()
                            setIsReportFormOpen(false)
                            setSubmitError(null)
                          }}
                          style={{
                            alignItems: 'center',
                            justifyContent: 'center',
                            minHeight: 44,
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: colors.border,
                            backgroundColor: colors.cardSecondary,
                            opacity: submittingReport ? 0.6 : 1,
                          }}
                        >
                          <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>
                            Cancelar
                          </Text>
                        </Pressable>
                      </View>
                    )}
                  </>
                )}
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
                    fontSize: 18,
                    fontWeight: '700',
                    marginBottom: 10,
                  }}
                >
                  Comentarios
                </Text>

                {commentsLoading ? (
                  <Text style={{ color: colors.textSecondary }}>
                    Cargando comentarios...
                  </Text>
                ) : commentsError ? (
                  <View>
                    <Text style={{ color: colors.danger, marginBottom: 10 }}>
                      {commentsError}
                    </Text>
                    {routeId ? (
                      <Pressable
                        onPress={() => loadComments(routeId)}
                        style={{
                          alignSelf: 'flex-start',
                          borderRadius: 10,
                          borderWidth: 1,
                          borderColor: colors.border,
                          backgroundColor: colors.cardSecondary,
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          marginBottom: 2,
                        }}
                      >
                        <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>
                          Reintentar
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                ) : comments.length === 0 ? (
                  <Text style={{ color: colors.textSecondary }}>
                    Aun no hay comentarios para esta ruta.
                  </Text>
                ) : (
                  comments.map((comment) => {
                    const isOwnComment = Boolean(user?.id && comment.user_id === user.id)
                    const commentAuthor = getAuthorDisplayName(comment.author, {
                      fallbackUsername: isOwnComment ? undefined : null,
                    })

                    return (
                      <View
                        key={comment.id}
                        style={{
                          backgroundColor: colors.cardSecondary,
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: colors.border,
                          padding: 10,
                          marginBottom: 8,
                        }}
                      >
                        <Text
                          style={{
                            color: colors.text,
                            fontWeight: '700',
                            marginBottom: 4,
                          }}
                        >
                          {commentAuthor}
                        </Text>

                        <Text style={{ color: colors.text, marginBottom: 4 }}>
                          {comment.content}
                        </Text>

                        <Text style={{ color: colors.textSecondary, fontSize: 11 }}>
                          {new Date(comment.created_at).toLocaleString()}
                        </Text>

                        {!(user?.id && comment.user_id === user.id) ? (
                          <Pressable
                            onPress={() => handleOpenReportComment(comment)}
                            style={{
                              alignSelf: 'flex-start',
                              marginTop: 8,
                              paddingVertical: 4,
                              paddingHorizontal: 8,
                              borderRadius: 8,
                              borderWidth: 1,
                              borderColor: colors.border,
                              backgroundColor: colors.card,
                            }}
                          >
                            <Text
                              style={{
                                color: colors.danger,
                                fontWeight: '600',
                                fontSize: 12,
                              }}
                            >
                              Denunciar
                            </Text>
                          </Pressable>
                        ) : null}
                      </View>
                    )
                  })
                )}

                {!user ? (
                  <Text style={{ color: colors.textSecondary, marginTop: 8 }}>
                    Inicia sesion para comentar.
                  </Text>
                ) : !route.comments_enabled ? (
                  <Text style={{ color: colors.textSecondary, marginTop: 8 }}>
                    Los comentarios estan deshabilitados para esta ruta.
                  </Text>
                ) : (
                  <View style={{ marginTop: 8 }}>
                    <TextInput
                      value={commentInput}
                      onChangeText={setCommentInput}
                      onFocus={(event) => scrollToFocusedInput(scrollRef, event)}
                      placeholder="Escribe un comentario sobre la ruta..."
                      placeholderTextColor={colors.placeholder}
                      multiline
                      textAlignVertical="top"
                      style={{
                        minHeight: 80,
                        backgroundColor: colors.cardSecondary,
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: 12,
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        color: colors.text,
                        marginBottom: 8,
                      }}
                    />

                    <AuthButton
                      title="Enviar comentario"
                      onPress={handleSubmitRouteComment}
                      loading={commentSubmitting}
                    />
                  </View>
                )}
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
                    marginBottom: 10,
                  }}
                >
                  Coordenadas iniciales
                </Text>

                <Text style={{ color: colors.textSecondary, marginBottom: 14 }}>
                  {route.start_lat ?? '-'}, {route.start_lng ?? '-'}
                </Text>

                <Text
                  style={{
                    color: colors.text,
                    fontSize: 16,
                    fontWeight: '700',
                    marginBottom: 10,
                  }}
                >
                  Coordenadas finales
                </Text>

                <Text style={{ color: colors.textSecondary }}>
                  {route.end_lat ?? '-'}, {route.end_lng ?? '-'}
                </Text>
              </View>
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
    </SafeAreaView>
  )
}
