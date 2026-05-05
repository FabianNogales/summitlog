import { useCallback, useEffect, useState } from 'react'
import { getPublishedRoutes } from '../services/route.service'
import type { RouteItem } from '../types/route'

export function usePublishedRoutes() {
  const [routes, setRoutes] = useState<RouteItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadRoutes = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const data = await getPublishedRoutes()
      setRoutes(data)
    } catch (err: any) {
      setError(err.message ?? 'No se pudieron cargar las rutas')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadRoutes()
  }, [loadRoutes])

  return {
    routes,
    loading,
    error,
    refreshRoutes: loadRoutes,
  }
}