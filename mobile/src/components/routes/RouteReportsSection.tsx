import { Image, Pressable, Text, TextInput, View } from 'react-native'
import { colors } from '../../theme/colors'
import type { RouteReport } from '../../types/route'
import {
  MAX_ROUTE_REPORT_DESCRIPTION_LENGTH,
  MAX_ROUTE_REPORT_IMAGE_SIZE_MB,
  MIN_ROUTE_REPORT_DESCRIPTION_LENGTH,
  type RouteReportSeverity,
  type RouteReportType,
} from '../../services/routeReport.service'
import { AuthButton } from '../auth/AuthButton'
import { RouteReportItem } from './RouteReportItem'

export interface DraftRouteReportPhoto {
  uri: string
  fileName: string | null
  mimeType: string | null
  fileSize: number | null
}

interface RouteReportsSectionProps {
  reports: RouteReport[]
  reportsLoading: boolean
  reportsError: string | null
  currentUserId?: string
  userCanReport: boolean
  isReportFormOpen: boolean
  reportType: RouteReportType
  reportStatus: RouteReportSeverity
  description: string
  trimmedDescriptionLength: number
  descriptionTooShort: boolean
  descriptionTooLong: boolean
  selectedReportPhoto: DraftRouteReportPhoto | null
  submitError: string | null
  submittingReport: boolean
  reportTypeOptions: readonly RouteReportType[]
  reportSeverityOptions: readonly RouteReportSeverity[]
  onRefreshReports: () => void
  onResolveReport: (reportId: string) => void
  onOpenReportForm: () => void
  onChangeReportType: (value: RouteReportType) => void
  onChangeReportStatus: (value: RouteReportSeverity) => void
  onChangeDescription: (value: string) => void
  onDescriptionFocus: (event: any) => void
  onPreviewImage: (imageUrl: string) => void
  onRemoveReportPhoto: () => void
  onPickReportPhoto: () => void
  onSubmitReport: () => void
  onCancelReport: () => void
}

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

function RouteReportsSection({
  reports,
  reportsLoading,
  reportsError,
  currentUserId,
  userCanReport,
  isReportFormOpen,
  reportType,
  reportStatus,
  description,
  trimmedDescriptionLength,
  descriptionTooShort,
  descriptionTooLong,
  selectedReportPhoto,
  submitError,
  submittingReport,
  reportTypeOptions,
  reportSeverityOptions,
  onRefreshReports,
  onResolveReport,
  onOpenReportForm,
  onChangeReportType,
  onChangeReportStatus,
  onChangeDescription,
  onDescriptionFocus,
  onPreviewImage,
  onRemoveReportPhoto,
  onPickReportPhoto,
  onSubmitReport,
  onCancelReport,
}: RouteReportsSectionProps) {
  return (
    <>
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
              onPress={onRefreshReports}
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
              Esta ruta todavÃ­a no tiene reportes visibles.
            </Text>
          </View>
        ) : (
          reports.map((report) => (
            <RouteReportItem
              key={report.id}
              report={report}
              currentUserId={currentUserId}
              onResolve={onResolveReport}
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

        {!userCanReport ? (
          <Text style={{ color: colors.textSecondary }}>
            Debes iniciar sesion para enviar reportes de condicion.
          </Text>
        ) : (
          <>
            {!isReportFormOpen ? (
              <AuthButton
                title="Reportar condicion"
                onPress={onOpenReportForm}
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
                          onPress={() => onChangeReportType(typeOption)}
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
                          onPress={() => onChangeReportStatus(severityOption)}
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
                    onChangeText={onChangeDescription}
                    onFocus={onDescriptionFocus}
                    placeholder="Describe la condicion actual de la ruta..."
                    placeholderTextColor={colors.placeholder}
                    maxLength={MAX_ROUTE_REPORT_DESCRIPTION_LENGTH}
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
                      color:
                        descriptionTooShort || descriptionTooLong
                          ? colors.danger
                          : colors.textSecondary,
                      fontSize: 12,
                    }}
                  >
                    {`${trimmedDescriptionLength}/${MAX_ROUTE_REPORT_DESCRIPTION_LENGTH} - Minimo ${MIN_ROUTE_REPORT_DESCRIPTION_LENGTH} caracteres.`}
                  </Text>
                </View>

                {selectedReportPhoto ? (
                  <View
                    style={{
                      borderRadius: 12,
                      overflow: 'hidden',
                      borderWidth: 1,
                      borderColor: colors.border,
                      backgroundColor: colors.cardSecondary,
                    }}
                  >
                    <Pressable onPress={() => onPreviewImage(selectedReportPhoto.uri)}>
                      <Image
                        source={{ uri: selectedReportPhoto.uri }}
                        style={{ width: '100%', height: 170 }}
                        resizeMode="cover"
                      />
                    </Pressable>
                    <View
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 9,
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Text
                        style={{ color: colors.textSecondary, fontSize: 12, flex: 1 }}
                        numberOfLines={1}
                      >
                        {selectedReportPhoto.fileName ?? 'Foto seleccionada'}
                      </Text>
                      <Pressable
                        onPress={onRemoveReportPhoto}
                        style={{
                          marginLeft: 10,
                          borderRadius: 9,
                          borderWidth: 1,
                          borderColor: colors.border,
                          paddingHorizontal: 9,
                          paddingVertical: 5,
                          backgroundColor: colors.card,
                        }}
                      >
                        <Text
                          style={{
                            color: colors.textSecondary,
                            fontSize: 12,
                            fontWeight: '600',
                          }}
                        >
                          Quitar
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ) : null}

                <Pressable
                  onPress={onPickReportPhoto}
                  style={{
                    minHeight: 44,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: colors.border,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: colors.cardSecondary,
                  }}
                >
                  <Text style={{ color: colors.textSecondary, fontWeight: '700' }}>
                    Agregar foto (opcional)
                  </Text>
                </Pressable>
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                  Solo JPG/PNG. Maximo {MAX_ROUTE_REPORT_IMAGE_SIZE_MB} MB.
                </Text>

                {submitError ? (
                  <Text style={{ color: colors.danger }}>{submitError}</Text>
                ) : null}

                <AuthButton
                  title="Enviar reporte"
                  onPress={onSubmitReport}
                  loading={submittingReport}
                />

                <Pressable
                  disabled={submittingReport}
                  onPress={onCancelReport}
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
    </>
  )
}
export default RouteReportsSection