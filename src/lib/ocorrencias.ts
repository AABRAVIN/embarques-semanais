import { supabase } from "./supabase";
import type { Ocorrencia } from "@/types/ocorrencias";

export async function fetchOcorrencias(): Promise<Ocorrencia[]> {
  const { data, error } = await supabase
    .from("ocorrencias")
    .select("*")
    .order("data", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Ocorrencia[];
}

export async function createOcorrencia(
  input: { titulo: string; descricao: string; tipo: string },
  userId: string
): Promise<Ocorrencia> {
  const { data, error } = await supabase
    .from("ocorrencias")
    .insert({
      titulo: input.titulo,
      descricao: input.descricao,
      tipo: input.tipo,
      created_by: userId,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Ocorrencia;
}

export async function updateOcorrencia(
  id: string,
  input: { titulo?: string; descricao?: string; tipo?: string; status?: string }
): Promise<Ocorrencia> {
  const { data, error } = await supabase
    .from("ocorrencias")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as Ocorrencia;
}

export async function deleteOcorrencia(id: string): Promise<void> {
  const { error } = await supabase
    .from("ocorrencias")
    .delete()
    .eq("id", id);

  if (error) throw error;
}
