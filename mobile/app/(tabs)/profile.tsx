import { Alert, SafeAreaView, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { useAuth } from "../../src/hooks/useAuth";
import { colors } from "../../src/theme/colors";
import { ProfileHeader } from "../../src/components/profile/ProfileHeader";
import { ProfileMenuItem } from "../../src/components/profile/ProfileMenuItem";
import { ProfileSection } from "../../src/components/profile/ProfileSection";
import { ProfileSummaryCard } from "../../src/components/profile/ProfileSummaryCard";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, profile, signOut } = useAuth();

  async function handleSignOut() {
    try {
      await signOut();
    } catch (error: any) {
      Alert.alert("Error", error.message ?? "No se pudo cerrar sesión");
    }
  }

  function handleComingSoon(title: string) {
    Alert.alert(
      "Próximamente",
      `La opción "${title}" se implementará después.`,
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ProfileHeader onPressSettings={() => router.push("/profile/edit")} />

        <View style={{ paddingHorizontal: 16, marginTop: -48 }}>
          <ProfileSummaryCard
            fullName={profile?.full_name}
            username={profile?.username}
            email={user?.email}
            completedRoutes={0}
            reports={0}
            kilometers={0}
            onPressAvatar={() =>
              Alert.alert(
                "Próximamente",
                "La actualización de foto de perfil la implementaremos después.",
              )
            }
          />

          <View style={{ marginTop: 20 }}>
            <ProfileSection title="Mi actividad">
              <ProfileMenuItem
                label="Rutas Guardadas"
                iconName="map"
                onPress={() => handleComingSoon("Rutas Guardadas")}
              />
              <View style={{ height: 1, backgroundColor: colors.border }} />

              <ProfileMenuItem
                label="Mis Reportes"
                iconName="share-2"
                onPress={() => handleComingSoon("Mis Reportes")}
              />
              <View style={{ height: 1, backgroundColor: colors.border }} />

              <ProfileMenuItem
                label="Bitácoras"
                iconName="file-text"
                onPress={() => handleComingSoon("Bitácoras")}
              />
            </ProfileSection>

            <ProfileSection title="Configuración">
              <ProfileMenuItem
                label="Editar Perfil"
                iconName="user"
                onPress={() => router.push("/profile/edit")}
              />
              <View style={{ height: 1, backgroundColor: colors.border }} />

              <ProfileMenuItem
                label="Notificaciones"
                iconName="bell"
                onPress={() => handleComingSoon("Notificaciones")}
              />
              <View style={{ height: 1, backgroundColor: colors.border }} />

              <ProfileMenuItem
                label="Privacidad"
                iconName="lock"
                onPress={() => handleComingSoon("Privacidad")}
              />
              <View style={{ height: 1, backgroundColor: colors.border }} />

              <ProfileMenuItem
                label="Modo Offline"
                iconName="wifi-off"
                onPress={() => handleComingSoon("Modo Offline")}
              />
            </ProfileSection>

            <ProfileSection title="Soporte">
              <ProfileMenuItem
                label="Ayuda"
                iconName="help-circle"
                onPress={() => handleComingSoon("Ayuda")}
              />
              <View style={{ height: 1, backgroundColor: colors.border }} />

              <ProfileMenuItem
                label="Términos y Condiciones"
                iconName="file"
                onPress={() => handleComingSoon("Términos y Condiciones")}
              />
            </ProfileSection>

            <View
              style={{
                backgroundColor: colors.card,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.border,
                overflow: "hidden",
                marginBottom: 18,
              }}
            >
              <ProfileMenuItem
                label="Cerrar Sesión"
                iconName="log-out"
                onPress={handleSignOut}
                danger
              />
            </View>

            <Text
              style={{
                textAlign: "center",
                color: colors.textSecondary,
                fontSize: 12,
                marginBottom: 28,
              }}
            >
              SummitLog v1.0.0
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
