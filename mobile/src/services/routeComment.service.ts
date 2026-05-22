import { supabase } from '../lib/supabase'
import type { SocialPostAuthor } from '../types/post'
import type { RouteComment } from '../types/routeComment'

interface CreateRouteCommentInput {
  routeId: string
  content: string
}

const MIN_ROUTE_COMMENT_LENGTH = 3

function normalizeAuthor(author: unknown) {
  if (Array.isArray(author)) {
    return (author[0] ?? null) as SocialPostAuthor | null
  }

  if (author && typeof author === 'object') {
    return author as SocialPostAuthor
  }

  return null
}

function normalizeRouteCommentRecord(record: any): RouteComment {
  const author = normalizeAuthor(record.author)

  return {
    id: record.id,
    route_id: record.route_id ?? null,
    post_id: record.post_id ?? null,
    user_id: record.user_id,
    content: record.content,
    moderation_status: record.moderation_status,
    created_at: record.created_at,
    updated_at: record.updated_at,
    author,
  }
}

export async function getRouteComments(routeId: string) {
  if (!routeId) {
    throw new Error('No se encontro la ruta para cargar comentarios.')
  }

  const { data, error } = await supabase
    .from('comments')
    .select(`
      id,
      route_id,
      post_id,
      user_id,
      content,
      moderation_status,
      created_at,
      updated_at,
      author:profiles!comments_user_id_fkey(
        username,
        full_name,
        avatar_url
      )
    `)
    .eq('route_id', routeId)
    .is('post_id', null)
    .eq('moderation_status', 'visible')
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(
      error.message ?? 'No se pudieron cargar los comentarios de la ruta.'
    )
  }

  return (data ?? []).map(normalizeRouteCommentRecord)
}

export async function createRouteComment(input: CreateRouteCommentInput) {
  const routeId = input.routeId?.trim()
  const normalizedContent = input.content?.trim()

  if (!routeId) {
    throw new Error('No se encontro la ruta para comentar.')
  }

  if (!normalizedContent) {
    throw new Error('El comentario es obligatorio.')
  }

  if (normalizedContent.length < MIN_ROUTE_COMMENT_LENGTH) {
    throw new Error(
      `El comentario debe tener al menos ${MIN_ROUTE_COMMENT_LENGTH} caracteres.`
    )
  }

  const { data: authData, error: authError } = await supabase.auth.getUser()

  if (authError) {
    throw authError
  }

  const currentUser = authData.user
  if (!currentUser) {
    throw new Error('Debes iniciar sesion para comentar rutas.')
  }

  const { data, error } = await supabase
    .from('comments')
    .insert({
      route_id: routeId,
      post_id: null,
      user_id: currentUser.id,
      content: normalizedContent,
    })
    .select(`
      id,
      route_id,
      post_id,
      user_id,
      content,
      moderation_status,
      created_at,
      updated_at,
      author:profiles!comments_user_id_fkey(
        username,
        full_name,
        avatar_url
      )
    `)
    .single()

  if (error) {
    throw new Error(
      error.message ?? 'No se pudo crear el comentario de la ruta.'
    )
  }

  return normalizeRouteCommentRecord(data)
}
