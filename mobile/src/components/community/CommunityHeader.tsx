import { Pressable, Text, View } from 'react-native'

import { colors } from '../../theme/colors'

export type CommunityView = 'feed' | 'group-trips'

interface CommunityHeaderProps {
  username?: string | null
  profileLoadError?: string | null
  onPressCreate: () => void
  createDisabled?: boolean
  activeView: CommunityView
  onChangeView: (view: CommunityView) => void
}

export function CommunityHeader({
  username,
  profileLoadError,
  onPressCreate,
  createDisabled = false,
  activeView,
  onChangeView,
}: CommunityHeaderProps) {
  const isFeedActive = activeView === 'feed'
  const isGroupTripsActive = activeView === 'group-trips'

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

      <View
        style={{
          marginTop: 12,
          marginBottom: 2,
          backgroundColor: colors.cardSecondary,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 12,
          padding: 4,
          flexDirection: 'row',
        }}
      >
        <Pressable
          onPress={() => onChangeView('feed')}
          style={{
            flex: 1,
            minHeight: 38,
            borderRadius: 9,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isFeedActive ? colors.primary : 'transparent',
            marginRight: 6,
          }}
        >
          <Text
            style={{
              color: isFeedActive ? colors.background : colors.textSecondary,
              fontSize: 13,
              fontWeight: '700',
            }}
          >
            Feed
          </Text>
        </Pressable>

        <Pressable
          onPress={() => onChangeView('group-trips')}
          style={{
            flex: 1,
            minHeight: 38,
            borderRadius: 9,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isGroupTripsActive ? colors.primary : 'transparent',
          }}
        >
          <Text
            style={{
              color: isGroupTripsActive ? colors.background : colors.textSecondary,
              fontSize: 13,
              fontWeight: '700',
            }}
          >
            Salidas Grupales
          </Text>
        </Pressable>
      </View>

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
