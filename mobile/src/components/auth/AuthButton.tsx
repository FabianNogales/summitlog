import { ActivityIndicator, Pressable, Text, View } from 'react-native'
import { colors } from '../../theme/colors'

interface AuthButtonProps {
  title: string
  onPress: () => void
  loading?: boolean
  disabled?: boolean
  variant?: 'primary' | 'secondary'
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export function AuthButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  leftIcon,
  rightIcon,
}: AuthButtonProps) {
  const isDisabled = loading || disabled

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => ({
        backgroundColor:
          variant === 'secondary'
            ? colors.cardSecondary
            : pressed
              ? colors.primaryPressed
              : colors.primary,
        borderColor: variant === 'secondary' ? colors.border : 'transparent',
        borderWidth: variant === 'secondary' ? 1 : 0,
        borderRadius: 18,
        minHeight: 58,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: isDisabled ? 0.5 : 1,
      })}
    >
      {loading ? (
        <ActivityIndicator color={colors.text} />
      ) : (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
          }}
        >
          {leftIcon ? leftIcon : null}
          <Text
            style={{
              color: colors.text,
              fontSize: 16,
              fontWeight: '700',
            }}
          >
            {title}
          </Text>
          {rightIcon ? rightIcon : null}
        </View>
      )}
    </Pressable>
  )
}
