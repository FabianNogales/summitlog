import { supabase } from '../lib/supabase'
import type { RouteReport } from '../types/route'

export const ROUTE_REPORT_TYPES = [
  'mud',
  'landslide',
  'closed',
  'danger',
  'broken_bridge',
  'bad_signage',
  'other',
] as const

export const ROUTE_REPORT_SEVERITIES = ['low', 'medium', 'high'] as const

export type RouteReportType = (typeof ROUTE_REPORT_TYPES)[number]
export type RouteReportSeverity = (typeof ROUTE_REPORT_SEVERITIES)[number]

export const MIN_ROUTE_REPORT_DESCRIPTION_LENGTH = 10
export const MAX_ROUTE_REPORT_DESCRIPTION_LENGTH = 500

interface CreateRouteReportInput {
  routeId: string
  reportType: RouteReportType
  reportStatus: RouteReportSeverity
  description: string
}

export async function getRouteReports(routeId: string) {
  const { data, error } = await supabase
    .from('route_reports')
    .select('*')
    .eq('route_id', routeId)
    .eq('moderation_status', 'visible')
    .eq('report_status', 'active')
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    throw error
  }

  return (data ?? []) as RouteReport[]
}

export async function createRouteReport(input: CreateRouteReportInput) {
  const { data: authData, error: authError } = await supabase.auth.getUser()

  if (authError) {
    throw authError
  }

  const currentUser = authData.user
  if (!currentUser) {
    throw new Error('Debes iniciar sesion para reportar una condicion.')
  }

  const normalizedDescription = input.description.trim()
  if (!normalizedDescription) {
    throw new Error('La descripcion del reporte es obligatoria.')
  }

  if (normalizedDescription.length < MIN_ROUTE_REPORT_DESCRIPTION_LENGTH) {
    throw new Error(
      `La descripcion debe tener al menos ${MIN_ROUTE_REPORT_DESCRIPTION_LENGTH} caracteres.`
    )
  }

  if (normalizedDescription.length > MAX_ROUTE_REPORT_DESCRIPTION_LENGTH) {
    throw new Error(
      `La descripcion no puede superar ${MAX_ROUTE_REPORT_DESCRIPTION_LENGTH} caracteres.`
    )
  }

  const { data, error } = await supabase
    .from('route_reports')
    .insert({
      route_id: input.routeId,
      user_id: currentUser.id,
      report_type: input.reportType,
      severity: input.reportStatus,
      description: normalizedDescription,
      latitude: null,
      longitude: null,
      photo_path: null,
      report_status: 'active',
      moderation_status: 'visible',
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error detallado de Supabase:', error)
    throw new Error(error.message ?? 'No se pudo crear el reporte de condicion para la ruta.')
  }

  return data as RouteReport
}

export async function resolveRouteReport(reportId: string): Promise<void> {
  const { error } = await supabase
    .from('route_reports')
    .update({ report_status: 'resolved' })
    .eq('id', reportId)

  if (error) {
    throw new Error(error.message ?? 'No se pudo marcar el reporte como resuelto.')
  }
}
