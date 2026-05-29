import { ActivityIndicator, View } from "react-native";
import { Redirect, Tabs } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Activity, Home, Map, User } from "lucide-react-native";
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
          borderTopWidth: 1,
          height: 66,
          paddingTop: 6,
          paddingBottom: 6,
          paddingHorizontal: 0,
        },
        tabBarItemStyle: {
          flex: 1,
          minWidth: 0,
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: 2,
          margin: 0,
        },
        tabBarIconStyle: {
          alignSelf: "center",
          marginBottom: 0,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: 11,
          lineHeight: 13,
          textAlign: "center",
          marginTop: 1,
          width: "100%",
        },
      }}
    >
      <Tabs.Screen
        name="routes"
        options={{
          title: "Explorar",
          tabBarIcon: ({ color, size }) => <Map color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="home"
        options={{
          title: "Comunidad",
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="record"
        options={{
          title: "Registrar",
          tabBarIcon: ({ color, size }) => (
            <Activity color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: "Perfil",
          tabBarLabel: "Perfil",
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
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
