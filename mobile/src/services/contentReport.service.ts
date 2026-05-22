import { supabase } from '../lib/supabase'
import {
  CONTENT_REPORT_REASONS,
  CONTENT_REPORT_TARGET_TYPES,
  type ContentReport,
  type ContentReportReason,
  type ContentReportTargetType,
} from '../types/contentReport'

interface CreateContentReportInput {
  targetType: ContentReportTargetType
  targetId: string
  reason: ContentReportReason
  description?: string | null
}

const MAX_REPORT_DESCRIPTION_LENGTH = 600

function normalizeContentReport(record: any): ContentReport {
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

function isValidTargetType(value: string): value is ContentReportTargetType {
  return CONTENT_REPORT_TARGET_TYPES.includes(value as ContentReportTargetType)
}

function isValidReason(value: string): value is ContentReportReason {
  return CONTENT_REPORT_REASONS.includes(value as ContentReportReason)
}

function mapReportErrorMessage(error: any) {
  const code = error?.code as string | undefined
  const message = (error?.message as string | undefined)?.toLowerCase() ?? ''

  if (code === '42501') {
    return 'No tienes permisos para denunciar este contenido.'
  }

  if (code === '23505') {
    return 'Ya enviaste una denuncia para este contenido.'
  }

  if (code === '22P02' || code === '23514') {
    return 'Los datos de la denuncia no son validos para el modelo actual.'
  }

  if (message.includes('invalid input value for enum')) {
    return 'El motivo seleccionado no es compatible con la configuracion actual.'
  }

  return error?.message ?? 'No se pudo enviar la denuncia de contenido.'
}

export async function createContentReport(input: CreateContentReportInput) {
  const targetType = input.targetType?.trim()
  const targetId = input.targetId?.trim()
  const reason = input.reason?.trim()
  const normalizedDescription = input.description?.trim() || null

  if (!targetType || !isValidTargetType(targetType)) {
    throw new Error('El tipo de contenido a denunciar no es valido.')
  }

  if (!targetId) {
    throw new Error('No se encontro el contenido a denunciar.')
  }

  if (!reason || !isValidReason(reason)) {
    throw new Error('Selecciona un motivo de denuncia valido.')
  }

  if (
    normalizedDescription &&
    normalizedDescription.length > MAX_REPORT_DESCRIPTION_LENGTH
  ) {
    throw new Error(
      `La descripcion de la denuncia no puede superar ${MAX_REPORT_DESCRIPTION_LENGTH} caracteres.`
    )
  }

  const { data: authData, error: authError } = await supabase.auth.getUser()

  if (authError) {
    throw authError
  }

  const currentUser = authData.user
  if (!currentUser) {
    throw new Error('Debes iniciar sesion para denunciar contenido.')
  }

  const { data, error } = await supabase
    .from('content_reports')
    .insert({
      reporter_user_id: currentUser.id,
      target_type: targetType,
      target_id: targetId,
      reason,
      description: normalizedDescription,
    })
    .select(
      'id, reporter_user_id, target_type, target_id, reason, description, status, created_at, updated_at'
    )
    .single()

  if (error) {
    throw new Error(mapReportErrorMessage(error))
  }

  return normalizeContentReport(data)
}
