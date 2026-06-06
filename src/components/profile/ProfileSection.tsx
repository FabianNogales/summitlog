import { ReactNode } from 'react'
import { Text, View } from 'react-native'
import { colors } from '../../theme/colors'

interface ProfileSectionProps {
  title: string
  children: ReactNode
}

export function ProfileSection({ title, children }: ProfileSectionProps) {
  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
        marginBottom: 18,
      }}
    >
      <View
        style={{
          backgroundColor: colors.cardSecondary,
          paddingHorizontal: 14,
          paddingVertical: 10,
        }}
      >
        <Text
          style={{
            color: colors.textSecondary,
            fontSize: 13,
            fontWeight: '600',
            textTransform: 'uppercase',
          }}
        >
          {title}
        </Text>
      </View>

      {children}
    </View>
  )
}