import { useCallback, useEffect, useState } from 'react'
import type { RouteItem, RoutePoint, RouteReport } from '../types/route'
import {
  getRecentRouteReportsByRouteId,
  getRouteById,
  getRoutePointsByRouteId,
} from '../services/route.service'

export function useRouteDetail(routeId?: string) {
  const [route, setRoute] = useState<RouteItem | null>(null)
  const [points, setPoints] = useState<RoutePoint[]>([])
  const [reports, setReports] = useState<RouteReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadRouteDetail = useCallback(async () => {
    if (!routeId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const [loadedRoute, loadedPoints, loadedReports] = await Promise.all([
        getRouteById(routeId),
        getRoutePointsByRouteId(routeId),
        getRecentRouteReportsByRouteId(routeId),
      ])

      setRoute(loadedRoute)
      setPoints(loadedPoints)
      setReports(loadedReports)
    } catch (err: any) {
      setError(err.message ?? 'No se pudo cargar el detalle de la ruta')
    } finally {
      setLoading(false)
    }
  }, [routeId])

  useEffect(() => {
    loadRouteDetail()
  }, [loadRouteDetail])

  return {
    route,
    points,
    reports,
    loading,
    error,
    refreshRouteDetail: loadRouteDetail,
  }
}