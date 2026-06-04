import { Pressable, Text, View } from 'react-native'
import { List, Map } from 'lucide-react-native'
import { colors } from '../../theme/colors'

interface RoutesScreenHeaderProps {
  viewMode: 'map' | 'list'
  onToggleViewMode: () => void
}

export function RoutesScreenHeader({
  viewMode,
  onToggleViewMode,
}: RoutesScreenHeaderProps) {
  return (
    <View
      style={{
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
      }}
    >
      <View style={{ flex: 1, paddingRight: 10 }}>
        <Text
          style={{
            color: colors.textSecondary,
            fontSize: 13,
            marginBottom: 4,
          }}
        >
          Bienvenido de vuelta,
        </Text>

        <Text
          style={{
            color: colors.text,
            fontSize: 22,
            fontWeight: '800',
            lineHeight: 26,
          }}
        >
          Explorar rutas
        </Text>
      </View>

      <Pressable
        onPress={onToggleViewMode}
        style={{
          backgroundColor: colors.cardSecondary,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 16,
          minHeight: 42,
          paddingHorizontal: 12,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        }}
      >
        {viewMode === 'map' ? (
          <List size={14} color={colors.primary} />
        ) : (
          <Map size={14} color={colors.primary} />
        )}
        <Text
          style={{
            color: colors.text,
            fontSize: 14,
            fontWeight: '700',
          }}
        >
          {viewMode === 'map' ? 'Lista' : 'Mapa'}
        </Text>
      </Pressable>
    </View>
  )
}