import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'

import { useAuth } from '../../src/hooks/useAuth'
import { colors } from '../../src/theme/colors'
import {
  createPost,
  getPostMediaPublicUrl,
  getPosts,
} from '../../src/services/post.service'
import type { SocialPost } from '../../src/types/post'
import {
  createPostComment,
  getPostComments,
  MAX_POST_COMMENT_LENGTH,
} from '../../src/services/postComment.service'
import type { SocialPostComment } from '../../src/types/postComment'
import { ContentReportModal } from '../../src/components/community/ContentReportModal'
import { createContentReport } from '../../src/services/contentReport.service'
import type {
  ContentReportReason,
  ContentReportTargetType,
} from '../../src/types/contentReport'
import {
  FORM_SCROLL_BOTTOM_PADDING,
  scrollToFocusedInput,
} from '../../src/utils/keyboard'
import { getAuthorDisplayName } from '../../src/utils/displayName'
import { CommunityHeader } from '../../src/components/community/CommunityHeader'
import {
  CreatePostComposer,
  type DraftPostImage,
} from '../../src/components/community/CreatePostComposer'
import { PostCard } from '../../src/components/community/PostCard'
import { CommentsSection } from '../../src/components/community/CommentsSection'

interface ReportTargetDraft {
  targetType: ContentReportTargetType
  targetId: string
  targetLabel: string
  targetOwnerId?: string | null
}

export default function HomeScreen() {
  const { profile, user, profileLoadError } = useAuth()
  const outerScrollRef = useRef<ScrollView | null>(null)
  const composerScrollRef = useRef<ScrollView | null>(null)
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [composerVisible, setComposerVisible] = useState(false)
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
  const [reportTargetDraft, setReportTargetDraft] =
    useState<ReportTargetDraft | null>(null)
  const [reportReason, setReportReason] = useState<ContentReportReason>('spam')
  const [reportDescription, setReportDescription] = useState('')
  const [reportSubmitting, setReportSubmitting] = useState(false)
  const [reportError, setReportError] = useState<string | null>(null)
  const [selectedPostImage, setSelectedPostImage] = useState<DraftPostImage | null>(
    null
  )

  const trimmedContent = content.trim()
  const contentTooShort = trimmedContent.length > 0 && trimmedContent.length < 10

  const composerDisplayName = useMemo(() => {
    const fullName = profile?.full_name?.trim()
    if (fullName) return fullName

    const username = profile?.username?.trim()
    if (username) return username

    return 'Senderista'
  }, [profile?.full_name, profile?.username])

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

    if (contentValue.length > MAX_POST_COMMENT_LENGTH) {
      setCommentsErrorByPostId((prev) => ({
        ...prev,
        [postId]: `El comentario no puede superar ${MAX_POST_COMMENT_LENGTH} caracteres.`,
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
      const created = await createPost({
        content: trimmedContent,
        image: selectedPostImage
          ? {
              fileUri: selectedPostImage.uri,
              fileName: selectedPostImage.fileName,
              mimeType: selectedPostImage.mimeType,
              fileSize: selectedPostImage.fileSize,
            }
          : undefined,
      })
      setContent('')
      setSelectedPostImage(null)
      setComposerVisible(false)
      await loadPosts()

      if (created.imageStatus === 'failed_after_post') {
        Alert.alert(
          'Publicacion creada con advertencia',
          created.imageError ??
            'La publicacion se guardo, pero no se pudo asociar la imagen.'
        )
        return
      }

      Alert.alert(
        'Publicacion creada',
        created.imageStatus === 'uploaded'
          ? 'Tu publicacion social se guardo con imagen.'
          : 'Tu publicacion social se guardo correctamente.'
      )
    } catch (error: any) {
      setSubmitError(error?.message ?? 'No se pudo crear la publicacion social.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handlePickPostImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()

    if (!permission.granted) {
      setSubmitError(
        'Se necesita permiso para acceder a la galeria. Habilitalo desde configuracion del dispositivo.'
      )
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: false,
      allowsEditing: false,
      quality: 0.8,
      selectionLimit: 1,
    })

    if (result.canceled || !result.assets?.length) {
      return
    }

    const selected = result.assets[0]
    setSelectedPostImage({
      uri: selected.uri,
      fileName: selected.fileName ?? null,
      mimeType: selected.mimeType ?? null,
      fileSize: selected.fileSize ?? null,
    })
    setSubmitError(null)
  }

  function resetReportDraftState() {
    setReportReason('spam')
    setReportDescription('')
    setReportError(null)
  }

  function handleOpenReportModal(
    targetType: ContentReportTargetType,
    targetId: string,
    targetLabel: string,
    targetOwnerId?: string | null
  ) {
    if (!user) {
      Alert.alert('Inicia sesion', 'Debes iniciar sesion para denunciar contenido.')
      return
    }

    if (!targetId) {
      return
    }

    resetReportDraftState()
    setReportTargetDraft({
      targetType,
      targetId,
      targetLabel,
      targetOwnerId: targetOwnerId ?? null,
    })
  }

  function handleCloseReportModal() {
    setReportTargetDraft(null)
    resetReportDraftState()
  }

  async function handleSubmitReport() {
    if (!reportTargetDraft) {
      return
    }

    if (!user) {
      Alert.alert('Inicia sesion', 'Debes iniciar sesion para denunciar contenido.')
      return
    }

    if (reportSubmitting) {
      return
    }

    try {
      setReportSubmitting(true)
      setReportError(null)

      await createContentReport({
        targetType: reportTargetDraft.targetType,
        targetId: reportTargetDraft.targetId,
        targetOwnerId: reportTargetDraft.targetOwnerId,
        reason: reportReason,
        description: reportDescription,
      })

      handleCloseReportModal()
      Alert.alert('Denuncia enviada', 'La denuncia se envio correctamente.')
    } catch (error: any) {
      setReportError(error?.message ?? 'No se pudo enviar la denuncia.')
    } finally {
      setReportSubmitting(false)
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={outerScrollRef}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 14,
            paddingBottom: FORM_SCROLL_BOTTOM_PADDING,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshingFeed}
              onRefresh={handleRefreshFeed}
              tintColor={colors.primary}
            />
          }
        >
          <CommunityHeader
            username={profile?.username}
            profileLoadError={profileLoadError}
            onPressCreate={() => setComposerVisible(true)}
            createDisabled={submitting}
          />

          {feedLoading ? (
            <View
              style={{
                backgroundColor: colors.cardSecondary,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 14,
                padding: 16,
                marginTop: 4,
              }}
            >
              <Text style={{ color: colors.textSecondary }}>Cargando publicaciones...</Text>
            </View>
          ) : feedError ? (
            <View
              style={{
                backgroundColor: colors.cardSecondary,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 14,
                padding: 16,
                marginTop: 4,
              }}
            >
              <Text style={{ color: colors.danger }}>{feedError}</Text>
            </View>
          ) : !hasFeedData ? (
            <View
              style={{
                backgroundColor: colors.cardSecondary,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 14,
                padding: 16,
                marginTop: 4,
              }}
            >
              <Text style={{ color: colors.textSecondary }}>
                Aun no hay publicaciones de la comunidad.
              </Text>
            </View>
          ) : (
            posts.map((post) => {
              const isOwnPost = Boolean(user?.id && post.user_id === user.id)
              const authorName = getAuthorDisplayName(post.author, {
                fallbackUsername: isOwnPost ? profile?.username : null,
              })
              const isExpanded = expandedPostId === post.id
              const comments = commentsByPostId[post.id] ?? []
              const commentsLoading = commentsLoadingByPostId[post.id] ?? false
              const commentsError = commentsErrorByPostId[post.id]
              const commentInput = commentInputByPostId[post.id] ?? ''
              const commentSubmitting = commentSubmittingByPostId[post.id] ?? false
              const postImage = (post.media ?? []).length > 0 ? post.media?.[0] : null
              const postImageUrl = getPostMediaPublicUrl(postImage?.file_path)

              return (
                <PostCard
                  key={post.id}
                  post={post}
                  authorName={authorName}
                  isOwnPost={isOwnPost}
                  postImageUrl={postImageUrl}
                  isExpanded={isExpanded}
                  onToggleComments={() => handleToggleComments(post.id)}
                  onReportPost={() =>
                    handleOpenReportModal(
                      'post',
                      post.id,
                      `publicacion de ${authorName}`,
                      post.user_id
                    )
                  }
                  commentsSection={
                    <CommentsSection
                      comments={comments}
                      commentsLoading={commentsLoading}
                      commentsError={commentsError}
                      commentInput={commentInput}
                      commentSubmitting={commentSubmitting}
                      userLoggedIn={Boolean(user)}
                      currentUserId={user?.id}
                      fallbackUsername={profile?.username ?? null}
                      maxCommentLength={MAX_POST_COMMENT_LENGTH}
                      onUpdateCommentInput={(value) => updateCommentInput(post.id, value)}
                      onCreateComment={() => handleCreateComment(post.id)}
                      onCommentInputFocus={(event) =>
                        scrollToFocusedInput(outerScrollRef, event)
                      }
                      onReportComment={(
                        commentId,
                        commentAuthorName,
                        commentOwnerId
                      ) =>
                        handleOpenReportModal(
                          'comment',
                          commentId,
                          `comentario de ${commentAuthorName}`,
                          commentOwnerId
                        )
                      }
                    />
                  }
                />
              )
            })
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={composerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setComposerVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: colors.overlay,
            justifyContent: 'flex-end',
          }}
        >
          <Pressable
            onPress={() => setComposerVisible(false)}
            style={{ flex: 1 }}
          />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView
              ref={composerScrollRef}
              style={{
                backgroundColor: colors.background,
                borderTopLeftRadius: 22,
                borderTopRightRadius: 22,
                maxHeight: '88%',
              }}
              contentContainerStyle={{
                paddingHorizontal: 16,
                paddingTop: 16,
                paddingBottom: FORM_SCROLL_BOTTOM_PADDING,
              }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <CreatePostComposer
                displayName={composerDisplayName}
                avatarUrl={profile?.avatar_url}
                content={content}
                contentTooShort={contentTooShort}
                selectedPostImage={selectedPostImage}
                submitting={submitting}
                submitError={submitError}
                onChangeContent={setContent}
                onInputFocus={(event) =>
                  scrollToFocusedInput(composerScrollRef, event)
                }
                onPickImage={handlePickPostImage}
                onRemoveImage={() => setSelectedPostImage(null)}
                onSubmit={handleCreatePost}
                onCancel={() => setComposerVisible(false)}
              />
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <ContentReportModal
        visible={Boolean(reportTargetDraft)}
        targetLabel={reportTargetDraft?.targetLabel ?? 'contenido'}
        reason={reportReason}
        description={reportDescription}
        loading={reportSubmitting}
        errorMessage={reportError}
        onChangeReason={setReportReason}
        onChangeDescription={setReportDescription}
        onClose={handleCloseReportModal}
        onSubmit={handleSubmitReport}
      />
    </SafeAreaView>
  )
}
