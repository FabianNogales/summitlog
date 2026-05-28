import { Pressable, Text, View } from 'react-native'

import { colors } from '../../theme/colors'

interface CommunityHeaderProps {
  username?: string | null
  profileLoadError?: string | null
  onPressCreate: () => void
  createDisabled?: boolean
}

export function CommunityHeader({
  username,
  profileLoadError,
  onPressCreate,
  createDisabled = false,
}: CommunityHeaderProps) {
  return (
    <View style={{ marginBottom: 18 }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
        <Text
          style={{
            color: colors.text,
            fontSize: 30,
            fontWeight: '800',
            lineHeight: 34,
          }}
        >
          Comunidad
        </Text>
        <Pressable
          onPress={onPressCreate}
          disabled={createDisabled}
          style={{
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.cardSecondary,
            paddingHorizontal: 12,
            paddingVertical: 8,
            opacity: createDisabled ? 0.6 : 1,
          }}
        >
          <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '800' }}>
            + Crear
          </Text>
        </Pressable>
      </View>

      <Text
        style={{
          color: colors.textSecondary,
          fontSize: 14,
          lineHeight: 20,
          marginBottom: 10,
        }}
      >
        Comparte experiencias de senderismo y descubre nuevas aventuras.
      </Text>

      <Text style={{ color: colors.textMuted, fontSize: 12, marginBottom: profileLoadError ? 6 : 0 }}>
        {username ? `@${username}` : 'Comunidad SummitLog'}
      </Text>

      {profileLoadError ? (
        <Text
          style={{
            color: colors.warning,
            fontSize: 13,
            marginTop: 2,
          }}
        >
          {profileLoadError}
        </Text>
      ) : null}
    </View>
  )
}
