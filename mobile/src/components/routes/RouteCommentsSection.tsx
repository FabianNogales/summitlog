import { Pressable, Text, TextInput, View } from 'react-native'
import { colors } from '../../theme/colors'
import { AuthButton } from '../auth/AuthButton'
import { getAuthorDisplayName } from '../../utils/displayName'
import type { RouteComment } from '../../types/routeComment'
import { MAX_ROUTE_COMMENT_LENGTH } from '../../services/routeComment.service'

interface RouteCommentsSectionProps {
  comments: RouteComment[]
  commentsLoading: boolean
  commentsError: string | null
  canRetry: boolean
  currentUserId?: string
  commentsEnabled: boolean
  commentInput: string
  trimmedCommentLength: number
  commentTooLong: boolean
  commentSubmitting: boolean
  onRetryComments: () => void
  onOpenReportComment: (comment: RouteComment) => void
  onChangeCommentInput: (value: string) => void
  onCommentInputFocus: (event: any) => void
  onSubmitComment: () => void
}

function RouteCommentsSection({
  comments,
  commentsLoading,
  commentsError,
  canRetry,
  currentUserId,
  commentsEnabled,
  commentInput,
  trimmedCommentLength,
  commentTooLong,
  commentSubmitting,
  onRetryComments,
  onOpenReportComment,
  onChangeCommentInput,
  onCommentInputFocus,
  onSubmitComment,
}: RouteCommentsSectionProps) {
  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 18,
        marginBottom: 18,
      }}
    >
      <Text
        style={{
          color: colors.text,
          fontSize: 18,
          fontWeight: '700',
          marginBottom: 10,
        }}
      >
        Comentarios
      </Text>

      {commentsLoading ? (
        <Text style={{ color: colors.textSecondary }}>
          Cargando comentarios...
        </Text>
      ) : commentsError ? (
        <View>
          <Text style={{ color: colors.danger, marginBottom: 10 }}>
            {commentsError}
          </Text>
          {canRetry ? (
            <Pressable
              onPress={onRetryComments}
              style={{
                alignSelf: 'flex-start',
                borderRadius: 10,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.cardSecondary,
                paddingHorizontal: 12,
                paddingVertical: 8,
                marginBottom: 2,
              }}
            >
              <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>
                Reintentar
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : comments.length === 0 ? (
        <Text style={{ color: colors.textSecondary }}>
          Aun no hay comentarios para esta ruta.
        </Text>
      ) : (
        comments.map((comment) => {
          const isOwnComment = Boolean(currentUserId && comment.user_id === currentUserId)
          const commentAuthor = getAuthorDisplayName(comment.author, {
            fallbackUsername: isOwnComment ? undefined : null,
          })

          return (
            <View
              key={comment.id}
              style={{
                backgroundColor: colors.cardSecondary,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 10,
                marginBottom: 8,
              }}
            >
              <Text
                style={{
                  color: colors.text,
                  fontWeight: '700',
                  marginBottom: 4,
                }}
              >
                {commentAuthor}
              </Text>

              <Text style={{ color: colors.text, marginBottom: 4 }}>
                {comment.content}
              </Text>

              <Text style={{ color: colors.textSecondary, fontSize: 11 }}>
                {new Date(comment.created_at).toLocaleString()}
              </Text>

              {!(currentUserId && comment.user_id === currentUserId) ? (
                <Pressable
                  onPress={() => onOpenReportComment(comment)}
                  style={{
                    alignSelf: 'flex-start',
                    marginTop: 8,
                    paddingVertical: 4,
                    paddingHorizontal: 8,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.card,
                  }}
                >
                  <Text
                    style={{
                      color: colors.danger,
                      fontWeight: '600',
                      fontSize: 12,
                    }}
                  >
                    Denunciar
                  </Text>
                </Pressable>
              ) : null}
            </View>
          )
        })
      )}

      {!currentUserId ? (
        <Text style={{ color: colors.textSecondary, marginTop: 8 }}>
          Inicia sesion para comentar.
        </Text>
      ) : !commentsEnabled ? (
        <Text style={{ color: colors.textSecondary, marginTop: 8 }}>
          Los comentarios estan deshabilitados para esta ruta.
        </Text>
      ) : (
        <View style={{ marginTop: 8 }}>
          <TextInput
            value={commentInput}
            onChangeText={onChangeCommentInput}
            onFocus={onCommentInputFocus}
            placeholder="Escribe un comentario sobre la ruta..."
            placeholderTextColor={colors.placeholder}
            maxLength={MAX_ROUTE_COMMENT_LENGTH}
            multiline
            textAlignVertical="top"
            style={{
              minHeight: 80,
              backgroundColor: colors.cardSecondary,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 10,
              color: colors.text,
              marginBottom: 8,
            }}
          />
          <Text
            style={{
              color: commentTooLong ? colors.danger : colors.textSecondary,
              fontSize: 12,
              marginBottom: 8,
            }}
          >
            {`${trimmedCommentLength}/${MAX_ROUTE_COMMENT_LENGTH}`}
          </Text>

          <AuthButton
            title="Enviar comentario"
            onPress={onSubmitComment}
            loading={commentSubmitting}
          />
        </View>
      )}
    </View>
  )
}
export default RouteCommentsSection