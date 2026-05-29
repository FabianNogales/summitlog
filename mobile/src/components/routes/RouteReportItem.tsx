import React from 'react'
import { View, Text, TouchableOpacity, Alert, Image, Pressable } from 'react-native'
import { colors } from '../../theme/colors' 
import type { RouteReport } from '../../types/route'
import { Ionicons } from '@expo/vector-icons';
import { getRouteReportPhotoPublicUrl } from '../../services/routeReport.service'
import { ImagePreviewModal } from '../common/ImagePreviewModal'

interface RouteReportItemProps {
  report: RouteReport
  currentUserId?: string | null
  onResolve?: (reportId: string) => void
}

export function RouteReportItem({ report, currentUserId, onResolve }: RouteReportItemProps) {
  const [imageLoadFailed, setImageLoadFailed] = React.useState(false)
  const [previewImageUrl, setPreviewImageUrl] = React.useState<string | null>(null)
  
  const isOwner = currentUserId && currentUserId === report.user_id
  const imageUrl = getRouteReportPhotoPublicUrl(report.photo_path)
  const canRenderImage = Boolean(imageUrl) && !imageLoadFailed

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'low':
        return { label: 'Baja', color: '#4ADE80' }
      case 'medium':
        return { label: 'Media', color: '#FACC15' }
      case 'high':
        return { label: 'Alta', color: '#EF4444' }
      default:
        return { label: severity || 'Baja', color: '#4ADE80' }
    }
  }

  const severityInfo = getSeverityBadge(report.severity)

  const formatReportType = (type: string) => {
    switch (type) {
      case 'mud': return 'Barro'
      case 'landslide': return 'Derrumbe'
      case 'closed': return 'Ruta cerrada'
      case 'danger': return 'Peligro'
      case 'broken_bridge': return 'Puente roto'
      case 'bad_signage': return 'Mala señalización'
      default: return 'Otro'
    }
  }

  const handlePressResolve = () => {
    if (!onResolve) return
    Alert.alert(
      '¿Resolver reporte?',
      '¿Confirmas que esta condición en el sendero ya fue solucionada? El reporte se quitará de la lista.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sí, resolver', style: 'destructive', onPress: () => onResolve(report.id) }
      ]
    )
  }

  return (
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
      {/* CABECERA: Tipo de reporte y Badge de severidad */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700' }}>
          {formatReportType(report.report_type)}
        </Text>
        
        <View 
          style={{ 
            backgroundColor: `${severityInfo.color}15`, 
            paddingHorizontal: 8, 
            paddingVertical: 4, 
            borderRadius: 8,
            borderWidth: 1,
            borderColor: `${severityInfo.color}60`
          }}
        >
          <Text style={{ color: severityInfo.color, fontSize: 12, fontWeight: '700' }}>
            {severityInfo.label}
          </Text>
        </View>
      </View>

      {/* DESCRIPCIÓN */}
      <Text style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 12, lineHeight: 20 }}>
        {report.description}
      </Text>

      {report.photo_path ? (
        canRenderImage ? (
          <Pressable onPress={() => setPreviewImageUrl(imageUrl)}>
            <Image
              source={{ uri: imageUrl }}
              style={{
                width: '100%',
                height: 170,
                borderRadius: 10,
                marginBottom: 12,
                backgroundColor: colors.cardSecondary,
              }}
              resizeMode="cover"
              onError={() => setImageLoadFailed(true)}
            />
          </Pressable>
        ) : (
          <View
            style={{
              backgroundColor: colors.cardSecondary,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: colors.border,
              paddingVertical: 10,
              paddingHorizontal: 12,
              marginBottom: 12,
            }}
          >
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
              Imagen del reporte no disponible.
            </Text>
          </View>
        )
      ) : null}

      {/* SECCIÓN INFERIOR: Fecha a la izquierda, Botón "Resolver" a la derecha */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ color: colors.textMuted, fontSize: 11 }}>
          {new Date(report.created_at).toLocaleString()}
        </Text>

        {isOwner && (
          <TouchableOpacity 
            onPress={handlePressResolve}
            style={{
              backgroundColor: colors.bgElevated,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: colors.borderStrong,
            }}
          >
            <Ionicons name="arrow-undo" size={20} color="#FFF" />
          </TouchableOpacity>
        )}
      </View>
      <ImagePreviewModal
        visible={Boolean(previewImageUrl)}
        imageUrl={previewImageUrl}
        onClose={() => setPreviewImageUrl(null)}
      />
    </View>
  )
}
