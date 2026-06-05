import { supabase } from "./supabaseClient";

export interface LogEntry {
  id: string;
  tabela: string;
  registro_id: string;
  campo: string;
  valor_antigo: string | null;
  valor_novo: string | null;
  usuario_id: string | null;
  created_at: string;
  usuario_nome?: string | null;
}

export async function fetchLogs(
  tabela?: string,
  options?: { limit?: number; offset?: number }
): Promise<{ logs: LogEntry[]; hasMore: boolean }> {
  const limit = options?.limit ?? 20;
  const offset = options?.offset ?? 0;

  let query = supabase
    .from("logs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (tabela) query = query.eq("tabela", tabela);

  const { data, error, count } = await query;
  if (error) throw error;

  const logs = (data ?? []) as LogEntry[];

  const userIds = [...new Set(logs.map((l) => l.usuario_id).filter(Boolean))] as string[];
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, nome")
      .in("id", userIds);

    const nameMap = new Map((profiles ?? []).map((p: { id: string; nome: string }) => [p.id, p.nome]));
    for (const log of logs) {
      log.usuario_nome = log.usuario_id ? nameMap.get(log.usuario_id) ?? null : null;
    }
  }

  const total = count ?? 0;
  return { logs, hasMore: offset + limit < total };
}

const TABELA_LABEL: Record<string, string> = {
  embarques: "Embarque",
  ocorrencias: "Ocorrência",
  clientes: "Cliente",
};

const CAMPO_LABEL: Record<string, string> = {
  motorista: "Motorista",
  obs: "Observações",
  nome: "Nome",
  local: "Local",
  frete_acordado: "Frete Acordado",
  cond_pagamento: "Cond. Pagamento",
  status_embarque: "Status da Carga",
  status_motorista: "Status Motorista",
  criacao: "criação",
  exclusao: "exclusão",
};

export function formatLogMessage(log: LogEntry): string {
  const nome = log.usuario_nome || "Sistema";
  const tabela = TABELA_LABEL[log.tabela] || log.tabela;
  const campo = CAMPO_LABEL[log.campo] || log.campo;

  if (log.campo === "criacao") return `${nome} cadastrou ${tabela.toLowerCase()}`;
  if (log.campo === "exclusao") return `${nome} excluiu ${tabela.toLowerCase()}`;

  const antigo = log.valor_antigo ? `"${log.valor_antigo}"` : "vazio";
  const novo = log.valor_novo ? `"${log.valor_novo}"` : "vazio";
  return `${nome} alterou ${campo} de ${antigo} para ${novo}`;
}

export function formatLogTimestamp(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  const data = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  const hora = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return `${data} às ${hora}`;
}
