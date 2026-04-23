import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Redirect, useRouter } from "expo-router";

import { AuthButton } from "../../src/components/auth/AuthButton";
import { AuthHeader } from "../../src/components/auth/AuthHeader";
import { AuthInput } from "../../src/components/auth/AuthInput";
import { AuthTabs } from "../../src/components/auth/AuthTabs";
import { useAuth } from "../../src/hooks/useAuth";
import { colors } from "../../src/theme/colors";

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, user } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (user) {
    return <Redirect href="/(tabs)/home" />;
  }

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Campos incompletos", "Ingresa tu correo y tu contraseña.");
      return;
    }

    try {
      setIsSubmitting(true);
      await signIn(email.trim(), password);
    } catch (error: any) {
      Alert.alert(
        "Error al iniciar sesión",
        error.message ?? "No se pudo iniciar sesión",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{ padding: 20 }}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 28,
              overflow: "hidden",
            }}
          >
            <AuthHeader />

            <View style={{ padding: 20 }}>
              <AuthTabs
                activeTab="login"
                onPressLogin={() => {}}
                onPressRegister={() => router.replace("/(auth)/register")}
              />

              <AuthInput
                label="Correo electrónico"
                placeholder="tu@email.com"
                value={email}
                onChangeText={setEmail}
                iconName="mail"
                keyboardType="email-address"
              />

              <AuthInput
                label="Contraseña"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                iconName="lock"
                secureTextEntry
              />

              <Pressable
                onPress={() =>
                  Alert.alert(
                    "Próximamente",
                    "La recuperación de contraseña la implementaremos después.",
                  )
                }
                style={{ marginBottom: 24 }}
              >
                <Text
                  style={{
                    color: "#2E8B73",
                    textAlign: "right",
                    fontSize: 13,
                  }}
                >
                  ¿Olvidaste tu contraseña?
                </Text>
              </Pressable>

              <AuthButton
                title="Iniciar Sesión"
                onPress={handleLogin}
                loading={isSubmitting}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
