import { Pressable, Text, View } from 'react-native'
import { colors } from '../../theme/colors'
import type { JournalVisibility } from '../../types/journal'

interface JournalVisibilitySelectorProps {
  value: JournalVisibility
  onChange: (value: JournalVisibility) => void
}

function VisibilityChip({
  label,
  active,
  onPress,
}: {
  label: string
  active: boolean
  onPress: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        backgroundColor: active ? colors.primary : colors.cardSecondary,
        borderWidth: 1,
        borderColor: active ? colors.primary : colors.border,
      }}
    >
      <Text
        style={{
          color: active ? colors.text : colors.textSecondary,
          fontWeight: '600',
        }}
      >
        {label}
      </Text>
    </Pressable>
  )
}

export function JournalVisibilitySelector({
  value,
  onChange,
}: JournalVisibilitySelectorProps) {
  return (
    <View style={{ marginBottom: 20 }}>
      <Text
        style={{
          color: colors.text,
          fontSize: 14,
          fontWeight: '600',
          marginBottom: 8,
        }}
      >
        Visibilidad
      </Text>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <VisibilityChip
          label="Privada"
          active={value === 'private'}
          onPress={() => onChange('private')}
        />
        <VisibilityChip
          label="Pública"
          active={value === 'public'}
          onPress={() => onChange('public')}
        />
      </View>
    </View>
  )
}