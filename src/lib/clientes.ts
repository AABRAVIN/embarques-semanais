import { supabase } from "./supabaseClient";
import type { Cliente } from "@/types/clientes";

export async function listClientes(): Promise<Cliente[]> {
  const { data, error } = await supabase
    .from("clientes")
    .select("*")
    .order("nome", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Cliente[];
}

export async function searchClientes(query: string): Promise<Cliente[]> {
  const q = `%${query}%`;
  const { data, error } = await supabase
    .from("clientes")
    .select("*")
    .or(`nome.ilike.${q},local.ilike.${q}`)
    .order("nome", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Cliente[];
}

export async function createCliente(
  input: { nome: string; local: string; frete_acordado: string; cond_pagamento: string }
) {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("clientes")
    .insert([{ ...input, local: input.local || null, frete_acordado: input.frete_acordado || null, cond_pagamento: input.cond_pagamento || null, created_at: now, updated_at: now }] as never);
  if (error) throw error;
}

export async function updateCliente(
  id: string,
  input: { nome: string; local: string; frete_acordado: string; cond_pagamento: string }
) {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("clientes")
    .update({ ...input, local: input.local || null, frete_acordado: input.frete_acordado || null, cond_pagamento: input.cond_pagamento || null, updated_at: now } as never)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteCliente(id: string) {
  const { error } = await supabase
    .from("clientes")
    .delete()
    .eq("id", id);
  if (error) throw error;
}
