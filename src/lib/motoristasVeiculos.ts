import { supabase } from "./supabaseClient";
import type { MotoristaVeiculo } from "@/types/motoristaVeiculo";

function parsePlacas(raw: unknown): string[] {
  // Suporte a array nativo do PostgreSQL (já vem como Array JS via Supabase)
  if (Array.isArray(raw)) {
    return raw.filter((p): p is string => typeof p === "string" && p.trim() !== "");
  }
  // Suporte a string JSON (caso a coluna seja TEXT e o valor esteja serializado)
  if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter((p): p is string => typeof p === "string" && p.trim() !== "");
    } catch {}
  }
  return [];
}

export async function createMotoristaVeiculo(input: {
  nome: string;
  placas: string[];
  capacidade: string;
  carroceria: string;
}) {
  const { error } = await supabase
    .from("motoristas_veiculos")
    .insert({ nome: input.nome, placas: JSON.stringify(input.placas), capacidade: input.capacidade, carroceria: input.carroceria });
  if (error) throw new Error(error.message ?? "Erro ao inserir registro.");
}

export async function updateMotoristaVeiculo(
  id: string,
  input: {
    nome: string;
    placas: string[];
    capacidade: string;
    carroceria: string;
  }
) {
  const { error } = await supabase
    .from("motoristas_veiculos")
    .update({ nome: input.nome, placas: JSON.stringify(input.placas), capacidade: input.capacidade, carroceria: input.carroceria })
    .eq("id", id);
  if (error) throw new Error(error.message ?? "Erro ao atualizar registro.");
}

export async function deleteMotoristaVeiculo(id: string) {
  const { error } = await supabase
    .from("motoristas_veiculos")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message ?? "Erro ao excluir registro.");
}

export async function searchMotoristasVeiculos(query: string): Promise<MotoristaVeiculo[]> {
  const q = `%${query}%`;
  const { data, error } = await supabase
    .from("motoristas_veiculos")
    .select("*")
    .or(`nome.ilike.${q},placas.ilike.${q}`)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message ?? "Erro ao pesquisar registros.");
  return ((data ?? []) as Record<string, unknown>[]).map((item) => ({
    ...item,
    placas: parsePlacas(item.placas),
  })) as MotoristaVeiculo[];
}

export async function listMotoristasVeiculos(): Promise<MotoristaVeiculo[]> {
  const { data, error } = await supabase
    .from("motoristas_veiculos")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message ?? "Erro ao listar registros.");
  return ((data ?? []) as Record<string, unknown>[]).map((item) => ({
    ...item,
    placas: parsePlacas(item.placas),
  })) as MotoristaVeiculo[];
}
