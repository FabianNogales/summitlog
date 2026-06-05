import { Image, Pressable, Text, TextInput, View } from 'react-native'
import { useState } from 'react'

import { AuthButton } from '../auth/AuthButton'
import { ImagePreviewModal } from '../common/ImagePreviewModal'
import { colors } from '../../theme/colors'
import type { SocialPostComment } from '../../types/postComment'
import { getAuthorDisplayName } from '../../utils/displayName'

interface CommentsSectionProps {
  comments: SocialPostComment[]
  commentsLoading: boolean
  commentsError?: string | null
  commentInput: string
  commentSubmitting: boolean
  userLoggedIn: boolean
  currentUserId?: string | null
  fallbackUsername?: string | null
  maxCommentLength: number
  onUpdateCommentInput: (value: string) => void
  onCreateComment: () => void
  onCommentInputFocus: (event: any) => void
  onDeleteComment: (commentId: string) => void
  onReportComment: (
    commentId: string,
    commentAuthorName: string,
    commentOwnerId?: string | null
  ) => void
}

function getInitials(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return 'S'

  const words = trimmed.split(/\s+/).filter(Boolean)
  if (words.length === 1) {
    return words[0].slice(0, 1).toUpperCase()
  }

  return `${words[0].slice(0, 1)}${words[1].slice(0, 1)}`.toUpperCase()
}

export function CommentsSection({
  comments,
  commentsLoading,
  commentsError,
  commentInput,
  commentSubmitting,
  userLoggedIn,
  currentUserId,
  fallbackUsername,
  maxCommentLength,
  onUpdateCommentInput,
  onCreateComment,
  onCommentInputFocus,
  onDeleteComment,
  onReportComment,
}: CommentsSectionProps) {
  const trimmedCommentInput = commentInput.trim()
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)

  return (
    <View
      style={{
        marginTop: 4,
        backgroundColor: colors.cardSecondary,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingHorizontal: 12,
        paddingTop: 10,
        paddingBottom: 12,
      }}
    >
      {commentsLoading ? (
        <Text style={{ color: colors.textSecondary }}>Cargando comentarios...</Text>
      ) : commentsError ? (
        <Text style={{ color: colors.danger }}>{commentsError}</Text>
      ) : comments.length === 0 ? (
        <Text style={{ color: colors.textSecondary }}>
          Aun no hay comentarios en esta publicacion.
        </Text>
      ) : (
        comments.map((comment) => {
          const isOwnComment = Boolean(currentUserId && comment.user_id === currentUserId)
          const commentAuthor = getAuthorDisplayName(comment.author, {
            fallbackUsername: isOwnComment ? fallbackUsername : null,
          })

          return (
            <View
              key={comment.id}
              style={{
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 10,
                padding: 9,
                marginBottom: 8,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    marginRight: 8,
                    backgroundColor: colors.primary,
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  {comment.author?.avatar_url ? (
                    <Pressable
                      onPress={() => setPreviewImageUrl(comment.author?.avatar_url ?? null)}
                      style={{ width: '100%', height: '100%' }}
                    >
                      <Image source={{ uri: comment.author.avatar_url }} style={{ width: '100%', height: '100%' }} />
                    </Pressable>
                  ) : (
                    <Text style={{ color: colors.background, fontSize: 12, fontWeight: '800' }}>
                      {getInitials(commentAuthor)}
                    </Text>
                  )}
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: '700', fontSize: 13 }}>
                    {commentAuthor}
                  </Text>
                  <Text style={{ color: colors.textMuted, fontSize: 11 }}>
                    {new Date(comment.created_at).toLocaleString()}
                  </Text>
                </View>
              </View>

              <Text style={{ color: colors.text, fontSize: 14, lineHeight: 19 }}>
                {comment.content}
              </Text>

              {isOwnComment ? (
                <Pressable
                  onPress={() => onDeleteComment(comment.id)}
                  style={{
                    alignSelf: 'flex-start',
                    marginTop: 7,
                    paddingVertical: 4,
                    paddingHorizontal: 8,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.cardSecondary,
                  }}
                >
                  <Text
                    style={{
                      color: colors.danger,
                      fontWeight: '700',
                      fontSize: 12,
                    }}
                  >
                    Eliminar comentario
                  </Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={() =>
                    onReportComment(comment.id, commentAuthor, comment.user_id)
                  }
                  style={{
                    alignSelf: 'flex-start',
                    marginTop: 7,
                    paddingVertical: 4,
                    paddingHorizontal: 8,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.cardSecondary,
                  }}
                >
                  <Text
                    style={{
                      color: colors.danger,
                      fontWeight: '700',
                      fontSize: 12,
                    }}
                  >
                    Denunciar
                  </Text>
                </Pressable>
              )}
            </View>
          )
        })
      )}

      {userLoggedIn ? (
        <View style={{ marginTop: 6 }}>
          <TextInput
            value={commentInput}
            onChangeText={onUpdateCommentInput}
            onFocus={onCommentInputFocus}
            placeholder="Escribe un comentario..."
            placeholderTextColor={colors.placeholder}
            maxLength={maxCommentLength}
            multiline
            textAlignVertical="top"
            style={{
              minHeight: 64,
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 10,
              color: colors.text,
              paddingHorizontal: 10,
              paddingVertical: 9,
              marginBottom: 8,
              fontSize: 14,
              lineHeight: 20,
            }}
          />

          <Text
            style={{
              color:
                trimmedCommentInput.length > maxCommentLength
                  ? colors.danger
                  : colors.textSecondary,
              fontSize: 12,
              marginBottom: 8,
              textAlign: 'right',
            }}
          >
            {`${trimmedCommentInput.length}/${maxCommentLength}`}
          </Text>

          <AuthButton
            title="Enviar comentario"
            onPress={onCreateComment}
            loading={commentSubmitting}
          />
        </View>
      ) : (
        <Text style={{ color: colors.textSecondary, marginTop: 6 }}>
          Inicia sesion para comentar.
        </Text>
      )}
      <ImagePreviewModal
        visible={Boolean(previewImageUrl)}
        imageUrl={previewImageUrl}
        onClose={() => setPreviewImageUrl(null)}
      />
    </View>
  )
}
