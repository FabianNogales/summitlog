import { Image, Text, View } from 'react-native'
import { useEffect, useState } from 'react'
import { colors } from '../../theme/colors'
import type { JournalMedia } from '../../types/journal'
import { getJournalMediaPublicUrl } from '../../services/journalMedia.service'

interface JournalMediaGridProps {
  media: JournalMedia[]
}

export function JournalMediaGrid({ media }: JournalMediaGridProps) {
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
          Aún no has agregado fotos a esta bitácora.
        </Text>
      </View>
    )
  }

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
      {media.map((item) => {
        const imageUrl = getJournalMediaPublicUrl(item.file_path)
        const hasRenderError = failedImageIds.has(item.id)

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
          <Image
            key={item.id}
            source={{ uri: imageUrl }}
            style={{
              width: '31%',
              aspectRatio: 1,
              borderRadius: 12,
              backgroundColor: colors.cardSecondary,
            }}
            resizeMode="cover"
            onError={() => {
              console.log('[JournalMedia] image render error', {
                mediaId: item.id,
              })
              setFailedImageIds((prev) => {
                const next = new Set(prev)
                next.add(item.id)
                return next
              })
            }}
          />
        )
      })}
    </View>
  )
}
