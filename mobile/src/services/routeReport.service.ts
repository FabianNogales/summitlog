import { supabase } from '../lib/supabase'
import type { RouteReport } from '../types/route'
import * as FileSystem from 'expo-file-system/legacy'
import { decode as decodeBase64 } from 'base64-arraybuffer'

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
export const ROUTE_REPORT_MEDIA_BUCKET = 'route-report-media'
export const MAX_ROUTE_REPORT_IMAGE_SIZE_MB = 10
export const MAX_ROUTE_REPORT_IMAGE_SIZE_BYTES = MAX_ROUTE_REPORT_IMAGE_SIZE_MB * 1024 * 1024

const SUPPORTED_MIME_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png'])
const SUPPORTED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png'])

interface CreateRouteReportInput {
  routeId: string
  reportType: RouteReportType
  reportStatus: RouteReportSeverity
  description: string
  photo?: {
    fileUri: string
    fileName?: string | null
    mimeType?: string | null
    fileSize?: number | null
  }
}

function getExtensionFromName(fileName?: string | null) {
  return fileName?.split('.').pop()?.toLowerCase() ?? null
}

function isSupportedImage(mimeType?: string | null, fileName?: string | null) {
  const normalizedMime = mimeType?.toLowerCase() ?? ''
  const extension = getExtensionFromName(fileName)

  if (normalizedMime && SUPPORTED_MIME_TYPES.has(normalizedMime)) {
    return true
  }

  if (extension && SUPPORTED_EXTENSIONS.has(extension)) {
    return true
  }

  return false
}

function resolveContentType(mimeType?: string | null, extension?: string | null) {
  const normalizedMime = mimeType?.toLowerCase()

  if (normalizedMime === 'image/png') {
    return 'image/png'
  }

  if (normalizedMime === 'image/jpeg' || normalizedMime === 'image/jpg') {
    return 'image/jpeg'
  }

  if (extension === 'png') {
    return 'image/png'
  }

  return 'image/jpeg'
}

function mapUploadError(error: unknown) {
  const message = error instanceof Error ? error.message : 'No se pudo subir la foto del reporte.'
  const normalized = message.toLowerCase()

  if (normalized.includes('bucket') && normalized.includes('not found')) {
    return `No se encontro el bucket de fotos para reportes (${ROUTE_REPORT_MEDIA_BUCKET}).`
  }

  if (
    normalized.includes('row-level security') ||
    normalized.includes('permission denied') ||
    normalized.includes('not allowed')
  ) {
    return 'No tienes permisos para subir fotos de reportes.'
  }

  if (normalized.includes('network')) {
    return 'No se pudo subir la foto del reporte por un problema de red.'
  }

  return message
}

async function uploadRouteReportPhoto(params: {
  routeId: string
  userId: string
  fileUri: string
  fileName?: string | null
  mimeType?: string | null
}) {
  const extension =
    getExtensionFromName(params.fileName) ||
    (params.mimeType?.toLowerCase().includes('png') ? 'png' : 'jpg')

  const filePath = `${params.userId}/${params.routeId}/${Date.now()}.${extension}`
  const contentType = resolveContentType(params.mimeType, extension)
  let base64Content: string
  let arrayBuffer: ArrayBuffer

  try {
    base64Content = await FileSystem.readAsStringAsync(params.fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    })
  } catch {
    throw new Error('No se pudo leer el archivo de imagen seleccionado.')
  }

  try {
    arrayBuffer = decodeBase64(base64Content)
    if (!arrayBuffer.byteLength) {
      throw new Error('empty-array-buffer')
    }
  } catch {
    throw new Error('No se pudo convertir la imagen seleccionada.')
  }

  const { error } = await supabase.storage
    .from(ROUTE_REPORT_MEDIA_BUCKET)
    .upload(filePath, arrayBuffer, {
      contentType,
      upsert: false,
    })

  if (error) {
    throw error
  }

  return filePath
}

export function getRouteReportPhotoPublicUrl(filePath?: string | null) {
  const normalizedPath = filePath?.trim() ?? ''
  if (!normalizedPath) {
    return ''
  }

  if (normalizedPath.startsWith('http://') || normalizedPath.startsWith('https://')) {
    return normalizedPath
  }

  const { data } = supabase.storage
    .from(ROUTE_REPORT_MEDIA_BUCKET)
    .getPublicUrl(normalizedPath)
  return data.publicUrl
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

  let uploadedPhotoPath: string | null = null

  if (input.photo) {
    if (!isSupportedImage(input.photo.mimeType, input.photo.fileName)) {
      throw new Error('Solo se permiten imagenes JPG o PNG para reportes.')
    }

    if ((input.photo.fileSize ?? 0) > MAX_ROUTE_REPORT_IMAGE_SIZE_BYTES) {
      throw new Error(
        `La foto del reporte debe pesar menos de ${MAX_ROUTE_REPORT_IMAGE_SIZE_MB} MB.`
      )
    }

    try {
      uploadedPhotoPath = await uploadRouteReportPhoto({
        routeId: input.routeId,
        userId: currentUser.id,
        fileUri: input.photo.fileUri,
        fileName: input.photo.fileName ?? null,
        mimeType: input.photo.mimeType ?? null,
      })
    } catch (uploadError) {
      throw new Error(mapUploadError(uploadError))
    }
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
      photo_path: uploadedPhotoPath,
      report_status: 'active',
      moderation_status: 'visible',
    })
    .select('*')
    .single()

  if (error) {
    if (uploadedPhotoPath) {
      await supabase.storage
        .from(ROUTE_REPORT_MEDIA_BUCKET)
        .remove([uploadedPhotoPath])
        .catch(() => null)
    }
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
