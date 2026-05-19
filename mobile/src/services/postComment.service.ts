import { supabase } from '../lib/supabase'
import type { SocialPostAuthor } from '../types/post'
import type { SocialPostComment } from '../types/postComment'

interface CreatePostCommentInput {
  postId: string
  content: string
}

const MIN_COMMENT_LENGTH = 3

function normalizeCommentRecord(record: any): SocialPostComment {
  const authorArray = Array.isArray(record.author) ? record.author : []
  const author = (authorArray[0] ?? null) as SocialPostAuthor | null

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
    throw new Error(
      error.message ?? 'No se pudieron cargar los comentarios de la publicacion.'
    )
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
    throw new Error(
      `El comentario debe tener al menos ${MIN_COMMENT_LENGTH} caracteres.`
    )
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
    throw new Error(
      error.message ?? 'No se pudo crear el comentario de la publicacion.'
    )
  }

  return normalizeCommentRecord(data)
}
