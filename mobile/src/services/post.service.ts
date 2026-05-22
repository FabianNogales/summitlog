import { supabase } from '../lib/supabase'
import type { SocialPost, SocialPostAuthor } from '../types/post'

interface CreatePostInput {
  content: string
}

const FEED_POST_LIMIT = 20

function normalizeAuthor(author: unknown) {
  if (Array.isArray(author)) {
    return (author[0] ?? null) as SocialPostAuthor | null
  }

  if (author && typeof author === 'object') {
    return author as SocialPostAuthor
  }

  return null
}

export async function getPosts() {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      id,
      user_id,
      content,
      moderation_status,
      created_at,
      updated_at,
      author:profiles!posts_user_id_fkey(
        username,
        full_name,
        avatar_url
      )
    `)
    .eq('moderation_status', 'visible')
    .order('created_at', { ascending: false })
    .limit(FEED_POST_LIMIT)

  if (error) {
    throw new Error(error.message ?? 'No se pudo cargar el feed de publicaciones.')
  }

  const normalized = (data ?? []).map((post: any) => {
    const author = normalizeAuthor(post.author)

    return {
      id: post.id,
      user_id: post.user_id,
      content: post.content,
      moderation_status: post.moderation_status,
      created_at: post.created_at,
      updated_at: post.updated_at,
      author,
    } satisfies SocialPost
  })

  return normalized
}

export async function createPost(input: CreatePostInput) {
  const { data: authData, error: authError } = await supabase.auth.getUser()

  if (authError) {
    throw authError
  }

  const currentUser = authData.user
  if (!currentUser) {
    throw new Error('Debes iniciar sesion para crear una publicacion.')
  }

  const normalizedContent = input.content.trim()
  if (!normalizedContent) {
    throw new Error('El contenido de la publicacion es obligatorio.')
  }

  const { data, error } = await supabase
    .from('posts')
    .insert({
      user_id: currentUser.id,
      content: normalizedContent,
    })
    .select('*')
    .single()

  if (error) {
    throw new Error(
      error.message ?? 'No se pudo crear la publicacion social.'
    )
  }

  return data as SocialPost
}
