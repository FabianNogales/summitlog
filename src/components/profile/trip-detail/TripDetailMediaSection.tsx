import { Text, View } from 'react-native'

import { JournalMediaGrid } from '../../journal/JournalMediaGrid'
import { colors } from '../../../theme/colors'
import type { JournalMedia } from '../../../types/journal'

interface TripDetailMediaSectionProps {
  media: JournalMedia[]
}

export function TripDetailMediaSection({ media }: TripDetailMediaSectionProps) {
  if (media.length === 0) {
    return null
  }

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
          marginBottom: 12,
        }}
      >
        Fotos de la bitacora
      </Text>

      <JournalMediaGrid media={media} />
    </View>
  )
}
