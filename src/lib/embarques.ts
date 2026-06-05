import { supabase } from "./supabaseClient";
import type { Embarque, EmbarqueStatus, EmbStatus, MotStatus } from "@/types/embarque";
import { BACKUP_BUCKET } from "./storage";

export type EmbarqueComOrigem = Embarque & { _source: "ativo" | "historico" };

export async function updateEmbarqueMotorista(
  id: string,
  motorista: string
) {
  const { error } = await supabase
    .from("embarques")
    .update({ motorista: motorista || null, updated_at: new Date().toISOString() } as never)
    .eq("id", id);
  if (error) throw error;
}

export async function updateEmbarqueObs(
  id: string,
  obs: string
) {
  const { error } = await supabase
    .from("embarques")
    .update({ obs: obs || null, updated_at: new Date().toISOString() } as never)
    .eq("id", id);
  if (error) throw error;
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

export async function searchEmbarques(query: string): Promise<EmbarqueComOrigem[]> {
  const q = query.toLowerCase();

  const { data: active, error } = await supabase
    .from("embarques")
    .select("*")
    .or(
      `cliente_cidade.ilike.%${q}%,placa.ilike.%${q}%,motorista.ilike.%${q}%,fornecedor_cidade.ilike.%${q}%,material.ilike.%${q}%`
    )
    .order("data", { ascending: false });
  if (error) throw error;

  const activeResults: EmbarqueComOrigem[] = ((active ?? []) as Embarque[]).map(
    (e) => ({ ...e, _source: "ativo" as const })
  );

  const historicoResults: EmbarqueComOrigem[] = [];

  try {
    const { data: files } = await supabase.storage
      .from(BACKUP_BUCKET)
      .list();

    if (files) {
      const jsonFiles = files.filter((f) => f.name.endsWith(".json"));

      for (const file of jsonFiles) {
        try {
          const { data: blob } = await supabase.storage
            .from(BACKUP_BUCKET)
            .download(file.name);

          if (!blob) continue;

          const text = await blob.text();
          const parsed: Embarque[] = JSON.parse(text);

          if (!Array.isArray(parsed)) continue;

          for (const item of parsed) {
            const match =
              (item.cliente_cidade ?? "").toLowerCase().includes(q) ||
              (item.placa ?? "").toLowerCase().includes(q) ||
              (item.motorista ?? "").toLowerCase().includes(q) ||
              (item.fornecedor_cidade ?? "").toLowerCase().includes(q) ||
              (item.material ?? "").toLowerCase().includes(q);

            if (match) {
              historicoResults.push({ ...item, _source: "historico" as const });
            }
          }
        } catch {
          // skip individual file errors
        }
      }
    }
  } catch {
    // bucket may not exist — continue with active only
  }

  const merged = [...activeResults, ...historicoResults].sort((a, b) => {
    const dateA = a.data ? new Date(a.data).getTime() : 0;
    const dateB = b.data ? new Date(b.data).getTime() : 0;
    return dateB - dateA;
  });

  return merged;
}

export async function listEmbarquesRelatorio(filters: {
  cliente?: string;
  regiao?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
}): Promise<Embarque[]> {
  let query = supabase.from("embarques").select("*");

  if (filters.dateFrom) query = query.gte("data", filters.dateFrom);
  if (filters.dateTo) query = query.lte("data", filters.dateTo);

  if (filters.cliente) {
    const q = `%${filters.cliente}%`;
    query = query.ilike("cliente_cidade", q);
  }

  if (filters.regiao) {
    const q = `%${filters.regiao}%`;
    query = query.or(`fornecedor_cidade.ilike.${q},cliente_cidade.ilike.${q}`);
  }

  if (filters.status === "andamento") {
    query = query.neq("status_embarque", "concluido");
  } else if (filters.status === "encerrados") {
    query = query.eq("status_embarque", "concluido");
  } else if (filters.status === "cancelados") {
    query = query.or("status_embarque.is.null,status_embarque.eq.standby");
  }

  const { data, error } = await query.order("data", { ascending: false });
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

export async function archiveConcludedEmbarques(dias: number = 30): Promise<number> {
  console.log("Iniciando busca de embarques concluídos...");
  const cutoff = new Date(Date.now() - dias * 24 * 60 * 60 * 1000).toISOString();

  try {
    console.log("Filtros: (status = 'concluido' OR status_embarque = 'concluido') AND updated_at <", cutoff);

    const { data: records, error: fetchError } = await supabase
      .from("embarques")
      .select("*")
      .or("status.eq.concluido,status_embarque.eq.concluido")
      .lt("updated_at", cutoff);

    console.log("Embarques encontrados:", records);
    console.log("Quantidade:", records?.length ?? 0);

    if (fetchError) throw fetchError;
    if (!records || records.length === 0) {
      console.log("Nenhum embarque concluído antigo encontrado.");
      return 0;
    }

    const ids = records.map((r) => r.id);

    const jsonStr = JSON.stringify(records, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const fileName = `embarques_${new Date().toISOString().replace(/[:.]/g, "-")}.json`;

    console.log("Tentando fazer upload do arquivo...");
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BACKUP_BUCKET)
      .upload(fileName, blob, { contentType: "application/json", upsert: true });

    if (uploadError) {
      console.error("Erro ao fazer upload:", uploadError);
      throw uploadError;
    }
    console.log("Upload realizado com sucesso:", uploadData);

    console.log("Inserindo", records.length, "registro(s) na tabela embarques_historico...");
    const historicoRows = records.map((r) => ({
      id: r.id,
      data: r.data,
      fornecedor: r.fornecedor,
      fornecedor_cidade: r.fornecedor_cidade,
      cliente: r.cliente,
      cliente_cidade: r.cliente_cidade,
      qtd: r.qtd,
      material: r.material,
      placa: r.placa,
      motorista: r.motorista,
      motorista_id: r.motorista_id,
      obs: r.obs,
      status: r.status,
      status_embarque: r.status_embarque,
      status_motorista: r.status_motorista,
      destaque: r.destaque,
      confirmado_at: r.confirmado_at,
      avisado_at: r.avisado_at,
      created_at: r.created_at,
      updated_at: r.updated_at,
      arquivado_at: new Date().toISOString(),
    }));
    const { data: insertData, error: insertError } = await supabase
      .from("embarques_historico")
      .insert(historicoRows as never)
      .select("id");

    if (insertError) {
      console.error("Erro ao inserir no histórico:", insertError);
      console.error("Payload do INSERT:", JSON.stringify(historicoRows[0]).slice(0, 300));
      throw insertError;
    }
    console.log("Inseridos no histórico com sucesso. IDs retornados:", insertData);

    console.log("Deletando", ids.length, "registro(s) da tabela ativa...");
    const { error: deleteError } = await supabase
      .from("embarques")
      .delete()
      .in("id", ids);

    if (deleteError) {
      console.error("Erro ao deletar registros:", deleteError);
      throw deleteError;
    }
    console.log("Registros deletados da tabela ativa com sucesso.");

    console.log("Arquivamento concluído. Total:", records.length);
    return records.length;

  } catch (error) {
    console.error("Erro ao arquivar:", error);
    throw error;
  }
}
