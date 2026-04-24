import { Alert, SafeAreaView, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { useAuth } from "../../src/hooks/useAuth";
import { colors } from "../../src/theme/colors";
import { ProfileHeader } from "../../src/components/profile/ProfileHeader";
import { ProfileMenuItem } from "../../src/components/profile/ProfileMenuItem";
import { ProfileSection } from "../../src/components/profile/ProfileSection";
import { ProfileSummaryCard } from "../../src/components/profile/ProfileSummaryCard";
import { HistoryEmptyState } from "../../src/components/profile/HistoryEmptyState";
import { TripHistoryItem } from "../../src/components/profile/TripHistoryItem";
import { useTripHistory } from "../../src/hooks/useTripHistory";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, profile, signOut } = useAuth();
  const { trips, stats, loading } = useTripHistory();

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
            completedRoutes={stats.completedTrips}
            journalCount={stats.journalCount}
            kilometers={stats.totalDistanceKm}
            onPressAvatar={() =>
              Alert.alert(
                "Próximamente",
                "La actualización de foto de perfil la implementaremos después.",
              )
            }
          />

          <View style={{ marginTop: 20 }}>
            <Text
              style={{
                color: colors.text,
                fontSize: 18,
                fontWeight: "700",
                marginBottom: 12,
              }}
            >
              Historial de actividades
            </Text>

            {loading ? (
              <Text style={{ color: colors.textSecondary, marginBottom: 18 }}>
                Cargando historial...
              </Text>
            ) : trips.length === 0 ? (
              <HistoryEmptyState />
            ) : (
              <View style={{ marginBottom: 18 }}>
                {trips.map((trip) => (
                  <TripHistoryItem
                    key={trip.id}
                    trip={trip}
                    onPress={() =>
                      router.push({
                        pathname: "/trip/[id]",
                        params: { id: trip.id },
                      })
                    }
                  />
                ))}
              </View>
            )}

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
