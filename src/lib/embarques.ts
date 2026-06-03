import { supabase } from "./supabaseClient";
import type { Embarque, EmbarqueStatus, EmbStatus, MotStatus } from "@/types/embarque";

export async function logChange(params: {
  registro_id: string;
  campo: string;
  valor_antigo: string | null;
  valor_novo: string | null;
  usuario_id: string | null;
}) {
  const { error } = await supabase
    .from("logs")
    .insert([{ tabela: "embarques", ...params }] as never);
  if (error) console.error("Erro ao registrar log:", error);
}

export async function updateEmbarqueMotorista(
  id: string,
  motorista: string,
  oldMotorista: string | null,
  usuarioId: string | null
) {
  const { error } = await supabase
    .from("embarques")
    .update({ motorista: motorista || null, updated_at: new Date().toISOString() } as never)
    .eq("id", id);
  if (error) throw error;
  await logChange({
    registro_id: id,
    campo: "motorista",
    valor_antigo: oldMotorista,
    valor_novo: motorista || null,
    usuario_id: usuarioId,
  });
}

export async function updateEmbarqueObs(
  id: string,
  obs: string,
  oldObs: string | null,
  usuarioId: string | null
) {
  const { error } = await supabase
    .from("embarques")
    .update({ obs: obs || null, updated_at: new Date().toISOString() } as never)
    .eq("id", id);
  if (error) throw error;
  await logChange({
    registro_id: id,
    campo: "obs",
    valor_antigo: oldObs,
    valor_novo: obs || null,
    usuario_id: usuarioId,
  });
}

export async function createEmbarque(input: {
  data: string;
  fornecedor: string;
  fornecedor_cidade: string;
  cliente: string;
  cliente_cidade: string;
  qtd: string;
  material: string;
  placa: string;
  motorista: string | null;
  motorista_id: string | null;
  obs: string | null;
  status: string;
  status_embarque: string;
  status_motorista: string;
  destaque: string;
}) {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("embarques")
    .insert([{ ...input, created_at: now, updated_at: now }] as never);
  if (error) throw error;
}

export async function updateEmbarqueStatus(
  id: string,
  status: EmbarqueStatus
) {
  const payload: Record<string, string | null> = { status };

  if (status === "motorista_avisado") {
    payload.avisado_at = new Date().toISOString();
  }

  if (status === "concluido") {
    payload.confirmado_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("embarques")
    .update(payload as never)
    .eq("id", id);

  if (error) throw error;
}

export async function updateEmbarqueEmbStatus(id: string, status_embarque: EmbStatus) {
  const { data: current } = await supabase
    .from("embarques")
    .select("status_motorista")
    .eq("id", id)
    .single();
  const motStatus = (current?.status_motorista as MotStatus | null) ?? null;
  let status: string = status_embarque;
  if (motStatus === "avisado") status = "motorista_avisado";
  else if (motStatus === "sem_motorista") status = "sem_motorista";
  const payload: Record<string, string | null> = { status_embarque, status };
  if (status_embarque === "concluido") {
    payload.confirmado_at = new Date().toISOString();
  }
  const { error } = await supabase
    .from("embarques")
    .update(payload as never)
    .eq("id", id);
  if (error) throw error;
}

export async function updateEmbarqueMotStatus(id: string, status_motorista: MotStatus) {
  const status = status_motorista === "avisado" ? "motorista_avisado" : "sem_motorista";
  const payload: Record<string, string | null> = { status_motorista, status };
  if (status_motorista === "avisado") {
    payload.avisado_at = new Date().toISOString();
  }
  const { error } = await supabase
    .from("embarques")
    .update(payload as never)
    .eq("id", id);
  if (error) throw error;
}

export async function clearEmbarqueMotStatus(id: string) {
  const { data: current } = await supabase
    .from("embarques")
    .select("status_embarque")
    .eq("id", id)
    .single();
  const status = (current?.status_embarque as string) ?? "standby";
  const { error } = await supabase
    .from("embarques")
    .update({ status_motorista: null, status, avisado_at: null } as never)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteEmbarque(id: string) {
  const { error } = await supabase.from("embarques").delete().eq("id", id);
  if (error) throw error;
}

export async function updateEmbarque(
  id: string,
  input: {
    data: string;
    fornecedor: string;
    fornecedor_cidade: string;
    cliente: string;
    cliente_cidade: string;
    qtd: string;
    material: string;
    placa: string;
    motorista: string | null;
    motorista_id: string | null;
    obs: string | null;
    status: string;
    status_embarque: string;
    status_motorista: string;
    destaque: string;
  }
) {
  const { error } = await supabase
    .from("embarques")
    .update({ ...input, updated_at: new Date().toISOString() } as never)
    .eq("id", id);
  if (error) throw error;
}

export async function moveEmbarqueDate(id: string, novaData: string) {
  const { error } = await supabase
    .from("embarques")
    .update({ data: novaData } as never)
    .eq("id", id);
  if (error) throw error;
}

export async function searchEmbarques(query: string): Promise<Embarque[]> {
  const q = `%${query}%`;
  const { data, error } = await supabase
    .from("embarques")
    .select("*")
    .or(`cliente_cidade.ilike.${q},placa.ilike.${q},motorista.ilike.${q},fornecedor_cidade.ilike.${q},material.ilike.${q}`)
    .order("data", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Embarque[];
}

export async function listEmbarques(dateFrom?: string, dateTo?: string): Promise<Embarque[]> {
  let query = supabase.from("embarques").select("*");
  if (dateFrom) query = query.gte("data", dateFrom);
  if (dateTo) query = query.lte("data", dateTo);
  const { data, error } = await query.order("data", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Embarque[];
}

export async function countConfirmado(dateFrom?: string, dateTo?: string): Promise<number> {
  let query = supabase
    .from("embarques")
    .select("*", { count: "exact", head: true })
    .eq("status_embarque", "confirmado");
  if (dateFrom) query = query.gte("data", dateFrom);
  if (dateTo) query = query.lte("data", dateTo);
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

export async function countSemMotorista(dateFrom?: string, dateTo?: string): Promise<number> {
  let query = supabase
    .from("embarques")
    .select("*", { count: "exact", head: true })
    .eq("status_motorista", "sem_motorista");
  if (dateFrom) query = query.gte("data", dateFrom);
  if (dateTo) query = query.lte("data", dateTo);
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

export async function countByEmbStatus(status: EmbStatus, dateFrom?: string, dateTo?: string): Promise<number> {
  let query = supabase
    .from("embarques")
    .select("*", { count: "exact", head: true })
    .eq("status_embarque", status);
  if (dateFrom) query = query.gte("data", dateFrom);
  if (dateTo) query = query.lte("data", dateTo);
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

export async function countByMotStatus(status: MotStatus, dateFrom?: string, dateTo?: string): Promise<number> {
  let query = supabase
    .from("embarques")
    .select("*", { count: "exact", head: true })
    .eq("status_motorista", status);
  if (dateFrom) query = query.gte("data", dateFrom);
  if (dateTo) query = query.lte("data", dateTo);
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}
