import { useCallback, useEffect, useRef, useState } from 'react'
import type { RouteItem, RoutePoint, RouteReport } from '../types/route'
import {
  getRouteById,
  getRoutePointsByRouteId,
} from '../services/route.service'
import { getRouteReports } from '../services/routeReport.service' 

function isValidRouteId(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  )
}

export function useRouteDetail(routeId?: string) {
  const [route, setRoute] = useState<RouteItem | null>(null)
  const [points, setPoints] = useState<RoutePoint[]>([])
  const [reports, setReports] = useState<RouteReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pointsError, setPointsError] = useState<string | null>(null)
  const [reportsError, setReportsError] = useState<string | null>(null)
  const [pointsLoading, setPointsLoading] = useState(false)
  const [reportsLoading, setReportsLoading] = useState(false)
  const loadRequestIdRef = useRef(0)

  const loadRouteDetail = useCallback(async () => {
    const requestId = loadRequestIdRef.current + 1
    loadRequestIdRef.current = requestId

    if (!routeId) {
      setRoute(null)
      setPoints([])
      setReports([])
      setError('No se encontró el identificador de la ruta.')
      setPointsError(null)
      setReportsError(null)
      setPointsLoading(false)
      setReportsLoading(false)
      setLoading(false)
      return
    }

    if (!isValidRouteId(routeId)) {
      setRoute(null)
      setPoints([])
      setReports([])
      setError('El identificador de la ruta no es valido.')
      setPointsError(null)
      setReportsError(null)
      setPointsLoading(false)
      setReportsLoading(false)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      setPointsError(null)
      setReportsError(null)
      setPointsLoading(true)
      setReportsLoading(true)

      const loadedRoute = await getRouteById(routeId)

      if (loadRequestIdRef.current !== requestId) {
        return
      }

      setRoute(loadedRoute)
    } catch (err: any) {
      if (loadRequestIdRef.current !== requestId) {
        return
      }

      setRoute(null)
      setPoints([])
      setReports([])
      setError(err.message ?? 'No se pudo cargar el detalle de la ruta')
      setPointsLoading(false)
      setReportsLoading(false)
      return
    } finally {
      if (loadRequestIdRef.current === requestId) {
        setLoading(false)
      }
    }

    const [pointsResult, reportsResult] = await Promise.allSettled([
      getRoutePointsByRouteId(routeId),
      getRouteReports(routeId),
    ])

    if (loadRequestIdRef.current !== requestId) {
      return
    }

    if (pointsResult.status === 'fulfilled') {
      setPoints(pointsResult.value)
      setPointsLoading(false)
    } else {
      setPoints([])
      setPointsError(
        pointsResult.reason?.message ?? 'No se pudo cargar el trazado de la ruta.'
      )
      setPointsLoading(false)
    }

    if (reportsResult.status === 'fulfilled') {
      setReports(reportsResult.value)
      setReportsLoading(false)
    } else {
      setReports([])
      setReportsError(
        reportsResult.reason?.message ?? 'No se pudieron cargar los reportes de la ruta.'
      )
      setReportsLoading(false)
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
    pointsLoading,
    pointsError,
    reportsLoading,
    reportsError,
    refreshRouteDetail: loadRouteDetail,
  }
}
