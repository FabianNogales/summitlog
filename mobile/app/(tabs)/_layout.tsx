import { ActivityIndicator, View } from "react-native";
import { Redirect, Tabs } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../src/hooks/useAuth";
import { colors } from "../../src/theme/colors";

export default function TabsLayout() {
  const { user, loading } = useAuth();

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
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Inicio",
        }}
      />
      <Tabs.Screen
        name="record"
        options={{
          title: "Registrar",
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: "Perfil",
          tabBarLabel: "Perfil",
        }}
      />
      <Tabs.Screen
        name="profile/stats"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="routes"
        options={{
          title: "Rutas",
        }}
      />
    </Tabs>
  );
}
