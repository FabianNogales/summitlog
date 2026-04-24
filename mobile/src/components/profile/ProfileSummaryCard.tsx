import { Pressable, Text, View } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { colors } from '../../theme/colors'
import { ProfileStat } from './ProfileStat'

interface ProfileSummaryCardProps {
  fullName?: string | null
  username?: string | null
  email?: string | null
  completedRoutes?: number
  journalCount?: number
  kilometers?: number
  onPressAvatar?: () => void
}

function getInitials(fullName?: string | null, username?: string | null) {
  if (fullName && fullName.trim().length > 0) {
    const parts = fullName.trim().split(' ')
    return parts
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase()
  }

  if (username && username.trim().length > 0) {
    return username.slice(0, 2).toUpperCase()
  }

  return 'SL'
}

export function ProfileSummaryCard({
  fullName,
  username,
  email,
  completedRoutes = 0,
  journalCount = 0,
  kilometers = 0,
  onPressAvatar,
}: ProfileSummaryCardProps) {
  const initials = getInitials(fullName, username)
  const displayName = fullName?.trim() || username || 'Usuario SummitLog'

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 18,
        padding: 18,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ position: 'relative', marginRight: 14 }}>
          <View
            style={{
              width: 62,
              height: 62,
              borderRadius: 31,
              backgroundColor: colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                color: colors.text,
                fontSize: 24,
                fontWeight: '700',
              }}
            >
              {initials}
            </Text>
          </View>

          <Pressable
            onPress={onPressAvatar}
            style={{
              position: 'absolute',
              bottom: -2,
              right: -2,
              width: 22,
              height: 22,
              borderRadius: 11,
              backgroundColor: colors.cardSecondary,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Feather name="camera" size={12} color={colors.text} />
          </Pressable>
        </View>

        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: colors.text,
              fontSize: 16,
              fontWeight: '700',
              marginBottom: 4,
            }}
          >
            {displayName}
          </Text>

          <Text
            style={{
              color: colors.textSecondary,
              fontSize: 13,
            }}
          >
            {email ?? 'Sin correo'}
          </Text>
        </View>
      </View>

      <View
        style={{
          height: 1,
          backgroundColor: colors.border,
          marginVertical: 18,
        }}
      />

      <View style={{ flexDirection: 'row' }}>
        <ProfileStat value={completedRoutes} label="Rutas completadas" />
        <ProfileStat value={journalCount} label="Bitácoras" />
        <ProfileStat value={kilometers.toFixed(2)} label="Kilómetros" />
      </View>
    </View>
  )
}