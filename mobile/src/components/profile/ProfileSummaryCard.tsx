import { ActivityIndicator, Image, Pressable, Text, View } from 'react-native'
import { useEffect, useState } from 'react'
import { Feather } from '@expo/vector-icons'
import { colors } from '../../theme/colors'
import { ProfileStat } from './ProfileStat'

interface ProfileSummaryCardProps {
  fullName?: string | null
  username?: string | null
  email?: string | null
  avatarUrl?: string | null
  avatarUploading?: boolean
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
  avatarUrl,
  avatarUploading = false,
  completedRoutes = 0,
  journalCount = 0,
  kilometers = 0,
  onPressAvatar,
}: ProfileSummaryCardProps) {
  const initials = getInitials(fullName, username)
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false)
  const normalizedUsername = username?.trim() || ''
  const displayName =
    normalizedUsername.length > 0
      ? `@${normalizedUsername}`
      : fullName?.trim() || 'Usuario SummitLog'
  const canRenderAvatar = Boolean(avatarUrl) && !avatarLoadFailed
  const safeAvatarUrl = canRenderAvatar && avatarUrl ? avatarUrl : undefined

  useEffect(() => {
    setAvatarLoadFailed(false)
  }, [avatarUrl])

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
          <Pressable
            onPress={onPressAvatar}
            disabled={avatarUploading}
            style={{
              width: 62,
              height: 62,
              borderRadius: 31,
              backgroundColor: colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {safeAvatarUrl ? (
              <Image
                source={{ uri: safeAvatarUrl }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
                onError={() => {
                  console.log('[Avatar] image render error');
                  setAvatarLoadFailed(true)
                }}
              />
            ) : (
              <Text
                style={{
                  color: colors.text,
                  fontSize: 24,
                  fontWeight: '700',
                }}
              >
                {initials}
              </Text>
            )}
          </Pressable>

          <Pressable
            onPress={onPressAvatar}
            disabled={avatarUploading}
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
            {avatarUploading ? (
              <ActivityIndicator size="small" color={colors.text} />
            ) : (
              <Feather name="camera" size={12} color={colors.text} />
            )}
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
