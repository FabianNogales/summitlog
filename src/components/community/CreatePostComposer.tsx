import { Image, Pressable, Text, TextInput, View } from 'react-native'
import { useState } from 'react'

import { AuthButton } from '../auth/AuthButton'
import { ImagePreviewModal } from '../common/ImagePreviewModal'
import { colors } from '../../theme/colors'

export interface DraftPostImage {
  uri: string
  fileName: string | null
  mimeType: string | null
  fileSize: number | null
}

interface CreatePostComposerProps {
  displayName: string
  avatarUrl?: string | null
  content: string
  contentTooShort: boolean
  selectedPostImage: DraftPostImage | null
  submitting: boolean
  submitError: string | null
  onChangeContent: (value: string) => void
  onInputFocus: (event: any) => void
  onPickImage: () => void
  onRemoveImage: () => void
  onSubmit: () => void
  onCancel?: () => void
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

export function CreatePostComposer({
  displayName,
  avatarUrl,
  content,
  contentTooShort,
  selectedPostImage,
  submitting,
  submitError,
  onChangeContent,
  onInputFocus,
  onPickImage,
  onRemoveImage,
  onSubmit,
  onCancel,
}: CreatePostComposerProps) {
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 20,
        padding: 16,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 2,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <View
          style={{
            width: 42,
            height: 42,
            borderRadius: 21,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 10,
            overflow: 'hidden',
          }}
        >
          {avatarUrl ? (
            <Pressable
              onPress={() => setPreviewImageUrl(avatarUrl)}
              style={{ width: '100%', height: '100%' }}
            >
              <Image source={{ uri: avatarUrl }} style={{ width: '100%', height: '100%' }} />
            </Pressable>
          ) : (
            <Text style={{ color: colors.background, fontSize: 16, fontWeight: '800' }}>
              {getInitials(displayName)}
            </Text>
          )}
        </View>

        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontSize: 17, fontWeight: '700' }}>
            Crear publicación
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
            Comparte una ruta, consejo o momento de montana.
          </Text>
        </View>
      </View>

      <TextInput
        value={content}
        onChangeText={onChangeContent}
        onFocus={onInputFocus}
        multiline
        textAlignVertical="top"
        placeholder="Escribe tu experiencia..."
        placeholderTextColor={colors.placeholder}
        style={{
          minHeight: 116,
          backgroundColor: colors.cardSecondary,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 14,
          color: colors.text,
          paddingHorizontal: 14,
          paddingVertical: 12,
          marginBottom: 10,
          fontSize: 15,
          lineHeight: 21,
        }}
      />

      <Text
        style={{
          color: contentTooShort ? colors.danger : colors.textSecondary,
          fontSize: 12,
          marginBottom: 10,
        }}
      >
        Mínimo 10 caracteres.
      </Text>

      {selectedPostImage ? (
        <View
          style={{
            marginBottom: 10,
            borderRadius: 14,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.cardSecondary,
          }}
        >
          <Pressable onPress={() => setPreviewImageUrl(selectedPostImage.uri)}>
            <Image source={{ uri: selectedPostImage.uri }} style={{ width: '100%', height: 172 }} resizeMode="cover" />
          </Pressable>
          <View
            style={{
              paddingHorizontal: 12,
              paddingVertical: 9,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: colors.textSecondary, fontSize: 12, flex: 1 }} numberOfLines={1}>
              {selectedPostImage.fileName ?? 'Imagen seleccionada'}
            </Text>
            <Pressable
              onPress={onRemoveImage}
              style={{
                marginLeft: 10,
                borderRadius: 9,
                borderWidth: 1,
                borderColor: colors.border,
                paddingHorizontal: 9,
                paddingVertical: 5,
                backgroundColor: colors.card,
              }}
            >
              <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '600' }}>
                Quitar
              </Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <Pressable
        onPress={onPickImage}
        style={{
          minHeight: 44,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.cardSecondary,
          marginBottom: 10,
        }}
      >
        <Text style={{ color: colors.textSecondary, fontWeight: '700' }}>Agregar imagen</Text>
      </Pressable>

      {submitError ? (
        <Text
          style={{
            color: colors.danger,
            fontSize: 13,
            marginBottom: 10,
          }}
        >
          {submitError}
        </Text>
      ) : null}

      <AuthButton title="Publicar" onPress={onSubmit} loading={submitting} />
      {onCancel ? (
        <Pressable
          onPress={onCancel}
          style={{
            marginTop: 10,
            minHeight: 42,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.cardSecondary,
          }}
        >
          <Text style={{ color: colors.textSecondary, fontWeight: '700' }}>Cancelar</Text>
        </Pressable>
      ) : null}
      <ImagePreviewModal
        visible={Boolean(previewImageUrl)}
        imageUrl={previewImageUrl}
        onClose={() => setPreviewImageUrl(null)}
      />
    </View>
  )
}
