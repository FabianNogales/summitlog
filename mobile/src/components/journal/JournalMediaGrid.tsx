import { Image, Pressable, Text, View } from 'react-native'
import { useEffect, useState } from 'react'
import { Feather } from '@expo/vector-icons'
import { colors } from '../../theme/colors'
import type { JournalMedia } from '../../types/journal'
import { getJournalMediaPublicUrl } from '../../services/journalMedia.service'

interface JournalMediaGridProps {
  media: JournalMedia[]
  deletingMediaIds?: string[]
  onRemove?: (item: JournalMedia) => void
}

export function JournalMediaGrid({
  media,
  deletingMediaIds = [],
  onRemove,
}: JournalMediaGridProps) {
  const [failedImageIds, setFailedImageIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    setFailedImageIds(new Set())
  }, [media])

  if (media.length === 0) {
    return (
      <View
        style={{
          backgroundColor: colors.cardSecondary,
          borderRadius: 14,
          padding: 16,
        }}
      >
        <Text style={{ color: colors.textSecondary }}>
          Aun no has agregado fotos a esta bitacora.
        </Text>
      </View>
    )
  }

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
      {media.map((item) => {
        const imageUrl = getJournalMediaPublicUrl(item.file_path)
        const hasRenderError = failedImageIds.has(item.id)
        const isDeleting = deletingMediaIds.includes(item.id)

        if (!imageUrl || hasRenderError) {
          return (
            <View
              key={item.id}
              style={{
                width: '31%',
                aspectRatio: 1,
                borderRadius: 12,
                backgroundColor: colors.cardSecondary,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 6,
              }}
            >
              <Text style={{ color: colors.textSecondary, fontSize: 11, textAlign: 'center' }}>
                Imagen no disponible
              </Text>
            </View>
          )
        }

        return (
          <View
            key={item.id}
            style={{
              width: '31%',
              aspectRatio: 1,
              borderRadius: 12,
              overflow: 'hidden',
              backgroundColor: colors.cardSecondary,
            }}
          >
            <Image
              source={{ uri: imageUrl }}
              style={{
                width: '100%',
                height: '100%',
              }}
              resizeMode="cover"
              onError={() => {
                setFailedImageIds((prev) => {
                  const next = new Set(prev)
                  next.add(item.id)
                  return next
                })
              }}
            />

            {onRemove ? (
              <Pressable
                onPress={() => onRemove(item)}
                disabled={isDeleting}
                style={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  backgroundColor: colors.overlay,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: isDeleting ? 0.6 : 1,
                }}
              >
                <Feather name={isDeleting ? 'loader' : 'x'} size={13} color={colors.text} />
              </Pressable>
            ) : null}
          </View>
        )
      })}
    </View>
  )
}
