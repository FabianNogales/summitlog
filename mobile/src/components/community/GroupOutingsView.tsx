import React, { useEffect, useState, useCallback } from 'react'
import { View, Text, RefreshControl, ScrollView, ActivityIndicator } from 'react-native'
import { colors } from '../../theme/colors'
import { groupOutingService } from '../../services/groupOuting.service'
import { GroupOuting } from '../../types/groupOuting'
import { GroupOutingCard } from './GroupOutingCard'

interface GroupOutingsViewProps {
  refreshTrigger: boolean
}

export function GroupOutingsView({ refreshTrigger }: GroupOutingsViewProps) {
  const [outings, setOutings] = useState<GroupOuting[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchOutings = useCallback(async () => {
    try {
      // Al actualizar, traemos de forma fresca los conteos reales de la BD
      const data = await groupOutingService.getUpcomingGroupOutings()
      setOutings(data)
    } catch (err: any) {
      setError(err?.message || 'Ocurrió un error al cargar las salidas grupales.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchOutings()
  }, [fetchOutings, refreshTrigger])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchOutings()
  }

  if (loading) {
    return (
      <View style={{ paddingVertical: 40, alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.textSecondary, marginTop: 12 }}>Buscando aventuras...</Text>
      </View>
    )
  }

  if (error) {
    return (
      <View style={{ backgroundColor: colors.bgCard, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.borderSoft, marginTop: 10 }}>
        <Text style={{ color: colors.danger }}>{error}</Text>
      </View>
    )
  }

  if (outings.length === 0) {
    return (
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
        contentContainerStyle={{ paddingVertical: 60, alignItems: 'center' }}
      >
        <Text style={{ color: colors.textSecondary, fontSize: 16, textAlign: 'center' }}>
          No hay salidas grupales próximas.
        </Text>
      </ScrollView>
    )
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
      contentContainerStyle={{ paddingTop: 10 }}
    >
      <Text style={{ color: colors.textMuted, fontSize: 14, marginBottom: 14 }}>
        {outings.length} {outings.length === 1 ? 'salida próxima' : 'salidas próximas'}
      </Text>

      {outings.map((outing) => (
        <GroupOutingCard key={outing.id} outing={outing} onRefresh={fetchOutings} />
      ))}
    </ScrollView>
  )
}
