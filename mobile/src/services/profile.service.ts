import { supabase } from "../lib/supabase";
import type { Profile } from "../types/profile";

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

export async function createProfile(params: CreateProfileParams) {
  const { data, error } = await supabase
    .from("profiles")
    .insert({
      id: params.id,
      username: params.username,
      full_name: params.full_name ?? null,
      avatar_url: params.avatar_url ?? null,
      bio: params.bio ?? null,
    })
    .select()
    .single();

  if (error) {
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
  const { data, error } = await supabase
    .from("profiles")
    .update({
      username: params.username,
      full_name: params.full_name ?? null,
      avatar_url: params.avatar_url ?? null,
      bio: params.bio ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    throw error;
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
