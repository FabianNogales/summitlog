import { ActivityIndicator, View } from "react-native";
import type { ReactNode } from "react";
import { Redirect, Tabs } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Activity, Home, Map, User } from "lucide-react-native";
import { useAuth } from "../../src/hooks/useAuth";
import { colors } from "../../src/theme/colors";

const TAB_ICON_SIZE = 24;
const BASE_TAB_BAR_HEIGHT = 66;
const TAB_BAR_TOP_PADDING = 6;
const TAB_BAR_MIN_BOTTOM_PADDING = 8;

function TabIconContainer({ children }: { children: ReactNode }) {
  return (
    <View
      style={{
        width: TAB_ICON_SIZE,
        height: TAB_ICON_SIZE,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {children}
    </View>
  );
}

export default function TabsLayout() {
  const { user, loading } = useAuth();
  const insets = useSafeAreaInsets();

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: BASE_TAB_BAR_HEIGHT + insets.bottom,
          paddingTop: TAB_BAR_TOP_PADDING,
          paddingBottom: Math.max(insets.bottom, TAB_BAR_MIN_BOTTOM_PADDING),
          // Eliminamos paddingHorizontal para que cada pestaña ocupe el espacio exacto
        },
        tabBarItemStyle: {
          flex: 1,               // Todas las pestañas ocupan el mismo ancho
          alignItems: "center",
          justifyContent: "center",
          // Eliminamos maxWidth, paddingHorizontal y marginHorizontal
        },
        tabBarIconStyle: {
          width: TAB_ICON_SIZE,
          height: TAB_ICON_SIZE,
          alignSelf: "center",
          justifyContent: "center",
          marginBottom: 0,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: 11,
          lineHeight: 13,
          textAlign: "center",   // Asegura centrado horizontal
          flexShrink: 1,         // Permite que el texto se encoja si es necesario
          includeFontPadding: false, // Reduce padding interno del texto
          width: "100%",         // Ocupa todo el ancho disponible
        },
      }}
    >
      <Tabs.Screen
        name="routes"
        options={{
          title: "Explorar",
          tabBarIcon: ({ color }) => (
            <TabIconContainer>
              <Map color={color} size={TAB_ICON_SIZE} />
            </TabIconContainer>
          ),
        }}
      />
      <Tabs.Screen
        name="home"
        options={{
          title: "Comunidad",
          tabBarIcon: ({ color }) => (
            <TabIconContainer>
              <Home color={color} size={TAB_ICON_SIZE} />
            </TabIconContainer>
          ),
        }}
      />
      <Tabs.Screen
        name="record"
        options={{
          title: "Registrar",
          tabBarIcon: ({ color }) => (
            <TabIconContainer>
              <Activity color={color} size={TAB_ICON_SIZE} />
            </TabIconContainer>
          ),
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: "Perfil",
          tabBarLabel: "Perfil",
          tabBarIcon: ({ color }) => (
            <TabIconContainer>
              <User color={color} size={TAB_ICON_SIZE} />
            </TabIconContainer>
          ),
        }}
      />
      <Tabs.Screen
        name="profile/stats"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="profile/history"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}