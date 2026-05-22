import { supabase } from "../lib/supabase";
import type { Profile } from "../types/profile";
import type { PostgrestError, User } from "@supabase/supabase-js";

interface CreateProfileParams {
  id: string;
  username: string;
  full_name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
}

interface UpdateProfileParams {
  id: string;
  username?: string;
  full_name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
}

const PROFILE_TIMEOUT_MS = 8000;

function withTimeout<T>(promise: PromiseLike<T>, timeoutMs: number, message: string) {
  return Promise.race<T>([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(message)), timeoutMs);
    }),
  ]);
}

function isDuplicateUsernameError(error: unknown) {
  const pgError = error as PostgrestError | null;
  return Boolean(pgError && pgError.code === "23505" && pgError.message?.includes("username"));
}

function mapProfileUpdateErrorMessage(error: unknown) {
  if (isDuplicateUsernameError(error)) {
    return "Ese username ya esta en uso. Elige otro.";
  }

  const pgError = error as PostgrestError | null;
  return pgError?.message ?? "No se pudo actualizar el perfil.";
}

export async function createProfile(params: CreateProfileParams) {
  const { data, error } = await withTimeout(
    supabase
      .from("profiles")
      .insert({
        id: params.id,
        username: params.username,
        full_name: params.full_name ?? null,
        avatar_url: params.avatar_url ?? null,
        bio: params.bio ?? null,
      })
      .select()
      .single(),
    PROFILE_TIMEOUT_MS,
    "Timeout al crear perfil",
  );

  if (error) {
    if (isDuplicateUsernameError(error)) {
      throw new Error("Ese username ya esta en uso. Elige otro.");
    }
    throw error;
  }

  return data as Profile;
}

export async function getProfileById(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    throw error;
  }
  return data as Profile;
}

export async function updateProfile(params: UpdateProfileParams) {
  const normalizedUsername = params.username?.trim();

  const { data, error } = await supabase
    .from("profiles")
    .update({
      username: normalizedUsername,
      full_name: params.full_name ?? null,
      avatar_url: params.avatar_url ?? null,
      bio: params.bio ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    throw new Error(mapProfileUpdateErrorMessage(error));
  }

  return data as Profile;
}

export async function upsertProfile(params: CreateProfileParams) {
  const { data, error } = await supabase
    .from("profiles")
    .upsert({
      id: params.id,
      username: params.username,
      full_name: params.full_name ?? null,
      avatar_url: params.avatar_url ?? null,
      bio: params.bio ?? null,
      update_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw error;
  }
  return data as Profile;
}

function buildBaseUsername(user: User) {
  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
  const emailPrefix = user.email?.split("@")[0];
  const metadataName =
    typeof metadata.user_name === "string"
      ? metadata.user_name
      : typeof metadata.preferred_username === "string"
        ? metadata.preferred_username
        : typeof metadata.full_name === "string"
          ? metadata.full_name
          : typeof metadata.name === "string"
            ? metadata.name
        : null;

  const raw = emailPrefix ?? metadataName ?? user.id.slice(0, 8);
  const normalized = raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "")
    .replace(/^[._-]+|[._-]+$/g, "");

  if (normalized.length >= 3) return normalized.slice(0, 24);
  return `user_${user.id.slice(0, 8)}`;
}

async function isUsernameTaken(username: string) {
  const { data, error } = await withTimeout(
    supabase
      .from("profiles")
      .select("id")
      .eq("username", username)
      .maybeSingle(),
    PROFILE_TIMEOUT_MS,
    "Timeout al verificar username",
  );

  if (error) {
    throw error;
  }

  return Boolean(data);
}

async function resolveUniqueUsername(baseUsername: string) {
  if (!(await isUsernameTaken(baseUsername))) {
    return baseUsername;
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const suffix = Math.random().toString(36).slice(2, 6);
    const candidate = `${baseUsername.slice(0, 19)}_${suffix}`;

    if (!(await isUsernameTaken(candidate))) {
      return candidate;
    }
  }

  return `${baseUsername.slice(0, 15)}_${Date.now().toString(36).slice(-6)}`;
}

export async function ensureProfileForUser(user: User) {
  console.log("[ProfileService] ensureProfileForUser start:", user.id);
  console.log("[ProfileService] checking existing profile");

  const { data: existingProfile, error: existingError } = await withTimeout(
    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle(),
    PROFILE_TIMEOUT_MS,
    "Timeout al buscar perfil existente",
  );

  if (existingError) {
    console.log("[ProfileService] existing profile query error:", existingError.message);
    throw existingError;
  }

  console.log("[ProfileService] existing profile found:", Boolean(existingProfile));

  if (existingProfile) {
    console.log("[ProfileService] ensureProfileForUser finished:", user.id);
    return existingProfile as Profile;
  }

  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
  const fullName =
    typeof metadata.full_name === "string"
      ? metadata.full_name
      : typeof metadata.name === "string"
        ? metadata.name
        : null;
  const avatarUrl =
    typeof metadata.avatar_url === "string"
      ? metadata.avatar_url
      : typeof metadata.picture === "string"
        ? metadata.picture
        : null;

  const baseUsername = buildBaseUsername(user);
  let username = await resolveUniqueUsername(baseUsername);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      console.log("[ProfileService] creating profile", { userId: user.id, attempt: attempt + 1 });
      const profile = await createProfile({
        id: user.id,
        username,
        full_name: fullName,
        avatar_url: avatarUrl,
        bio: null,
      });
      console.log("[ProfileService] create profile success");
      console.log("[ProfileService] ensureProfileForUser finished:", user.id);
      return profile;
    } catch (error: any) {
      if (isDuplicateUsernameError(error)) {
        username = `${baseUsername.slice(0, 18)}_${Math.random().toString(36).slice(2, 5)}`;
        console.log("[ProfileService] create profile duplicate username, retrying");
        continue;
      }

      console.log("[ProfileService] create profile error:", error?.message ?? "unknown");
      throw error;
    }
  }

  console.log("[ProfileService] create profile error: no se pudo generar username unico");
  throw new Error("No se pudo crear el perfil del usuario");
}
