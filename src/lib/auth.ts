import { supabase } from "./supabase";
import type { Profile } from "@/types/profiles";

type ProfileInsert = Omit<Profile, "id" | "created_at" | "updated_at"> & {
  id: string;
  created_at: string;
  updated_at: string;
};

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signUp(
  email: string,
  password: string,
  nome: string,
  role: string = "usuario"
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { nome, role } },
  });
  if (error) throw error;

  if (data.user) {
    const profileRow: ProfileInsert = {
      id: data.user.id,
      nome,
      email,
      role,
      avatar_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const { error: profileError } = await supabase.from("profiles").insert(profileRow as never);
    if (profileError) throw profileError;
  }

  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) return null;
  return data;
}

export async function listProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
