import { useState } from 'react'
import {
  KeyboardTypeOptions,
  Pressable,
  Text,
  TextInput,
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
}: AuthInputProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)

  const shouldHideText = secureTextEntry && !isPasswordVisible

  return (
    <View style={{ marginBottom: 18 }}>
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

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.cardSecondary,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 14,
          paddingHorizontal: 14,
          minHeight: 54,
        }}
      >
        <Feather
          name={iconName}
          size={18}
          color={colors.textSecondary}
          style={{ marginRight: 10 }}
        />

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.placeholder}
          secureTextEntry={shouldHideText}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          style={{
            flex: 1,
            color: colors.text,
            fontSize: 15,
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