import { supabase } from '../lib/supabase'
import type { SocialPost, SocialPostAuthor, SocialPostMedia } from '../types/post'
import * as FileSystem from 'expo-file-system/legacy'
import { decode as decodeBase64 } from 'base64-arraybuffer'

interface CreatePostInput {
  content: string
  image?: {
    fileUri: string
    fileName?: string | null
    mimeType?: string | null
    fileSize?: number | null
  }
}

interface CreatePostResult {
  post: SocialPost
  imageStatus: 'none' | 'uploaded' | 'failed_after_post'
  imageError?: string
}

const FEED_POST_LIMIT = 20
const POST_MEDIA_BUCKET = 'post-media'
const MAX_POST_IMAGE_SIZE_MB = 10
const MAX_POST_IMAGE_SIZE_BYTES = MAX_POST_IMAGE_SIZE_MB * 1024 * 1024
const SUPPORTED_MIME_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png'])
const SUPPORTED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png'])

function normalizeAuthor(author: unknown) {
  if (Array.isArray(author)) {
    return (author[0] ?? null) as SocialPostAuthor | null
  }

  if (author && typeof author === 'object') {
    return author as SocialPostAuthor
  }

  return null
}

function normalizeMedia(media: unknown): SocialPostMedia[] {
  if (!Array.isArray(media)) {
    return []
  }

  return media
    .filter((item) => item && typeof item === 'object')
    .map((item: any) => ({
      id: item.id,
      post_id: item.post_id,
      file_path: item.file_path,
      file_type: item.file_type,
      sort_order: item.sort_order,
      created_at: item.created_at,
    }))
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
  const message = error instanceof Error ? error.message : 'No se pudo subir la imagen.'
  const normalized = message.toLowerCase()

  if (normalized.includes('bucket') && normalized.includes('not found')) {
    return 'No se encontro el bucket de imagenes para publicaciones (post-media).'
  }

  if (
    normalized.includes('row-level security') ||
    normalized.includes('permission denied') ||
    normalized.includes('not allowed')
  ) {
    return 'No tienes permisos para subir imagenes en publicaciones.'
  }

  if (normalized.includes('network')) {
    return 'No se pudo subir la imagen por un problema de red.'
  }

  return message
}

async function uploadPostImage(params: {
  fileUri: string
  userId: string
  fileName?: string | null
  mimeType?: string | null
}) {
  const extension =
    getExtensionFromName(params.fileName) ||
    (params.mimeType?.toLowerCase().includes('png') ? 'png' : 'jpg')

  const filePath = `${params.userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`
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

  const { error } = await supabase.storage.from(POST_MEDIA_BUCKET).upload(filePath, arrayBuffer, {
    contentType,
    upsert: false,
  })

  if (error) {
    throw error
  }

  return filePath
}

export function getPostMediaPublicUrl(filePath?: string | null) {
  const normalizedPath = filePath?.trim() ?? ''
  if (!normalizedPath) {
    return ''
  }

  if (normalizedPath.startsWith('http://') || normalizedPath.startsWith('https://')) {
    return normalizedPath
  }

  const { data } = supabase.storage.from(POST_MEDIA_BUCKET).getPublicUrl(normalizedPath)
  return data.publicUrl
}

export async function getPosts() {
  const { data, error } = await supabase
    .from('posts')
    .select(
      `
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
      ),
      media:post_media(
        id,
        post_id,
        file_path,
        file_type,
        sort_order,
        created_at
      )
    `
    )
    .eq('moderation_status', 'visible')
    .order('created_at', { ascending: false })
    .limit(FEED_POST_LIMIT)

  if (error) {
    throw new Error(error.message ?? 'No se pudo cargar el feed de publicaciones.')
  }

  return (data ?? []).map((post: any) => {
    const author = normalizeAuthor(post.author)
    const media = normalizeMedia(post.media)

    return {
      id: post.id,
      user_id: post.user_id,
      content: post.content,
      moderation_status: post.moderation_status,
      created_at: post.created_at,
      updated_at: post.updated_at,
      author,
      media,
    } satisfies SocialPost
  })
}

export async function createPost(input: CreatePostInput): Promise<CreatePostResult> {
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

  let uploadedFilePath: string | null = null

  if (input.image) {
    if (!isSupportedImage(input.image.mimeType, input.image.fileName)) {
      throw new Error('Solo se permiten imagenes JPG o PNG para publicaciones.')
    }

    if ((input.image.fileSize ?? 0) > MAX_POST_IMAGE_SIZE_BYTES) {
      throw new Error(`La imagen debe pesar menos de ${MAX_POST_IMAGE_SIZE_MB} MB.`)
    }

    try {
      uploadedFilePath = await uploadPostImage({
        fileUri: input.image.fileUri,
        userId: currentUser.id,
        fileName: input.image.fileName ?? null,
        mimeType: input.image.mimeType ?? null,
      })
    } catch (uploadError) {
      throw new Error(mapUploadError(uploadError))
    }
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
    if (uploadedFilePath) {
      await supabase.storage.from(POST_MEDIA_BUCKET).remove([uploadedFilePath]).catch(() => null)
    }

    throw new Error(error.message ?? 'No se pudo crear la publicacion social.')
  }

  const createdPost = data as SocialPost

  if (!uploadedFilePath) {
    return {
      post: {
        ...createdPost,
        media: [],
      },
      imageStatus: 'none',
    }
  }

  const { data: mediaData, error: mediaError } = await supabase
    .from('post_media')
    .insert({
      post_id: createdPost.id,
      file_path: uploadedFilePath,
      file_type: 'image',
      sort_order: 0,
    })
    .select('id, post_id, file_path, file_type, sort_order, created_at')
    .single()

  if (mediaError) {
    await supabase.storage.from(POST_MEDIA_BUCKET).remove([uploadedFilePath]).catch(() => null)

    return {
      post: {
        ...createdPost,
        media: [],
      },
      imageStatus: 'failed_after_post',
      imageError:
        mediaError.message ?? 'La publicacion se creo, pero no se pudo asociar la imagen.',
    }
  }

  return {
    post: {
      ...createdPost,
      media: [mediaData as SocialPostMedia],
    },
    imageStatus: 'uploaded',
  }
}
