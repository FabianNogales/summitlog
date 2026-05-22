import { useState } from 'react'
import {
  KeyboardTypeOptions,
  Pressable,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native'
import { Feather } from '@expo/vector-icons'
import { colors } from '../../theme/colors'

interface AuthInputProps {
  label: string
  placeholder: string
  value: string
  onChangeText: (text: string) => void
  iconName: keyof typeof Feather.glyphMap
  secureTextEntry?: boolean
  keyboardType?: KeyboardTypeOptions
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters'
  onFocus?: TextInputProps['onFocus']
  hideLabel?: boolean
}

export function AuthInput({
  label,
  placeholder,
  value,
  onChangeText,
  iconName,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  onFocus,
  hideLabel = false,
}: AuthInputProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)

  const shouldHideText = secureTextEntry && !isPasswordVisible

  return (
    <View style={{ marginBottom: hideLabel ? 16 : 18 }}>
      {!hideLabel ? (
        <Text
          style={{
            color: colors.text,
            fontSize: 14,
            fontWeight: '600',
            marginBottom: 8,
          }}
        >
          {label}
        </Text>
      ) : null}

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.cardSecondary,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 18,
          paddingHorizontal: hideLabel ? 18 : 14,
          minHeight: hideLabel ? 70 : 54,
        }}
      >
        <Feather
          name={iconName}
          size={18}
          color={colors.textSecondary}
          style={{ marginRight: 12 }}
        />

        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={onFocus}
          placeholder={placeholder}
          placeholderTextColor={colors.placeholder}
          secureTextEntry={shouldHideText}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          style={{
            flex: 1,
            color: colors.text,
            fontSize: hideLabel ? 16 : 15,
          }}
        />

        {secureTextEntry ? (
          <Pressable onPress={() => setIsPasswordVisible((prev) => !prev)}>
            <Feather
              name={isPasswordVisible ? 'eye-off' : 'eye'}
              size={18}
              color={colors.textSecondary}
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  )
}
