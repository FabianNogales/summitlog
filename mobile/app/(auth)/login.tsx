import { useEffect, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { AuthButton } from "../../src/components/auth/AuthButton";
import { AuthHeader } from "../../src/components/auth/AuthHeader";
import { AuthInput } from "../../src/components/auth/AuthInput";
import { AuthTabs } from "../../src/components/auth/AuthTabs";
import { useAuth } from "../../src/hooks/useAuth";
import { colors } from "../../src/theme/colors";
import {
  FORM_SCROLL_BOTTOM_PADDING,
  scrollToFocusedInput,
} from "../../src/utils/keyboard";

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, signInWithGoogle, user } = useAuth();
  const { authError } = useLocalSearchParams<{ authError?: string }>();
  const authErrorShownRef = useRef<string | null>(null);
  const scrollRef = useRef<ScrollView | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  useEffect(() => {
    const errorMessage =
      typeof authError === "string" ? authError.trim() : undefined;

    if (!errorMessage || authErrorShownRef.current === errorMessage) {
      return;
    }

    authErrorShownRef.current = errorMessage;
    Alert.alert("Error con Google", errorMessage);
  }, [authError]);

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

  async function handleGoogleLogin() {
    try {
      setIsGoogleSubmitting(true);
      console.log("[Login] Google sign-in started");
      const session = await signInWithGoogle();
      console.log("[Login] Google sign-in finished, hasSession:", Boolean(session));

      if (session) {
        router.replace("/(tabs)/home");
      }
    } catch (error: any) {
      if (error?.code === "oauth_cancelled") {
        console.log("[Login] Google sign-in cancelled by user");
        return;
      }

      console.log("[Login] Google sign-in error:", error?.message ?? "unknown");
      Alert.alert(
        "Error con Google",
        error?.message ?? "No se pudo iniciar sesión con Google",
      );
    } finally {
      setIsGoogleSubmitting(false);
      console.log("[Login] google loading false");
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{
            flexGrow: 1,
            padding: 20,
            paddingBottom: FORM_SCROLL_BOTTOM_PADDING,
          }}
          keyboardShouldPersistTaps="handled"
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
                onFocus={(event) => scrollToFocusedInput(scrollRef, event)}
              />

              <AuthInput
                label="Contraseña"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                iconName="lock"
                secureTextEntry
                onFocus={(event) => scrollToFocusedInput(scrollRef, event)}
              />

              <Pressable
                onPress={() =>
                  Alert.alert(
                    "Proximamente",
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

              <View style={{ height: 12 }} />

              <AuthButton
                title="Continuar con Google"
                onPress={handleGoogleLogin}
                loading={isGoogleSubmitting}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

