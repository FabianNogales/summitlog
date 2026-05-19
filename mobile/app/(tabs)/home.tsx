import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useAuth } from '../../src/hooks/useAuth'
import { colors } from '../../src/theme/colors'
import { AuthButton } from '../../src/components/auth/AuthButton'
import { createPost, getPosts } from '../../src/services/post.service'
import type { SocialPost } from '../../src/types/post'
import {
  createPostComment,
  getPostComments,
} from '../../src/services/postComment.service'
import type { SocialPostComment } from '../../src/types/postComment'

export default function HomeScreen() {
  const { profile, user } = useAuth()
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [posts, setPosts] = useState<SocialPost[]>([])
  const [feedLoading, setFeedLoading] = useState(true)
  const [refreshingFeed, setRefreshingFeed] = useState(false)
  const [feedError, setFeedError] = useState<string | null>(null)
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null)
  const [commentsByPostId, setCommentsByPostId] = useState<
    Record<string, SocialPostComment[]>
  >({})
  const [commentsLoadingByPostId, setCommentsLoadingByPostId] = useState<
    Record<string, boolean>
  >({})
  const [commentsErrorByPostId, setCommentsErrorByPostId] = useState<
    Record<string, string | null>
  >({})
  const [commentInputByPostId, setCommentInputByPostId] = useState<
    Record<string, string>
  >({})
  const [commentSubmittingByPostId, setCommentSubmittingByPostId] = useState<
    Record<string, boolean>
  >({})

  const trimmedContent = content.trim()
  const contentTooShort = trimmedContent.length > 0 && trimmedContent.length < 10

  const loadPosts = useCallback(async () => {
    try {
      setFeedError(null)
      const loadedPosts = await getPosts()
      setPosts(loadedPosts)
    } catch (error: any) {
      setFeedError(error?.message ?? 'No se pudo cargar el feed de publicaciones.')
      setPosts([])
    }
  }, [])

  useEffect(() => {
    async function bootstrapFeed() {
      try {
        setFeedLoading(true)
        await loadPosts()
      } finally {
        setFeedLoading(false)
      }
    }

    bootstrapFeed()
  }, [loadPosts])

  async function handleRefreshFeed() {
    try {
      setRefreshingFeed(true)
      await loadPosts()
    } finally {
      setRefreshingFeed(false)
    }
  }

  const hasFeedData = useMemo(() => posts.length > 0, [posts])

  const loadCommentsForPost = useCallback(
    async (postId: string, force = false) => {
      if (!postId) return
      if (!force && commentsByPostId[postId]) return

      setCommentsLoadingByPostId((prev) => ({ ...prev, [postId]: true }))
      setCommentsErrorByPostId((prev) => ({ ...prev, [postId]: null }))

      try {
        const loadedComments = await getPostComments(postId)
        setCommentsByPostId((prev) => ({ ...prev, [postId]: loadedComments }))
      } catch (error: any) {
        setCommentsErrorByPostId((prev) => ({
          ...prev,
          [postId]:
            error?.message ??
            'No se pudieron cargar los comentarios de la publicacion.',
        }))
      } finally {
        setCommentsLoadingByPostId((prev) => ({ ...prev, [postId]: false }))
      }
    },
    [commentsByPostId]
  )

  async function handleToggleComments(postId: string) {
    if (expandedPostId === postId) {
      setExpandedPostId(null)
      return
    }

    setExpandedPostId(postId)
    await loadCommentsForPost(postId)
  }

  function updateCommentInput(postId: string, value: string) {
    setCommentInputByPostId((prev) => ({
      ...prev,
      [postId]: value,
    }))
  }

  async function handleCreateComment(postId: string) {
    if (!postId) {
      return
    }

    if (!user) {
      Alert.alert('Inicia sesion', 'Debes iniciar sesion para comentar publicaciones.')
      return
    }

    const contentValue = (commentInputByPostId[postId] ?? '').trim()
    if (contentValue.length < 3) {
      setCommentsErrorByPostId((prev) => ({
        ...prev,
        [postId]: 'El comentario debe tener al menos 3 caracteres.',
      }))
      return
    }

    if (commentSubmittingByPostId[postId]) {
      return
    }

    try {
      setCommentSubmittingByPostId((prev) => ({ ...prev, [postId]: true }))
      setCommentsErrorByPostId((prev) => ({ ...prev, [postId]: null }))
      await createPostComment({
        postId,
        content: contentValue,
      })
      updateCommentInput(postId, '')
      await loadCommentsForPost(postId, true)
    } catch (error: any) {
      setCommentsErrorByPostId((prev) => ({
        ...prev,
        [postId]:
          error?.message ?? 'No se pudo crear el comentario de la publicacion.',
      }))
    } finally {
      setCommentSubmittingByPostId((prev) => ({ ...prev, [postId]: false }))
    }
  }

  async function handleCreatePost() {
    if (!user) {
      Alert.alert('Inicia sesion', 'Debes iniciar sesion para crear una publicacion.')
      return
    }

    if (trimmedContent.length < 10) {
      setSubmitError('La publicacion debe tener al menos 10 caracteres.')
      return
    }

    try {
      setSubmitting(true)
      setSubmitError(null)
      await createPost({ content: trimmedContent })
      setContent('')
      await loadPosts()
      Alert.alert('Publicacion creada', 'Tu publicacion social se guardo correctamente.')
    } catch (error: any) {
      setSubmitError(
        error?.message ?? 'No se pudo crear la publicacion social.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <Text
          style={{
            color: colors.text,
            fontSize: 28,
            fontWeight: '700',
            marginBottom: 12,
          }}
        >
          Bienvenido a SummitLog
        </Text>

        <Text
          style={{
            color: colors.textSecondary,
            fontSize: 16,
            marginBottom: 20,
          }}
        >
          {profile?.username
            ? `Sesion iniciada como @${profile.username}`
            : 'Sesion iniciada correctamente'}
        </Text>

        <View
          style={{
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 18,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <Text
            style={{
              color: colors.text,
              fontSize: 18,
              fontWeight: '700',
              marginBottom: 8,
            }}
          >
            Crear publicacion social
          </Text>

          <Text
            style={{
              color: colors.textSecondary,
              fontSize: 13,
              marginBottom: 12,
            }}
          >
            Comparte experiencias o recomendaciones para la comunidad.
          </Text>

          <TextInput
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
            placeholder="Escribe tu publicacion..."
            placeholderTextColor={colors.placeholder}
            style={{
              minHeight: 120,
              backgroundColor: colors.cardSecondary,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              color: colors.text,
              paddingHorizontal: 12,
              paddingVertical: 10,
              marginBottom: 8,
            }}
          />

          <Text
            style={{
              color: contentTooShort ? colors.danger : colors.textSecondary,
              fontSize: 12,
              marginBottom: 10,
            }}
          >
            Minimo 10 caracteres.
          </Text>

          {submitError ? (
            <Text
              style={{
                color: colors.danger,
                marginBottom: 10,
              }}
            >
              {submitError}
            </Text>
          ) : null}

          <AuthButton
            title="Publicar"
            onPress={handleCreatePost}
            loading={submitting}
          />
        </View>

        <View
          style={{
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 18,
            padding: 16,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 10,
            }}
          >
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700' }}>
              Feed de la comunidad
            </Text>
            <Text
              onPress={handleRefreshFeed}
              style={{ color: colors.primary, fontWeight: '600' }}
            >
              Actualizar
            </Text>
          </View>

          <ScrollView
            nestedScrollEnabled
            style={{ maxHeight: 420 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshingFeed}
                onRefresh={handleRefreshFeed}
                tintColor={colors.primary}
              />
            }
          >
            {feedLoading ? (
              <Text style={{ color: colors.textSecondary }}>Cargando publicaciones...</Text>
            ) : feedError ? (
              <Text style={{ color: colors.danger }}>{feedError}</Text>
            ) : !hasFeedData ? (
              <Text style={{ color: colors.textSecondary }}>
                Aun no hay publicaciones de la comunidad.
              </Text>
            ) : (
              posts.map((post) => {
                const authorName =
                  post.author?.username?.trim() ||
                  post.author?.full_name?.trim() ||
                  `Usuario ${post.user_id.slice(0, 8)}`
                const isExpanded = expandedPostId === post.id
                const comments = commentsByPostId[post.id] ?? []
                const commentsLoading = commentsLoadingByPostId[post.id] ?? false
                const commentsError = commentsErrorByPostId[post.id]
                const commentInput = commentInputByPostId[post.id] ?? ''
                const commentSubmitting = commentSubmittingByPostId[post.id] ?? false

                return (
                  <View
                    key={post.id}
                    style={{
                      backgroundColor: colors.cardSecondary,
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: 14,
                      padding: 12,
                      marginBottom: 10,
                    }}
                  >
                    <Text style={{ color: colors.text, fontWeight: '700', marginBottom: 6 }}>
                      @{authorName}
                    </Text>
                    <Text style={{ color: colors.text, marginBottom: 8 }}>
                      {post.content}
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                      {new Date(post.created_at).toLocaleString()}
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>
                      Estado: {post.moderation_status}
                    </Text>

                    <Pressable
                      onPress={() => handleToggleComments(post.id)}
                      style={{
                        marginTop: 10,
                        alignSelf: 'flex-start',
                        paddingVertical: 6,
                        paddingHorizontal: 10,
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: colors.border,
                        backgroundColor: colors.card,
                      }}
                    >
                      <Text style={{ color: colors.primary, fontWeight: '600' }}>
                        {isExpanded ? 'Ocultar comentarios' : 'Comentar'}
                      </Text>
                    </Pressable>

                    {isExpanded ? (
                      <View
                        style={{
                          marginTop: 10,
                          backgroundColor: colors.card,
                          borderRadius: 10,
                          borderWidth: 1,
                          borderColor: colors.border,
                          padding: 10,
                        }}
                      >
                        {commentsLoading ? (
                          <Text style={{ color: colors.textSecondary }}>
                            Cargando comentarios...
                          </Text>
                        ) : commentsError ? (
                          <Text style={{ color: colors.danger }}>{commentsError}</Text>
                        ) : comments.length === 0 ? (
                          <Text style={{ color: colors.textSecondary }}>
                            Aun no hay comentarios en esta publicacion.
                          </Text>
                        ) : (
                          comments.map((comment) => {
                            const commentAuthor =
                              comment.author?.username?.trim() ||
                              comment.author?.full_name?.trim() ||
                              `Usuario ${comment.user_id.slice(0, 8)}`

                            return (
                              <View
                                key={comment.id}
                                style={{
                                  backgroundColor: colors.cardSecondary,
                                  borderWidth: 1,
                                  borderColor: colors.border,
                                  borderRadius: 10,
                                  padding: 10,
                                  marginBottom: 8,
                                }}
                              >
                                <Text style={{ color: colors.text, fontWeight: '700', marginBottom: 4 }}>
                                  @{commentAuthor}
                                </Text>
                                <Text style={{ color: colors.text, marginBottom: 4 }}>
                                  {comment.content}
                                </Text>
                                <Text style={{ color: colors.textSecondary, fontSize: 11 }}>
                                  {new Date(comment.created_at).toLocaleString()}
                                </Text>
                              </View>
                            )
                          })
                        )}

                        {user ? (
                          <View style={{ marginTop: 6 }}>
                            <TextInput
                              value={commentInput}
                              onChangeText={(value) => updateCommentInput(post.id, value)}
                              placeholder="Escribe un comentario..."
                              placeholderTextColor={colors.placeholder}
                              multiline
                              textAlignVertical="top"
                              style={{
                                minHeight: 70,
                                backgroundColor: colors.cardSecondary,
                                borderWidth: 1,
                                borderColor: colors.border,
                                borderRadius: 10,
                                color: colors.text,
                                paddingHorizontal: 10,
                                paddingVertical: 8,
                                marginBottom: 8,
                              }}
                            />

                            <AuthButton
                              title="Enviar comentario"
                              onPress={() => handleCreateComment(post.id)}
                              loading={commentSubmitting}
                            />
                          </View>
                        ) : (
                          <Text style={{ color: colors.textSecondary, marginTop: 6 }}>
                            Inicia sesion para comentar.
                          </Text>
                        )}
                      </View>
                    ) : null}
                  </View>
                )
              })
            )}
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
