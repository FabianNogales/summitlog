import { Text, View } from 'react-native'
import { colors } from '../../theme/colors'

interface ProfileStatProps {
  value: string | number
  label: string
}

export function ProfileStat({ value, label }: ProfileStatProps) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text
        style={{
          color: '#3E9A8E',
          fontSize: 28,
          fontWeight: '700',
          marginBottom: 4,
        }}
      >
        {value}
      </Text>

      <Text
        style={{
          color: colors.textSecondary,
          fontSize: 12,
          textAlign: 'center',
        }}
      >
        {label}
      </Text>
    </View>
  )
}