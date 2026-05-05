import { Image, Text, View } from 'react-native'
import { colors } from '../../theme/colors'
import type { JournalMedia } from '../../types/journal'
import { getJournalMediaPublicUrl } from '../../services/journalMedia.service'

interface JournalMediaGridProps {
  media: JournalMedia[]
}

export function JournalMediaGrid({ media }: JournalMediaGridProps) {
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
      {media.map((item) => (
        <Image
          key={item.id}
          source={{ uri: getJournalMediaPublicUrl(item.file_path) }}
          style={{
            width: '31%',
            aspectRatio: 1,
            borderRadius: 12,
            backgroundColor: colors.cardSecondary,
          }}
          resizeMode="cover"
        />
      ))}
    </View>
  )
}