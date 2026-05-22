import { supabase } from '../lib/supabase'
import type { ModerationContentReport } from '../types/moderation'

interface GetContentReportsOptions {
  status?: string
  limit?: number
}

const DEFAULT_REPORTS_LIMIT = 50

function normalizeReport(record: any): ModerationContentReport {
  return {
    id: record.id,
    reporter_user_id: record.reporter_user_id,
    target_type: record.target_type,
    target_id: record.target_id,
    reason: record.reason,
    description: record.description ?? null,
    status: record.status,
    created_at: record.created_at,
    updated_at: record.updated_at,
  }
}

function mapModerationError(error: any, fallback: string) {
  const code = error?.code as string | undefined

  if (code === '42501') {
    return 'No tienes permisos para moderar contenido.'
  }

  if (code === '22P02' || code === '23514') {
    return 'El estado indicado no es valido para el modelo actual.'
  }

  return error?.message ?? fallback
}

export async function getContentReports(options: GetContentReportsOptions = {}) {
  const limit = options.limit ?? DEFAULT_REPORTS_LIMIT

  let query = supabase
    .from('content_reports')
    .select(
      'id, reporter_user_id, target_type, target_id, reason, description, status, created_at, updated_at'
    )
    .order('created_at', { ascending: false })
    .limit(limit)

  if (options.status && options.status !== 'all') {
    query = query.eq('status', options.status)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(
      mapModerationError(error, 'No se pudieron cargar las denuncias de contenido.')
    )
  }

  return (data ?? []).map(normalizeReport)
}

export async function updateContentReportStatus(reportId: string, status: string) {
  const normalizedReportId = reportId?.trim()
  const normalizedStatus = status?.trim()

  if (!normalizedReportId) {
    throw new Error('No se encontro la denuncia a actualizar.')
  }

  if (!normalizedStatus) {
    throw new Error('El estado de denuncia es obligatorio.')
  }

  const { data, error } = await supabase
    .from('content_reports')
    .update({
      status: normalizedStatus,
    })
    .eq('id', normalizedReportId)
    .select(
      'id, reporter_user_id, target_type, target_id, reason, description, status, created_at, updated_at'
    )
    .single()

  if (error) {
    throw new Error(
      mapModerationError(error, 'No se pudo actualizar el estado de la denuncia.')
    )
  }

  return normalizeReport(data)
}
