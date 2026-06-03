import { supabase } from "./supabaseClient";
import { logChange } from "./embarques";
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
  input: { nome: string; local: string; frete_acordado: string; cond_pagamento: string },
  usuarioId: string | null
) {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("clientes")
    .insert([{ ...input, local: input.local || null, frete_acordado: input.frete_acordado || null, cond_pagamento: input.cond_pagamento || null, created_at: now, updated_at: now }] as never);
  if (error) throw error;

  await logChange({
    registro_id: "",
    campo: "criacao",
    valor_antigo: null,
    valor_novo: `Cliente criado: ${input.nome}`,
    usuario_id: usuarioId,
  });
}

export async function updateCliente(
  id: string,
  input: { nome: string; local: string; frete_acordado: string; cond_pagamento: string },
  oldValues: { nome: string; local: string | null; frete_acordado: string | null; cond_pagamento: string | null },
  usuarioId: string | null
) {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("clientes")
    .update({ ...input, local: input.local || null, frete_acordado: input.frete_acordado || null, cond_pagamento: input.cond_pagamento || null, updated_at: now } as never)
    .eq("id", id);
  if (error) throw error;

  const changes: { campo: string; antigo: string | null; novo: string | null }[] = [];
  if (input.nome !== oldValues.nome) changes.push({ campo: "nome", antigo: oldValues.nome, novo: input.nome });
  if (input.local !== (oldValues.local ?? "")) changes.push({ campo: "local", antigo: oldValues.local, novo: input.local });
  if (input.frete_acordado !== (oldValues.frete_acordado ?? "")) changes.push({ campo: "frete_acordado", antigo: oldValues.frete_acordado, novo: input.frete_acordado });
  if (input.cond_pagamento !== (oldValues.cond_pagamento ?? "")) changes.push({ campo: "cond_pagamento", antigo: oldValues.cond_pagamento, novo: input.cond_pagamento });

  for (const c of changes) {
    await logChange({
      registro_id: id,
      campo: c.campo,
      valor_antigo: c.antigo,
      valor_novo: c.novo,
      usuario_id: usuarioId,
    });
  }
}

export async function deleteCliente(id: string, usuarioId: string | null) {
  const { error } = await supabase
    .from("clientes")
    .delete()
    .eq("id", id);
  if (error) throw error;

  await logChange({
    registro_id: id,
    campo: "exclusao",
    valor_antigo: null,
    valor_novo: "Cliente excluído",
    usuario_id: usuarioId,
  });
}
