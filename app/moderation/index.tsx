import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useAuth } from '../../src/hooks/useAuth'
import { colors } from '../../src/theme/colors'
import { AuthButton } from '../../src/components/auth/AuthButton'
import {
  getContentReports,
  hideReportedContentAndManageReport,
  updateContentReportStatus,
} from '../../src/services/moderation.service'
import type { ModerationContentReport, ModerationStatusFilter } from '../../src/types/moderation'
import {
  FORM_SCROLL_BOTTOM_PADDING,
  scrollToFocusedInput,
} from '../../src/utils/keyboard'

function shortId(value: string) {
  if (!value) return '-'
  if (value.length <= 12) return value
  return `${value.slice(0, 8)}...${value.slice(-4)}`
}

export default function ModerationScreen() {
  const router = useRouter()
  const { user, loading: authLoading, profile } = useAuth()
  const scrollRef = useRef<ScrollView | null>(null)

  const [reports, setReports] = useState<ModerationContentReport[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeStatusFilter, setActiveStatusFilter] = useState<ModerationStatusFilter>('all')
  const [statusDraftById, setStatusDraftById] = useState<Record<string, string>>({})
  const [statusSubmittingById, setStatusSubmittingById] = useState<Record<string, boolean>>({})
  const [hideSubmittingById, setHideSubmittingById] = useState<Record<string, boolean>>({})

  const canModerate = profile?.role === 'admin' || profile?.role === 'moderator'

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/(auth)/login')
    }
  }, [authLoading, router, user])

  const hydrateStatusDrafts = useCallback((items: ModerationContentReport[]) => {
    setStatusDraftById((prev) => {
      const next: Record<string, string> = { ...prev }
      for (const item of items) {
        if (!next[item.id]) {
          next[item.id] = item.status
        }
      }
      return next
    })
  }, [])

  const loadReports = useCallback(
    async (statusFilter: ModerationStatusFilter) => {
      if (!canModerate) {
        setReports([])
        setLoading(false)
        setError(null)
        return
      }

      try {
        setError(null)
        const loadedReports = await getContentReports({
          status: statusFilter === 'all' ? undefined : statusFilter,
          limit: 50,
        })

        setReports(loadedReports)
        hydrateStatusDrafts(loadedReports)
      } catch (loadError: any) {
        setReports([])
        setError(loadError?.message ?? 'No se pudieron cargar las denuncias.')
      }
    },
    [canModerate, hydrateStatusDrafts]
  )

  useEffect(() => {
    async function bootstrap() {
      try {
        setLoading(true)
        await loadReports(activeStatusFilter)
      } finally {
        setLoading(false)
      }
    }

    if (authLoading) {
      return
    }

    bootstrap()
  }, [activeStatusFilter, authLoading, loadReports])

  async function handleRefresh() {
    try {
      setRefreshing(true)
      await loadReports(activeStatusFilter)
    } finally {
      setRefreshing(false)
    }
  }

  const availableStatuses = useMemo(() => {
    const values = new Set<string>()
    for (const report of reports) {
      if (report.status?.trim()) {
        values.add(report.status.trim())
      }
    }
    return ['all', ...Array.from(values)]
  }, [reports])

  function updateStatusDraft(reportId: string, value: string) {
    setStatusDraftById((prev) => ({
      ...prev,
      [reportId]: value,
    }))
  }

  async function handleUpdateReportStatus(report: ModerationContentReport) {
    const nextStatus = (statusDraftById[report.id] ?? '').trim()

    if (!nextStatus) {
      Alert.alert('Estado requerido', 'Ingresa un estado valido para la denuncia.')
      return
    }

    if (nextStatus === report.status) {
      Alert.alert('Sin cambios', 'El estado ya coincide con el valor actual.')
      return
    }

    if (statusSubmittingById[report.id]) {
      return
    }

    try {
      setStatusSubmittingById((prev) => ({ ...prev, [report.id]: true }))
      const updated = await updateContentReportStatus(report.id, nextStatus)
      setReports((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
      updateStatusDraft(updated.id, updated.status)
      Alert.alert('Estado actualizado', 'La denuncia se actualizo correctamente.')
    } catch (updateError: any) {
      Alert.alert(
        'No se pudo actualizar',
        updateError?.message ?? 'No se pudo actualizar el estado de la denuncia.'
      )
    } finally {
      setStatusSubmittingById((prev) => ({ ...prev, [report.id]: false }))
    }
  }

  async function handleHideReportedContent(report: ModerationContentReport) {
    if (hideSubmittingById[report.id]) {
      return
    }

    const nextStatus = (statusDraftById[report.id] ?? '').trim() || 'resolved'

    Alert.alert(
      'Ocultar contenido',
      'Se ocultara el contenido denunciado y se marcara la denuncia como gestionada. ¿Deseas continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Ocultar',
          style: 'destructive',
          onPress: async () => {
            try {
              setHideSubmittingById((prev) => ({ ...prev, [report.id]: true }))
              const updatedReport = await hideReportedContentAndManageReport(report, nextStatus)
              setReports((prev) =>
                prev.map((item) => (item.id === updatedReport.id ? updatedReport : item))
              )
              updateStatusDraft(updatedReport.id, updatedReport.status)
              Alert.alert(
                'Contenido ocultado',
                'El contenido denunciado se oculto y la denuncia quedo gestionada.'
              )
            } catch (hideError: any) {
              Alert.alert(
                'No se pudo completar la moderacion',
                hideError?.message ??
                  'No se pudo ocultar el contenido denunciado en este momento.'
              )
            } finally {
              setHideSubmittingById((prev) => ({ ...prev, [report.id]: false }))
            }
          },
        },
      ]
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {authLoading || !user ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>
            Validando sesión...
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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
        >
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <Text style={{ color: colors.text, fontSize: 24, fontWeight: '700' }}>
            Moderacion minima
          </Text>

          <Pressable onPress={() => router.back()}>
            <Text style={{ color: colors.primary, fontWeight: '600' }}>Volver</Text>
          </Pressable>
        </View>

        {authLoading || loading ? (
          <View style={{ paddingVertical: 24 }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : !canModerate ? (
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 16,
            }}
          >
            <Text style={{ color: colors.text, fontWeight: '700', marginBottom: 6 }}>
              Sin permisos
            </Text>
            <Text style={{ color: colors.textSecondary }}>
              No tienes permisos para moderar contenido en este entorno.
            </Text>
          </View>
        ) : (
          <>
            <View
              style={{
                backgroundColor: colors.card,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 14,
                marginBottom: 12,
              }}
            >
              <Text style={{ color: colors.text, fontWeight: '700', marginBottom: 10 }}>
                Filtro por estado
              </Text>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {availableStatuses.map((statusOption) => {
                  const active = activeStatusFilter === statusOption
                  return (
                    <Pressable
                      key={statusOption}
                      onPress={() => setActiveStatusFilter(statusOption)}
                      style={{
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: active ? colors.primary : colors.border,
                        backgroundColor: active ? colors.primary : colors.cardSecondary,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        marginRight: 8,
                        marginBottom: 8,
                      }}
                    >
                      <Text
                        style={{
                          color: active ? colors.text : colors.textSecondary,
                          fontWeight: '600',
                          fontSize: 12,
                        }}
                      >
                        {statusOption}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>
            </View>

            {error ? (
              <View
                style={{
                  backgroundColor: colors.card,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                  padding: 16,
                  marginBottom: 12,
                }}
              >
                <Text style={{ color: colors.danger }}>{error}</Text>
              </View>
            ) : null}

            {reports.length === 0 ? (
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
                  No hay denuncias para el filtro actual.
                </Text>
              </View>
            ) : (
              reports.map((report) => {
                const submitting = statusSubmittingById[report.id] ?? false
                const hideSubmitting = hideSubmittingById[report.id] ?? false
                const statusDraft = statusDraftById[report.id] ?? report.status

                return (
                  <View
                    key={report.id}
                    style={{
                      backgroundColor: colors.card,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: colors.border,
                      padding: 14,
                      marginBottom: 10,
                    }}
                  >
                    <Text style={{ color: colors.text, fontWeight: '700', marginBottom: 6 }}>
                      Motivo: {report.reason}
                    </Text>

                    <Text style={{ color: colors.textSecondary, marginBottom: 4 }}>
                      Tipo: {report.target_type}
                    </Text>

                    <Text style={{ color: colors.textSecondary, marginBottom: 4 }}>
                      Target: {shortId(report.target_id)}
                    </Text>

                    <Text style={{ color: colors.textSecondary, marginBottom: 4 }}>
                      Reportado por: {shortId(report.reporter_user_id)}
                    </Text>

                    <Text style={{ color: colors.textSecondary, marginBottom: 4 }}>
                      Estado actual: {report.status}
                    </Text>

                    <Text style={{ color: colors.textSecondary, marginBottom: 8, fontSize: 12 }}>
                      {new Date(report.created_at).toLocaleString()}
                    </Text>

                    {report.description?.trim() ? (
                      <Text style={{ color: colors.text, marginBottom: 8 }}>
                        {report.description}
                      </Text>
                    ) : null}

                    <TextInput
                      value={statusDraft}
                      onChangeText={(value) => updateStatusDraft(report.id, value)}
                      onFocus={(event) => scrollToFocusedInput(scrollRef, event)}
                      placeholder="Nuevo estado"
                      placeholderTextColor={colors.placeholder}
                      autoCapitalize="none"
                      style={{
                        backgroundColor: colors.cardSecondary,
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: colors.border,
                        color: colors.text,
                        paddingHorizontal: 10,
                        paddingVertical: 10,
                        marginBottom: 8,
                      }}
                    />

                    <AuthButton
                      title="Actualizar estado"
                      onPress={() => handleUpdateReportStatus(report)}
                      loading={submitting}
                    />

                    <View style={{ height: 8 }} />

                    <AuthButton
                      title="Ocultar contenido + gestionar"
                      onPress={() => handleHideReportedContent(report)}
                      loading={hideSubmitting}
                      disabled={submitting}
                    />
                  </View>
                )
              })
            )}
          </>
        )}
        </ScrollView>
      </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  )
}
