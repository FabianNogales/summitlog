import { useCallback, useEffect, useRef, useState } from 'react'
import { getPublishedRoutes } from '../services/route.service'
import type { RouteItem } from '../types/route'

export function usePublishedRoutes() {
  const [routes, setRoutes] = useState<RouteItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const loadRequestIdRef = useRef(0)

  const loadRoutes = useCallback(async () => {
    const requestId = loadRequestIdRef.current + 1
    loadRequestIdRef.current = requestId

    try {
      setLoading(true)
      setError(null)

      const data = await getPublishedRoutes()

      if (loadRequestIdRef.current !== requestId) {
        return
      }

      setRoutes(data)
    } catch (err: any) {
      if (loadRequestIdRef.current !== requestId) {
        return
      }

      setError(err.message ?? 'No se pudieron cargar las rutas')
    } finally {
      if (loadRequestIdRef.current === requestId) {
        setLoading(false)
      }
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
