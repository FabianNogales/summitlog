import { Pressable, Text, View } from 'react-native'

import { AuthButton } from '../auth/AuthButton'
import { colors } from '../../theme/colors'
import type { JournalMedia } from '../../types/journal'
import { JournalMediaGrid } from './JournalMediaGrid'

interface JournalMediaSectionProps {
  hasJournal: boolean
  media: JournalMedia[]
  mediaLoading: boolean
  mediaError: string | null
  uploading: boolean
  deletingMediaIds: string[]
  pendingMediaIds: string[]
  embedded?: boolean
  maxPhotos: number
  onAddPhotos: () => void
  onRefreshMedia: () => void
  onRemovePhoto: (mediaId: string) => void
}

export function JournalMediaSection({
  hasJournal,
  media,
  mediaLoading,
  mediaError,
  uploading,
  deletingMediaIds,
  pendingMediaIds,
  embedded = false,
  maxPhotos,
  onAddPhotos,
  onRefreshMedia,
  onRemovePhoto,
}: JournalMediaSectionProps) {
  return (
    <View
      style={{
        backgroundColor: embedded ? 'transparent' : colors.card,
        borderRadius: embedded ? 0 : 18,
        borderWidth: embedded ? 0 : 1,
        borderTopWidth: embedded ? 1 : 1,
        borderColor: colors.border,
        padding: embedded ? 0 : 18,
        paddingTop: embedded ? 18 : 18,
        marginBottom: 18,
      }}
    >
      <Text
        style={{
          color: colors.text,
          fontSize: 16,
          fontWeight: '700',
          marginBottom: 8,
        }}
      >
        Fotos de la bitacora
      </Text>

      <Text style={{ color: colors.textSecondary, marginBottom: 12 }}>
        {`Maximo ${maxPhotos} fotos por bitacora (${media.length}/${maxPhotos}).`}
      </Text>

      {!hasJournal ? (
        <Text style={{ color: colors.textSecondary, marginBottom: 12 }}>
          Las fotos se adjuntaran cuando guardes la bitacora.
        </Text>
      ) : null}

      <View style={{ marginBottom: 16 }}>
        <AuthButton
          title="Agregar fotos"
          onPress={onAddPhotos}
          loading={uploading}
          disabled={media.length >= maxPhotos}
        />
      </View>

      {mediaLoading ? (
        <Text style={{ color: colors.textSecondary, marginBottom: 10 }}>
          Cargando fotos...
        </Text>
      ) : null}

      {mediaError ? (
        <View style={{ marginBottom: 12 }}>
          <Text style={{ color: colors.danger, marginBottom: 10 }}>
            {mediaError}
          </Text>
          <Pressable
            onPress={onRefreshMedia}
            style={{
              alignSelf: 'flex-start',
              borderRadius: 10,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.cardSecondary,
              paddingHorizontal: 12,
              paddingVertical: 8,
            }}
          >
            <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>
              Reintentar
            </Text>
          </Pressable>
        </View>
      ) : null}

      <JournalMediaGrid
        media={media}
        deletingMediaIds={deletingMediaIds}
        pendingMediaIds={pendingMediaIds}
        onRemove={(item) => onRemovePhoto(item.id)}
      />
    </View>
  )
}
