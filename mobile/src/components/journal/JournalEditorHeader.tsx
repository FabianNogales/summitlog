import { Pressable, Text, View } from 'react-native'
import { Feather } from '@expo/vector-icons'

import { colors } from '../../theme/colors'

interface JournalEditorHeaderProps {
  hasJournal: boolean
  saving: boolean
  uploading: boolean
  onBack: () => void
}

export function JournalEditorHeader({
  hasJournal,
  saving,
  uploading,
  onBack,
}: JournalEditorHeaderProps) {
  const isBusy = saving || uploading

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
      }}
    >
      <Pressable
        onPress={onBack}
        accessibilityState={{ disabled: isBusy }}
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: colors.card,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
          opacity: isBusy ? 0.65 : 1,
        }}
      >
        <Feather name="arrow-left" size={18} color={colors.text} />
      </Pressable>

      <Text
        style={{
          color: colors.text,
          fontSize: 20,
          fontWeight: '700',
        }}
      >
        {hasJournal ? 'Editar bitácora' : 'Crear bitácora'}
      </Text>
    </View>
  )
}