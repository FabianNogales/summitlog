import { supabase } from "../lib/supabase";
import type { Profile } from "../types/profile";
import type { PostgrestError, User } from "@supabase/supabase-js";
import * as FileSystem from "expo-file-system/legacy";
import { decode as decodeBase64 } from "base64-arraybuffer";

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
export const MAX_PROFILE_USERNAME_LENGTH = 30;
export const MAX_PROFILE_FULL_NAME_LENGTH = 80;
export const MAX_PROFILE_BIO_LENGTH = 250;
export const AVATAR_BUCKET = "avatars";
export const MAX_AVATAR_IMAGE_SIZE_MB = 10;
const MAX_AVATAR_IMAGE_SIZE_BYTES = MAX_AVATAR_IMAGE_SIZE_MB * 1024 * 1024;
const SUPPORTED_AVATAR_MIME_TYPES = new Set(["image/jpeg", "image/jpg", "image/png"]);
const SUPPORTED_AVATAR_EXTENSIONS = new Set(["jpg", "jpeg", "png"]);

interface UploadAvatarParams {
  userId: string;
  fileUri: string;
  fileName?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
}

interface UploadAvatarResult {
  publicUrl: string;
  path: string;
}

type AvatarErrorCode =
  | "invalid_format"
  | "size_exceeded"
  | "file_read"
  | "arraybuffer_conversion"
  | "bucket_missing"
  | "storage_permission"
  | "storage_upload"
  | "public_url";

class AvatarUploadError extends Error {
  code: AvatarErrorCode;

  constructor(code: AvatarErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = "AvatarUploadError";
  }
}

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

function getFileExtension(fileName?: string | null) {
  return fileName?.split(".").pop()?.toLowerCase() ?? null;
}

function resolveAvatarContentType(mimeType?: string | null, extension?: string | null) {
  const normalizedMime = mimeType?.toLowerCase();

  if (normalizedMime === "image/png") {
    return "image/png";
  }

  if (normalizedMime === "image/jpeg" || normalizedMime === "image/jpg") {
    return "image/jpeg";
  }

  if (extension === "png") {
    return "image/png";
  }

  return "image/jpeg";
}

function isSupportedAvatar(mimeType?: string | null, fileName?: string | null) {
  const normalizedMime = mimeType?.toLowerCase() ?? "";
  const extension = getFileExtension(fileName);

  if (normalizedMime && SUPPORTED_AVATAR_MIME_TYPES.has(normalizedMime)) {
    return true;
  }

  if (extension && SUPPORTED_AVATAR_EXTENSIONS.has(extension)) {
    return true;
  }

  return false;
}

function normalizeStorageErrorFields(error: unknown) {
  if (!error || typeof error !== "object") {
    return {
      name: null,
      message: null,
      statusCode: null,
      details: null,
      errorCode: null,
    };
  }

  const raw = error as Record<string, unknown>;

  return {
    name: typeof raw.name === "string" ? raw.name : null,
    message: typeof raw.message === "string" ? raw.message : null,
    statusCode:
      typeof raw.statusCode === "string" || typeof raw.statusCode === "number"
        ? raw.statusCode
        : null,
    details: typeof raw.details === "string" ? raw.details : null,
    errorCode: typeof raw.error === "string" ? raw.error : null,
  };
}

function mapStorageUploadError(error: unknown) {
  const fields = normalizeStorageErrorFields(error);
  const combined = `${fields.message ?? ""} ${fields.details ?? ""} ${fields.errorCode ?? ""}`.toLowerCase();
  const statusCode = String(fields.statusCode ?? "");

  if (
    statusCode === "404" ||
    combined.includes("bucket not found") ||
    (combined.includes("not found") && combined.includes("bucket"))
  ) {
    return new AvatarUploadError("bucket_missing", "No existe el bucket de avatares en Storage.");
  }

  if (
    statusCode === "401" ||
    statusCode === "403" ||
    combined.includes("row-level security") ||
    combined.includes("permission denied") ||
    combined.includes("not allowed")
  ) {
    return new AvatarUploadError(
      "storage_permission",
      "No tienes permisos para subir avatar. Revisa policies del bucket avatars."
    );
  }

  return new AvatarUploadError("storage_upload", "No se pudo subir el avatar a Storage.");
}

function mapAvatarUploadError(error: unknown) {
  if (error instanceof AvatarUploadError) {
    return error;
  }

  const fields = normalizeStorageErrorFields(error);
  console.log("[Avatar] unknown error details", fields);

  return new AvatarUploadError("storage_upload", "No se pudo subir el avatar.");
}

export async function uploadAvatarToStorage(params: UploadAvatarParams): Promise<UploadAvatarResult> {
  console.log("[Avatar] bucket avatars");

  if (!isSupportedAvatar(params.mimeType, params.fileName)) {
    throw new AvatarUploadError("invalid_format", "Solo se permiten imagenes JPG o PNG.");
  }

  if ((params.fileSize ?? 0) > MAX_AVATAR_IMAGE_SIZE_BYTES) {
    throw new AvatarUploadError("size_exceeded", "La imagen supera el limite permitido.");
  }

  const extension =
    getFileExtension(params.fileName) || (params.mimeType?.includes("png") ? "png" : "jpg");
  const contentType = resolveAvatarContentType(params.mimeType, extension);
  const path = `${params.userId}/avatar-${Date.now()}.${extension}`;
  let base64Content: string;
  let arrayBuffer: ArrayBuffer;

  try {
    console.log("[Avatar] read base64 start");
    base64Content = await FileSystem.readAsStringAsync(params.fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    console.log("[Avatar] read base64 success");
  } catch (error) {
    console.log("[Avatar] file read error", normalizeStorageErrorFields(error));
    throw new AvatarUploadError("file_read", "No se pudo leer la imagen seleccionada.");
  }

  try {
    arrayBuffer = decodeBase64(base64Content);
    if (!arrayBuffer.byteLength) {
      throw new AvatarUploadError(
        "arraybuffer_conversion",
        "No se pudo convertir la imagen seleccionada."
      );
    }
    console.log("[Avatar] arrayBuffer size", arrayBuffer.byteLength);
  } catch (error) {
    console.log("[Avatar] arrayBuffer conversion error", normalizeStorageErrorFields(error));
    throw new AvatarUploadError(
      "arraybuffer_conversion",
      "No se pudo convertir la imagen seleccionada."
    );
  }

  try {
    console.log("[Avatar] upload start");
    const { error: uploadError } = await supabase.storage.from(AVATAR_BUCKET).upload(path, arrayBuffer, {
      contentType,
      upsert: true,
    });

    if (uploadError) {
      const mappedError = mapStorageUploadError(uploadError);
      console.log("[Avatar] upload error", {
        status: normalizeStorageErrorFields(uploadError).statusCode,
        message: normalizeStorageErrorFields(uploadError).message,
        name: normalizeStorageErrorFields(uploadError).name,
        details: normalizeStorageErrorFields(uploadError).details,
      });
      throw mappedError;
    }

    console.log("[Avatar] upload success path", path);
    const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
    console.log("[Avatar] public URL generated", Boolean(data.publicUrl));

    if (!data.publicUrl) {
      throw new AvatarUploadError("public_url", "No se pudo obtener la URL publica del avatar.");
    }

    return {
      publicUrl: data.publicUrl,
      path,
    };
  } catch (error) {
    throw mapAvatarUploadError(error);
  }
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
  const updatePayload: Partial<Pick<Profile, "username" | "full_name" | "avatar_url" | "bio">> & {
    updated_at: string;
  } = {
    updated_at: new Date().toISOString(),
  };

  if (params.username !== undefined) {
    updatePayload.username = normalizedUsername;
  }

  if (params.full_name !== undefined) {
    updatePayload.full_name = params.full_name;
  }

  if (params.avatar_url !== undefined) {
    updatePayload.avatar_url = params.avatar_url;
  }

  if (params.bio !== undefined) {
    updatePayload.bio = params.bio;
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(updatePayload)
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
