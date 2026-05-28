import { supabase } from '../lib/supabase'
import type { ModerationContentReport } from '../types/moderation'

interface GetContentReportsOptions {
  status?: string
  limit?: number
}

const DEFAULT_REPORTS_LIMIT = 50
const DEFAULT_MANAGED_STATUS = 'resolved'
const HIDDEN_MODERATION_STATUS = 'hidden'
const HIDDEN_ROUTE_PUBLICATION_STATUS = 'archived'

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

function normalizeTargetType(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? ''
}

async function hidePostById(postId: string) {
  const { data, error } = await supabase
    .from('posts')
    .update({
      moderation_status: HIDDEN_MODERATION_STATUS,
    })
    .eq('id', postId)
    .select('id')
    .maybeSingle()

  if (error) {
    throw new Error(mapModerationError(error, 'No se pudo ocultar la publicacion denunciada.'))
  }

  if (!data) {
    throw new Error('No se encontro la publicacion denunciada o no tienes permisos para ocultarla.')
  }
}

async function hideCommentById(commentId: string) {
  const { data, error } = await supabase
    .from('comments')
    .update({
      moderation_status: HIDDEN_MODERATION_STATUS,
    })
    .eq('id', commentId)
    .select('id')
    .maybeSingle()

  if (error) {
    throw new Error(mapModerationError(error, 'No se pudo ocultar el comentario denunciado.'))
  }

  if (!data) {
    throw new Error('No se encontro el comentario denunciado o no tienes permisos para ocultarlo.')
  }
}

async function hideRouteById(routeId: string) {
  const { data, error } = await supabase
    .from('routes')
    .update({
      publication_status: HIDDEN_ROUTE_PUBLICATION_STATUS,
    })
    .eq('id', routeId)
    .select('id')
    .maybeSingle()

  if (error) {
    throw new Error(mapModerationError(error, 'No se pudo ocultar la ruta denunciada.'))
  }

  if (!data) {
    throw new Error('No se encontro la ruta denunciada o no tienes permisos para ocultarla.')
  }
}

async function hideReportedTarget(report: ModerationContentReport) {
  const targetType = normalizeTargetType(report.target_type)
  const targetId = report.target_id?.trim()

  if (!targetId) {
    throw new Error('No se encontro el contenido denunciado para ocultar.')
  }

  if (targetType === 'post') {
    await hidePostById(targetId)
    return
  }

  if (targetType === 'comment') {
    await hideCommentById(targetId)
    return
  }

  if (targetType === 'route') {
    await hideRouteById(targetId)
    return
  }

  throw new Error(`El tipo de contenido "${report.target_type}" no soporta ocultamiento.`)
}

export async function hideReportedContentAndManageReport(
  report: ModerationContentReport,
  nextStatus?: string
) {
  const reportId = report.id?.trim()
  const managedStatus = nextStatus?.trim() || DEFAULT_MANAGED_STATUS

  if (!reportId) {
    throw new Error('No se encontro la denuncia a gestionar.')
  }

  await hideReportedTarget(report)

  try {
    return await updateContentReportStatus(reportId, managedStatus)
  } catch (error: any) {
    throw new Error(
      error?.message
        ? `El contenido se oculto, pero no se pudo actualizar el estado de la denuncia: ${error.message}`
        : 'El contenido se oculto, pero no se pudo actualizar el estado de la denuncia.'
    )
  }
}
