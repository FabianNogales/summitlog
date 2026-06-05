import { RefreshControl, ScrollView, Text, View } from 'react-native'
import type { RefObject } from 'react'

import { colors } from '../../theme/colors'
import { FORM_SCROLL_BOTTOM_PADDING, scrollToFocusedInput } from '../../utils/keyboard'
import { getAuthorDisplayName } from '../../utils/displayName'
import { getPostMediaPublicUrl } from '../../services/post.service'
import { MAX_POST_COMMENT_LENGTH } from '../../services/postComment.service'
import type { SocialPost } from '../../types/post'
import type { SocialPostComment } from '../../types/postComment'
import type { ContentReportTargetType } from '../../types/contentReport'
import { CommentsSection } from './CommentsSection'
import { PostCard } from './PostCard'

interface CommunityFeedSectionProps {
  scrollRef: RefObject<ScrollView | null>
  posts: SocialPost[]
  feedLoading: boolean
  feedError: string | null
  refreshingFeed: boolean
  hasFeedData: boolean
  userId?: string | null
  fallbackUsername?: string | null
  expandedPostId: string | null
  commentsByPostId: Record<string, SocialPostComment[]>
  commentsLoadingByPostId: Record<string, boolean>
  commentsErrorByPostId: Record<string, string | null>
  commentInputByPostId: Record<string, string>
  commentSubmittingByPostId: Record<string, boolean>
  onRefresh: () => void
  onToggleComments: (postId: string) => void
  onUpdateCommentInput: (postId: string, value: string) => void
  onCreateComment: (postId: string) => void
  onDeletePost: (postId: string) => void
  onDeleteComment: (postId: string, commentId: string) => void
  onOpenReportModal: (
    targetType: ContentReportTargetType,
    targetId: string,
    targetLabel: string,
    targetOwnerId?: string | null
  ) => void
}

export function CommunityFeedSection({
  scrollRef,
  posts,
  feedLoading,
  feedError,
  refreshingFeed,
  hasFeedData,
  userId,
  fallbackUsername,
  expandedPostId,
  commentsByPostId,
  commentsLoadingByPostId,
  commentsErrorByPostId,
  commentInputByPostId,
  commentSubmittingByPostId,
  onRefresh,
  onToggleComments,
  onUpdateCommentInput,
  onCreateComment,
  onDeletePost,
  onDeleteComment,
  onOpenReportModal,
}: CommunityFeedSectionProps) {
  return (
    <ScrollView
      ref={scrollRef}
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingBottom: FORM_SCROLL_BOTTOM_PADDING,
      }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshingFeed}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
    >
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
            Aún no hay publicaciones de la comunidad.
          </Text>
        </View>
      ) : (
        posts.map((post) => {
          const isOwnPost = Boolean(userId && post.user_id === userId)
          const authorName = getAuthorDisplayName(post.author, {
            fallbackUsername: isOwnPost ? fallbackUsername : null,
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
              onToggleComments={() => onToggleComments(post.id)}
              onReportPost={() =>
                onOpenReportModal(
                  'post',
                  post.id,
                  `publicación de ${authorName}`,
                  post.user_id
                )
              }
              onDeletePost={() => onDeletePost(post.id)}
              commentsSection={
                <CommentsSection
                  comments={comments}
                  commentsLoading={commentsLoading}
                  commentsError={commentsError}
                  commentInput={commentInput}
                  commentSubmitting={commentSubmitting}
                  userLoggedIn={Boolean(userId)}
                  currentUserId={userId}
                  fallbackUsername={fallbackUsername ?? null}
                  maxCommentLength={MAX_POST_COMMENT_LENGTH}
                  onUpdateCommentInput={(value) => onUpdateCommentInput(post.id, value)}
                  onCreateComment={() => onCreateComment(post.id)}
                  onDeleteComment={(commentId) => onDeleteComment(post.id, commentId)}
                  onCommentInputFocus={(event) => scrollToFocusedInput(scrollRef, event)}
                  onReportComment={(commentId, commentAuthorName, commentOwnerId) =>
                    onOpenReportModal(
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
  )
}
