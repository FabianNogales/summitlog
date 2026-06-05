import { Alert, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRef, useState } from "react";
import * as ImagePicker from "expo-image-picker";

import { ImagePreviewModal } from "../../../src/components/common/ImagePreviewModal";
import { useAuth } from "../../../src/hooks/useAuth";
import { colors } from "../../../src/theme/colors";
import { ProfileHeader } from "../../../src/components/profile/ProfileHeader";
import { ProfileMenuItem } from "../../../src/components/profile/ProfileMenuItem";
import { ProfileSection } from "../../../src/components/profile/ProfileSection";
import { ProfileSummaryCard } from "../../../src/components/profile/ProfileSummaryCard";
import { HistoryEmptyState } from "../../../src/components/profile/HistoryEmptyState";
import { TripHistoryItem } from "../../../src/components/profile/TripHistoryItem";
import { useTripHistory } from "../../../src/hooks/useTripHistory";
import { uploadAvatarToStorage } from "../../../src/services/profile.service";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, profile, signOut, updateMyProfile } = useAuth();
  const { trips, stats, loading, refreshing, error, pendingSyncCount, refreshHistory } =
    useTripHistory({ limit: 3 });
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarPreviewVisible, setAvatarPreviewVisible] = useState(false);
  const avatarUploadingRef = useRef(false);
  const canModerate = profile?.role === "admin" || profile?.role === "moderator";

  async function handleSignOut() {
    try {
      await signOut();
    } catch (error: any) {
      Alert.alert("Error", error.message ?? "No se pudo cerrar sesión");
    }
  }

  async function handleChangeAvatar() {
    if (avatarUploadingRef.current) return;

    console.log("[Avatar] user exists", Boolean(user));

    if (!user) {
      Alert.alert("Inicia sesión", "Debes iniciar sesión para actualizar tu avatar.");
      return;
    }

    if (!profile) {
      Alert.alert("Perfil no disponible", "No se pudo cargar tu perfil.");
      return;
    }

    avatarUploadingRef.current = true;

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permiso requerido",
          "Se necesita permiso para acceder a la galería. Habilítalo desde configuración del dispositivo.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: false,
        selectionLimit: 1,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const selectedImage = result.assets[0];
      const fileExtension = selectedImage.fileName?.split(".").pop()?.toLowerCase() ?? null;
      console.log("[Avatar] selected asset uri exists", Boolean(selectedImage.uri));
      console.log("[Avatar] file name/ext", selectedImage.fileName ?? "unknown", fileExtension);
      console.log("[Avatar] mime type", selectedImage.mimeType ?? "unknown");
      console.log("[Avatar] file size", selectedImage.fileSize ?? "unknown");

      setAvatarUploading(true);
      const { publicUrl } = await uploadAvatarToStorage({
        userId: user.id,
        fileUri: selectedImage.uri,
        fileName: selectedImage.fileName ?? null,
        mimeType: selectedImage.mimeType ?? null,
        fileSize: selectedImage.fileSize ?? null,
      });

      try {
        console.log("[Avatar] update profile start");
        await updateMyProfile({
          username: profile.username,
          full_name: profile.full_name,
          bio: profile.bio,
          avatar_url: publicUrl,
        });
        console.log("[Avatar] update profile success");
      } catch (profileError: any) {
        console.log("[Avatar] update profile error", profileError?.message ?? "unknown");
        throw new Error("La imagen se subio, pero no se pudo actualizar el perfil.");
      }

      Alert.alert("Avatar actualizado", "Tu foto de perfil se actualizo correctamente.");
    } catch (error: any) {
      console.log("[Avatar] flow error", error?.message ?? "unknown");
      Alert.alert("Error al actualizar avatar", error.message ?? "No se pudo actualizar el avatar.");
    } finally {
      avatarUploadingRef.current = false;
      setAvatarUploading(false);
    }
  }

  function formatTotalHours(seconds: number) {
    if (!Number.isFinite(seconds) || seconds < 0) {
      return "0.0 h";
    }

    return `${(seconds / 3600).toFixed(1)} h`;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshHistory}
            tintColor={colors.primary}
          />
        }
      >
        <ProfileHeader onPressSettings={() => router.push("/profile/edit")} />

        <View style={{ paddingHorizontal: 16, marginTop: -48 }}>
          <ProfileSummaryCard
            fullName={profile?.full_name}
            username={profile?.username}
            email={user?.email}
            avatarUrl={profile?.avatar_url}
            avatarUploading={avatarUploading}
            completedRoutes={stats.completedTrips}
            totalTime={formatTotalHours(stats.totalDurationS)}
            kilometers={stats.totalDistanceKm}
            onPressAvatar={handleChangeAvatar}
            onPreviewAvatar={() => setAvatarPreviewVisible(true)}
          />

          <View style={{ marginTop: 20 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
                gap: 12,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 18,
                    fontWeight: "700",
                    marginBottom: 4,
                  }}
                >
                  Historial reciente
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                  Tus ultimos 3 recorridos completados
                </Text>
              </View>

              <Pressable
                onPress={() => router.push("/profile/history")}
                style={{
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.cardSecondary,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                }}
              >
                <Text style={{ color: colors.textSecondary, fontWeight: "600" }}>
                  Ver historial completo
                </Text>
              </Pressable>
            </View>

            {pendingSyncCount > 0 ? (
              <View
                style={{
                  marginBottom: 12,
                  backgroundColor: colors.cardSecondary,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 12,
                  padding: 10,
                }}
              >
                <Text style={{ color: colors.textSecondary }}>
                  Tienes {pendingSyncCount} recorrido(s) pendiente(s) de sincronizar. El historial
                  muestra recorridos ya sincronizados.
                </Text>
              </View>
            ) : null}

            {loading ? (
              <Text style={{ color: colors.textSecondary, marginBottom: 18 }}>
                Cargando historial...
              </Text>
            ) : error ? (
              <View style={{ marginBottom: 18 }}>
                <Text style={{ color: colors.danger, marginBottom: 10 }}>{error}</Text>
                <Pressable
                  onPress={refreshHistory}
                  style={{
                    alignSelf: "flex-start",
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.cardSecondary,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                  }}
                >
                  <Text style={{ color: colors.textSecondary, fontWeight: "600" }}>
                    Reintentar
                  </Text>
                </Pressable>
              </View>
            ) : trips.length === 0 ? (
              <View style={{ marginBottom: 18 }}>
                <HistoryEmptyState />
              </View>
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

            <ProfileSection title="Actividad">
              <ProfileMenuItem
                label="Ver estadísticas"
                iconName="bar-chart-2"
                onPress={() => router.push('/profile/stats')}
              />
            </ProfileSection>

            <ProfileSection title="Configuración">
              <ProfileMenuItem
                label="Editar Perfil"
                iconName="user"
                onPress={() => router.push('/profile/edit')}
              />
              <View style={{ height: 1, backgroundColor: colors.border }} />

              {canModerate ? (
                <>
                  <ProfileMenuItem
                    label="Moderacion de contenido"
                    iconName="shield"
                    onPress={() => router.push('/moderation/index' as never)}
                  />
                  <View style={{ height: 1, backgroundColor: colors.border }} />
                </>
              ) : null}

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
                label="Cerrar sesión"
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
      <ImagePreviewModal
        visible={avatarPreviewVisible}
        imageUrl={profile?.avatar_url ?? null}
        onClose={() => setAvatarPreviewVisible(false)}
      />
    </SafeAreaView>
  );
}
