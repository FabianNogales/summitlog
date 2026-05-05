import { Text, View } from 'react-native'
import { colors } from '../../theme/colors'
import type { RouteReport } from '../../types/route'

interface RouteReportItemProps {
  report: RouteReport
}

function formatReportType(reportType: string) {
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
      return 'Mala señalización'
    default:
      return 'Otro'
  }
}

export function RouteReportItem({ report }: RouteReportItemProps) {
  return (
    <View
      style={{
        backgroundColor: colors.cardSecondary,
        borderRadius: 14,
        padding: 14,
        marginBottom: 10,
      }}
    >
      <Text
        style={{
          color: colors.text,
          fontSize: 14,
          fontWeight: '700',
          marginBottom: 6,
        }}
      >
        {formatReportType(report.report_type)}
      </Text>

      <Text
        style={{
          color: colors.textSecondary,
          fontSize: 13,
          lineHeight: 20,
          marginBottom: 8,
        }}
      >
        {report.description?.trim() || 'Sin descripción adicional.'}
      </Text>

      <Text
        style={{
          color: colors.textSecondary,
          fontSize: 12,
        }}
      >
        {new Date(report.created_at).toLocaleString()}
      </Text>
    </View>
  )
}