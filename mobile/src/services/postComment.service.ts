import { supabase } from '../lib/supabase'
import type { SocialPostAuthor } from '../types/post'
import type { SocialPostComment } from '../types/postComment'

interface CreatePostCommentInput {
  postId: string
  content: string
}

const MIN_COMMENT_LENGTH = 3
export const MAX_POST_COMMENT_LENGTH = 300

function normalizeAuthor(author: unknown) {
  if (Array.isArray(author)) {
    return (author[0] ?? null) as SocialPostAuthor | null
  }

  if (author && typeof author === 'object') {
    return author as SocialPostAuthor
  }

  return null
}

function normalizeCommentRecord(record: any): SocialPostComment {
  const author = normalizeAuthor(record.author)

  return {
    id: record.id,
    post_id: record.post_id,
    route_id: record.route_id ?? null,
    user_id: record.user_id,
    content: record.content,
    moderation_status: record.moderation_status,
    created_at: record.created_at,
    updated_at: record.updated_at,
    author,
  }
}

export async function getPostComments(postId: string) {
  if (!postId) {
    throw new Error('No se encontro la publicacion para cargar comentarios.')
  }

  const { data, error } = await supabase
    .from('comments')
    .select(`
      id,
      post_id,
      route_id,
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
    .eq('post_id', postId)
    .eq('moderation_status', 'visible')
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(error.message ?? 'No se pudieron cargar los comentarios de la publicacion.')
  }

  return (data ?? []).map(normalizeCommentRecord)
}

export async function createPostComment(input: CreatePostCommentInput) {
  const postId = input.postId?.trim()
  const normalizedContent = input.content?.trim()

  if (!postId) {
    throw new Error('No se encontro la publicacion para comentar.')
  }

  if (!normalizedContent) {
    throw new Error('El comentario es obligatorio.')
  }

  if (normalizedContent.length < MIN_COMMENT_LENGTH) {
    throw new Error(`El comentario debe tener al menos ${MIN_COMMENT_LENGTH} caracteres.`)
  }

  if (normalizedContent.length > MAX_POST_COMMENT_LENGTH) {
    throw new Error(`El comentario no puede superar ${MAX_POST_COMMENT_LENGTH} caracteres.`)
  }

  const { data: authData, error: authError } = await supabase.auth.getUser()

  if (authError) {
    throw authError
  }

  const currentUser = authData.user
  if (!currentUser) {
    throw new Error('Debes iniciar sesion para comentar publicaciones.')
  }

  const { data, error } = await supabase
    .from('comments')
    .insert({
      post_id: postId,
      user_id: currentUser.id,
      content: normalizedContent,
    })
    .select(`
      id,
      post_id,
      route_id,
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
    const message = error.message?.toLowerCase() ?? ''
    if (message.includes('violates row-level security') || message.includes('permission')) {
      throw new Error('La publicacion ya no esta disponible para comentar.')
    }

    throw new Error(error.message ?? 'No se pudo crear el comentario de la publicacion.')
  }

  return normalizeCommentRecord(data)
}

export async function hideOwnPostComment(
  commentId: string,
  userId: string
): Promise<void> {
  const normalizedCommentId = commentId?.trim()
  const normalizedUserId = userId?.trim()

  if (!normalizedCommentId) {
    throw new Error('No se encontro el comentario para eliminar.')
  }

  if (!normalizedUserId) {
    throw new Error('Debes iniciar sesion para eliminar un comentario.')
  }

  const { data: authData, error: authError } = await supabase.auth.getUser()

  if (authError) {
    throw authError
  }

  if (!authData.user || authData.user.id !== normalizedUserId) {
    throw new Error('No tienes permisos para eliminar este comentario.')
  }

  const { data, error } = await supabase
    .from('comments')
    .update({
      moderation_status: 'hidden',
      updated_at: new Date().toISOString(),
    })
    .eq('id', normalizedCommentId)
    .eq('user_id', normalizedUserId)
    .select('id')
    .maybeSingle()

  if (error) {
    throw new Error(error.message ?? 'No se pudo eliminar el comentario.')
  }

  if (!data) {
    throw new Error('No tienes permisos para eliminar este comentario.')
  }
}
