import { ActivityIndicator, Pressable, Text } from 'react-native'
import { colors } from '../../theme/colors'

interface AuthButtonProps {
  title: string
  onPress: () => void
  loading?: boolean
}

export function AuthButton({
  title,
  onPress,
  loading = false,
}: AuthButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => ({
        backgroundColor: pressed ? colors.primaryPressed : colors.primary,
        borderRadius: 16,
        minHeight: 54,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: loading ? 0.8 : 1,
      })}
    >
      {loading ? (
        <ActivityIndicator color={colors.text} />
      ) : (
        <Text
          style={{
            color: colors.text,
            fontSize: 16,
            fontWeight: '700',
          }}
        >
          {title}
        </Text>
      )}
    </Pressable>
  )
}