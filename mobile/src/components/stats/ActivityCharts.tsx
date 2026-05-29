import { ActivityIndicator, Text, View } from 'react-native'
import { useMemo } from 'react'
import type { RecordedTrip } from '../../types/trip'
import { colors } from '../../theme/colors'
import { ProfileSection } from '../profile/ProfileSection'
import { buildActivityChartsData, type ActivityChartDatum } from '../../utils/activityStats'

interface ActivityChartsProps {
  trips: RecordedTrip[]
  loading?: boolean
  error?: string | null
}

interface HorizontalBarChartProps {
  caption: string
  emptyLabel: string
  items: ActivityChartDatum[]
  valueFormatter: (value: number) => string
}

function HorizontalBarChart({
  caption,
  emptyLabel,
  items,
  valueFormatter,
}: HorizontalBarChartProps) {
  const maxValue = items.reduce((currentMax, item) => {
    return item.value > currentMax ? item.value : currentMax
  }, 0)

  if (items.length === 0 || maxValue <= 0) {
    return (
      <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 20 }}>
        {emptyLabel}
      </Text>
    )
  }

  return (
    <View>
      <Text
        style={{
          color: colors.textSecondary,
          fontSize: 12,
          marginBottom: 14,
        }}
      >
        {caption}
      </Text>

      {items.map((item) => {
        const rawWidth = (item.value / maxValue) * 100
        const widthPercentage = item.value > 0 ? Math.max(rawWidth, 8) : 0

        return (
          <View key={`${item.label}-${item.value}`} style={{ marginBottom: 14 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 6,
              }}
            >
              <Text style={{ color: colors.text, fontSize: 13, fontWeight: '600' }}>
                {item.label}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                {valueFormatter(item.value)}
              </Text>
            </View>

            <View
              style={{
                height: 10,
                borderRadius: 999,
                backgroundColor: colors.cardSecondary,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  width: `${Math.min(widthPercentage, 100)}%`,
                  height: '100%',
                  borderRadius: 999,
                  backgroundColor: colors.primary,
                }}
              />
            </View>
          </View>
        )
      })}
    </View>
  )
}

function SectionLoadingState() {
  return (
    <View
      style={{
        minHeight: 120,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <ActivityIndicator size="small" color={colors.primary} />
      <Text style={{ color: colors.textSecondary, marginTop: 10 }}>
        Cargando graficas...
      </Text>
    </View>
  )
}

function SectionMessage({ message }: { message: string }) {
  return (
    <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 20 }}>
      {message}
    </Text>
  )
}

export function ActivityCharts({ trips, loading = false, error = null }: ActivityChartsProps) {
  const chartData = useMemo(() => buildActivityChartsData(trips), [trips])
  const hasChartData =
    chartData.distanceByDate.length > 0 || chartData.tripsByDate.length > 0

  return (
    <>
      <ProfileSection title="Progreso">
        <View style={{ padding: 16 }}>
          <Text
            style={{
              color: colors.text,
              fontSize: 16,
              fontWeight: '700',
              marginBottom: 8,
            }}
          >
            Distancia recorrida por fecha
          </Text>

          {loading ? (
            <SectionLoadingState />
          ) : error ? (
            <SectionMessage message="No se pudieron cargar las graficas en este momento." />
          ) : !hasChartData ? (
            <SectionMessage message="Aun no hay datos suficientes para mostrar graficas." />
          ) : (
            <HorizontalBarChart
              caption="Se muestran las fechas con actividad mas reciente."
              emptyLabel="No hay distancias disponibles para graficar."
              items={chartData.distanceByDate}
              valueFormatter={(value) => `${value.toFixed(2)} km`}
            />
          )}
        </View>
      </ProfileSection>

      <ProfileSection title="Actividad">
        <View style={{ padding: 16 }}>
          <Text
            style={{
              color: colors.text,
              fontSize: 16,
              fontWeight: '700',
              marginBottom: 8,
            }}
          >
            Cantidad de recorridos por fecha
          </Text>

          {loading ? (
            <SectionLoadingState />
          ) : error ? (
            <SectionMessage message="No se pudo resumir la actividad para la grafica." />
          ) : !hasChartData ? (
            <SectionMessage message="Aun no hay datos suficientes para mostrar graficas." />
          ) : (
            <HorizontalBarChart
              caption="Se muestran las fechas con actividad mas reciente."
              emptyLabel="No hay actividad por fecha disponible."
              items={chartData.tripsByDate}
              valueFormatter={(value) => `${value} recorrido${value === 1 ? '' : 's'}`}
            />
          )}
        </View>
      </ProfileSection>
    </>
  )
}
