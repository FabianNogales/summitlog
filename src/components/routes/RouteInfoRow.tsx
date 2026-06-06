import { Text, View } from 'react-native'
import { colors } from '../../theme/colors'

interface RouteInfoRowProps {
  label: string
  value: string
}

export function RouteInfoRow({ label, value }: RouteInfoRowProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <Text
        style={{
          color: colors.textSecondary,
          fontSize: 14,
        }}
      >
        {label}
      </Text>

      <Text
        style={{
          color: colors.text,
          fontSize: 14,
          fontWeight: '600',
          maxWidth: '55%',
          textAlign: 'right',
        }}
      >
        {value}
      </Text>
    </View>
  )
}