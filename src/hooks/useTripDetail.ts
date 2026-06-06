import { useCallback, useEffect, useState } from 'react'
import { useAuth } from './useAuth'
import {
  getTripDetailData,
  type TripDetailData,
} from '../services/tripDetail.service'

export function useTripDetail(tripId?: string) {
  const { user } = useAuth()

  const [detail, setDetail] = useState<TripDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadDetail = useCallback(
    async (isRefresh = false) => {
      if (!tripId) {
        setDetail(null)
        setError('No se encontró el recorrido.')
        setLoading(false)
        setRefreshing(false)
        return
      }

      if (!user) {
        setDetail(null)
        setError('Debes iniciar sesión.')
        setLoading(false)
        setRefreshing(false)
        return
      }

      try {
        if (isRefresh) {
          setRefreshing(true)
        } else {
          setLoading(true)
        }

        setError(null)

        const loadedDetail = await getTripDetailData(tripId, user.id)
        setDetail(loadedDetail)
      } catch (detailError: any) {
        setError(detailError?.message ?? 'No se pudo cargar el detalle del recorrido.')
        setDetail(null)
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [tripId, user]
  )

  useEffect(() => {
    loadDetail()
  }, [loadDetail])

  const refreshDetail = useCallback(() => loadDetail(true), [loadDetail])

  return {
    detail,
    loading,
    refreshing,
    error,
    refreshDetail,
  }
}
