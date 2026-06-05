import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'

import { useAuth } from '../../src/hooks/useAuth'
import { colors } from '../../src/theme/colors'
import { createPost, getPosts, hideOwnPost } from '../../src/services/post.service'
import type { SocialPost } from '../../src/types/post'
import {
  createPostComment,
  getPostComments,
  hideOwnPostComment,
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
  CommunityHeader,
  type CommunityView,
} from '../../src/components/community/CommunityHeader'
import type { DraftPostImage } from '../../src/components/community/CreatePostComposer'
import { CommunityFeedSection } from '../../src/components/community/CommunityFeedSection'
import { CommunityCreatePostModal } from '../../src/components/community/CommunityCreatePostModal'
import { CommunityCreateOutingModal } from '../../src/components/community/CommunityCreateOutingModal'

import { GroupOutingsView } from '../../src/components/community/GroupOutingsView'
import { groupOutingService } from '../../src/services/groupOuting.service'

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

  const [outingsRefreshTrigger, setOutingsRefreshTrigger] = useState(false)
  const [outingComposerVisible, setOutingComposerVisible] = useState(false)
  const [outingSubmitting, setOutingSubmitting] = useState(false)
  const [outingSubmitError, setOutingSubmitError] = useState<string | null>(null)

  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [composerVisible, setComposerVisible] = useState(false)
  const [activeView, setActiveView] = useState<CommunityView>('feed')
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
      await loadPosts()

      if (created.imageStatus === 'failed_after_post') {
        setSubmitError(
          created.imageError ??
            'La publicacion se creo, pero no se pudo asociar la imagen.'
        )
        return
      }

      setContent('')
      setSelectedPostImage(null)
      setComposerVisible(false)

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

  function handleDeletePost(postId: string) {
    if (!user) {
      Alert.alert('Inicia sesion', 'Debes iniciar sesion para eliminar publicaciones.')
      return
    }

    const post = posts.find((item) => item.id === postId)
    if (!post || post.user_id !== user.id) {
      Alert.alert('Accion no disponible', 'No puedes eliminar esta publicacion.')
      return
    }

    Alert.alert(
      'Eliminar publicacion',
      'Esta publicacion dejara de mostrarse en Comunidad. Esta accion no se puede deshacer desde la app.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await hideOwnPost(postId, user.id)
              setPosts((prev) => prev.filter((item) => item.id !== postId))
              setExpandedPostId((prev) => (prev === postId ? null : prev))
              setCommentsByPostId((prev) => {
                const next = { ...prev }
                delete next[postId]
                return next
              })
              setCommentInputByPostId((prev) => {
                const next = { ...prev }
                delete next[postId]
                return next
              })
            } catch (error: any) {
              Alert.alert(
                'No se pudo eliminar la publicacion',
                error?.message ?? 'Intentalo nuevamente.'
              )
            }
          },
        },
      ]
    )
  }

  function handleDeleteComment(postId: string, commentId: string) {
    if (!user) {
      Alert.alert('Inicia sesion', 'Debes iniciar sesion para eliminar comentarios.')
      return
    }

    const comment = commentsByPostId[postId]?.find((item) => item.id === commentId)
    if (!comment || comment.user_id !== user.id) {
      Alert.alert('Accion no disponible', 'No puedes eliminar este comentario.')
      return
    }

    Alert.alert(
      'Eliminar comentario',
      'Este comentario dejara de mostrarse en Comunidad. Esta accion no se puede deshacer desde la app.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await hideOwnPostComment(commentId, user.id)
              setCommentsByPostId((prev) => ({
                ...prev,
                [postId]: (prev[postId] ?? []).filter((item) => item.id !== commentId),
              }))
            } catch (error: any) {
              Alert.alert(
                'No se pudo eliminar el comentario',
                error?.message ?? 'Intentalo nuevamente.'
              )
            }
          },
        },
      ]
    )
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

  async function handleCreateOuting(formData: {
    title: string
    description: string
    destination: string
    meetingPoint: string
    dateTime: Date
    maxParticipants: number
    imageUri: string | null
  }) {
    if (!user) {
      Alert.alert('Inicia sesion', 'Debes iniciar sesion para proponer una salida.')
      return
    }

    try {
      setOutingSubmitting(true)
      setOutingSubmitError(null)

      await groupOutingService.createGroupOuting(
        {
          title: formData.title,
          destination: formData.destination,
          description: formData.description,
          meeting_point: formData.meetingPoint,
          date_time: formData.dateTime.toISOString(),
          max_participants: formData.maxParticipants,
        },
        formData.imageUri
      )

      setOutingComposerVisible(false)
      setOutingsRefreshTrigger((prev) => !prev)
      Alert.alert('Exito', 'La salida grupal ha sido publicada correctamente.')
    } catch (error: any) {
      setOutingSubmitError(error?.message ?? 'No se pudo registrar la salida grupal.')
    } finally {
      setOutingSubmitting(false)
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 }}>
          <CommunityHeader
            username={profile?.username}
            profileLoadError={profileLoadError}
            onPressCreate={() => {
              if (activeView === 'feed') {
                setSubmitError(null)
                setComposerVisible(true)
              } else {
                setOutingSubmitError(null)
                setOutingComposerVisible(true)
              }
            }}
            createDisabled={activeView === 'feed' ? submitting : outingSubmitting}
            activeView={activeView}
            onChangeView={setActiveView}
          />
        </View>
        {activeView === 'feed' ? (
          <CommunityFeedSection
            scrollRef={outerScrollRef}
            posts={posts}
            feedLoading={feedLoading}
            feedError={feedError}
            refreshingFeed={refreshingFeed}
            hasFeedData={hasFeedData}
            userId={user?.id}
            fallbackUsername={profile?.username ?? null}
            expandedPostId={expandedPostId}
            commentsByPostId={commentsByPostId}
            commentsLoadingByPostId={commentsLoadingByPostId}
            commentsErrorByPostId={commentsErrorByPostId}
            commentInputByPostId={commentInputByPostId}
            commentSubmittingByPostId={commentSubmittingByPostId}
            onRefresh={handleRefreshFeed}
            onToggleComments={handleToggleComments}
            onUpdateCommentInput={updateCommentInput}
            onCreateComment={handleCreateComment}
            onDeletePost={handleDeletePost}
            onDeleteComment={handleDeleteComment}
            onOpenReportModal={handleOpenReportModal}
          />
        ) : (
          <View style={{ flex: 1, paddingHorizontal: 16 }}>
            <GroupOutingsView refreshTrigger={outingsRefreshTrigger} />
          </View>
        )}
      </KeyboardAvoidingView>

      <CommunityCreatePostModal
        visible={composerVisible}
        scrollRef={composerScrollRef}
        displayName={composerDisplayName}
        avatarUrl={profile?.avatar_url}
        content={content}
        contentTooShort={contentTooShort}
        selectedPostImage={selectedPostImage}
        submitting={submitting}
        submitError={submitError}
        onClose={() => setComposerVisible(false)}
        onChangeContent={setContent}
        onPickImage={handlePickPostImage}
        onRemoveImage={() => setSelectedPostImage(null)}
        onSubmit={handleCreatePost}
      />
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
      <CommunityCreateOutingModal
        visible={outingComposerVisible}
        submitting={outingSubmitting}
        submitError={outingSubmitError}
        onClose={() => setOutingComposerVisible(false)}
        onSubmit={handleCreateOuting}
      />
    </SafeAreaView>
  )
}
