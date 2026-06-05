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
  maxPhotos,
  onAddPhotos,
  onRefreshMedia,
  onRemovePhoto,
}: JournalMediaSectionProps) {
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
          fontSize: 16,
          fontWeight: '700',
          marginBottom: 8,
        }}
      >
        Fotos de la bitácora
      </Text>

      <Text style={{ color: colors.textSecondary, marginBottom: 12 }}>
        {`Máximo ${maxPhotos} fotos por bitácora (${media.length}/${maxPhotos}).`}
      </Text>

      {!hasJournal ? (
        <Text style={{ color: colors.textSecondary }}>
          Guarda primero la bitácora para poder adjuntar fotos.
        </Text>
      ) : (
        <>
          <View style={{ marginBottom: 16 }}>
            <AuthButton
              title="Agregar fotos"
              onPress={onAddPhotos}
              loading={uploading}
              disabled={media.length >= maxPhotos || deletingMediaIds.length > 0}
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
            onRemove={(item) => onRemovePhoto(item.id)}
          />
        </>
      )}
    </View>
  )
}