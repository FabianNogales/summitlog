import { Image, Pressable, Text, View } from 'react-native'
import { useState } from 'react'

import { ImagePreviewModal } from '../common/ImagePreviewModal'
import { colors } from '../../theme/colors'
import type { SocialPost } from '../../types/post'

interface PostCardProps {
  post: SocialPost
  authorName: string
  isOwnPost: boolean
  postImageUrl: string
  isExpanded: boolean
  onToggleComments: () => void
  onReportPost: () => void
  onDeletePost: () => void
  commentsSection?: React.ReactNode
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

export function PostCard({
  post,
  authorName,
  isOwnPost,
  postImageUrl,
  isExpanded,
  onToggleComments,
  onReportPost,
  onDeletePost,
  commentsSection,
}: PostCardProps) {
  const hasImage = Boolean(postImageUrl)
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 20,
        marginBottom: 14,
        overflow: 'hidden',
      }}
    >
      <View style={{ paddingHorizontal: 14, paddingTop: 12, paddingBottom: hasImage ? 10 : 0 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            marginRight: 10,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {post.author?.avatar_url ? (
            <Pressable
              onPress={() => setPreviewImageUrl(post.author?.avatar_url ?? null)}
              style={{ width: '100%', height: '100%' }}
            >
              <Image source={{ uri: post.author.avatar_url }} style={{ width: '100%', height: '100%' }} />
            </Pressable>
          ) : (
            <Text style={{ color: colors.background, fontSize: 15, fontWeight: '800' }}>
              {getInitials(authorName)}
            </Text>
          )}
        </View>

        <View style={{ flex: 1, paddingRight: 10 }}>
          <Text style={{ color: colors.text, fontWeight: '700', fontSize: 15 }} numberOfLines={1}>
            {authorName}
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: 11 }}>
            {new Date(post.created_at).toLocaleString()}
          </Text>
        </View>

        {isOwnPost ? (
          <Pressable onPress={onDeletePost} hitSlop={8}>
            <Text style={{ color: colors.danger, fontSize: 12, fontWeight: '700' }}>
              Eliminar publicación
            </Text>
          </Pressable>
        ) : (
          <Pressable onPress={onReportPost} hitSlop={8}>
            <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '700' }}>
              Denunciar
            </Text>
          </Pressable>
        )}
      </View>
      </View>

      {hasImage ? (
        <Pressable onPress={() => setPreviewImageUrl(postImageUrl)}>
          <Image
            source={{ uri: postImageUrl }}
            style={{
              width: '100%',
              height: 250,
              backgroundColor: colors.cardSecondary,
            }}
            resizeMode="cover"
          />
        </Pressable>
      ) : null}

      <View style={{ paddingHorizontal: 14, paddingTop: hasImage ? 11 : 10, paddingBottom: 12 }}>
      <Text style={{ color: colors.text, fontSize: 15, lineHeight: 22, marginBottom: 10 }}>
        {post.content}
      </Text>

      <View style={{ flexDirection: 'row', marginTop: 2 }}>
        <Pressable
          onPress={onToggleComments}
          style={{
            alignSelf: 'flex-start',
            paddingVertical: 7,
            paddingHorizontal: 12,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.cardSecondary,
            marginRight: 0,
          }}
        >
          <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 12 }}>
            {isExpanded ? 'Ocultar comentarios' : 'Comentar'}
          </Text>
        </Pressable>
      </View>
      </View>

      {isExpanded ? commentsSection : null}

      <ImagePreviewModal
        visible={Boolean(previewImageUrl)}
        imageUrl={previewImageUrl}
        onClose={() => setPreviewImageUrl(null)}
      />
    </View>
  )
}
