import { supabase } from "./supabase";
import type { Lembrete, LembreteInput } from "@/types/lembretes";

export async function fetchLembretes(userId?: string): Promise<Lembrete[]> {
  if (!userId) return [];

  const { data, error } = await supabase
    .from("lembretes")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Lembrete[];
}

export async function createLembrete(
  input: LembreteInput,
  userId: string
): Promise<Lembrete> {
  const { data, error } = await supabase
    .from("lembretes")
    .insert({
      user_id: userId,
      conteudo: input.conteudo,
      cor: input.cor ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Lembrete;
}

export async function updateLembrete(
  id: string,
  input: Partial<LembreteInput>
): Promise<Lembrete> {
  const { data, error } = await supabase
    .from("lembretes")
    .update({
      ...(input.conteudo !== undefined && { conteudo: input.conteudo }),
      ...(input.cor !== undefined && { cor: input.cor ?? null }),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as Lembrete;
}

export async function deleteLembrete(id: string): Promise<void> {
  const { error } = await supabase
    .from("lembretes")
    .delete()
    .eq("id", id);

  if (error) throw error;
}
