import { useState, useEffect, useCallback } from "react";
import { Search, X, AlertCircle, Clock } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import type { Embarque } from "@/types/embarque";

function formatDate(date: string | null | undefined): string {
  if (!date) return "-";
  try {
    return new Date(date).toLocaleDateString("pt-BR");
  } catch {
    return date;
  }
}

function formatDateTime(date: string | null | undefined): string {
  if (!date) return "-";
  try {
    const d = new Date(date);
    return `${d.toLocaleDateString("pt-BR")} ${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
  } catch {
    return date;
  }
}

function statusLabel(status: string | null | undefined): string {
  if (status === "concluido") return "Concluído";
  if (status === "confirmado") return "Confirmado";
  if (status === "standby") return "Não confirmado";
  return status || "-";
}

export function Historico() {
  const [records, setRecords] = useState<Embarque[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState<number | null>(null);

  const [searchCliente, setSearchCliente] = useState("");
  const [searchPlaca, setSearchPlaca] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchHistorico = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { count, error: countError } = await supabase
        .from("embarques_historico")
        .select("*", { count: "exact", head: true });
      if (countError) throw countError;
      setTotalCount(count);

      let query = supabase
        .from("embarques_historico")
        .select("*")
        .order("data", { ascending: false });

      if (searchCliente.trim()) {
        const q = `%${searchCliente.trim()}%`;
        query = query.ilike("cliente_cidade", q);
      }
      if (searchPlaca.trim()) {
        const q = `%${searchPlaca.trim()}%`;
        query = query.ilike("placa", q);
      }
      if (dateFrom) query = query.gte("data", dateFrom);
      if (dateTo) query = query.lte("data", dateTo);

      const { data, error: fetchError } = await query.limit(500);
      if (fetchError) throw fetchError;
      setRecords((data ?? []) as Embarque[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar histórico.");
    } finally {
      setLoading(false);
    }
  }, [searchCliente, searchPlaca, dateFrom, dateTo]);

  useEffect(() => {
    fetchHistorico();
  }, [fetchHistorico]);

  const hasFilters = searchCliente || searchPlaca || dateFrom || dateTo;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <div className="flex items-center gap-3">
        <Clock className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-semibold">Histórico de Embarques</h1>
      </div>

      {/* Filtros */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-muted-foreground">
              <Search className="mr-1 inline h-3 w-3" />
              Cliente
            </label>
            <input
              type="text"
              value={searchCliente}
              onChange={(e) => setSearchCliente(e.target.value)}
              placeholder="Buscar por cliente..."
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-muted-foreground">
              <Search className="mr-1 inline h-3 w-3" />
              Placa
            </label>
            <input
              type="text"
              value={searchPlaca}
              onChange={(e) => setSearchPlaca(e.target.value)}
              placeholder="Ex: ABC-1234"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-muted-foreground">Data início</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/50 focus:ring-1 focus:ring-primary/30 [color-scheme:dark]"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-muted-foreground">Data fim</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/50 focus:ring-1 focus:ring-primary/30 [color-scheme:dark]"
            />
          </div>
        </div>
        {hasFilters && (
          <button
            onClick={() => { setSearchCliente(""); setSearchPlaca(""); setDateFrom(""); setDateTo(""); }}
            className="mt-3 flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
            Limpar filtros
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabela */}
      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold">
            Registros arquivados
            {!loading && (
              <span className="ml-1 font-normal text-muted-foreground">
                ({records.length}{totalCount !== null && totalCount !== records.length ? ` de ${totalCount} total` : ""})
              </span>
            )}
          </h2>
        </div>
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-8 animate-pulse rounded bg-muted" />
            ))}
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-16 text-center text-sm text-muted-foreground">
            <Clock className="h-8 w-8 opacity-20" />
            <span>Nenhum registro encontrado no histórico.</span>
          </div>
        ) : (
          <div className="table-responsive-wrapper">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted">
                  {["Data", "Cliente", "Origem", "Material", "Placa", "Motorista", "Status", "Arquivado em"].map((h) => (
                    <th key={h} className="whitespace-nowrap px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map((emb) => (
                  <tr key={emb.id} className="border-b border-border/50 transition-colors last:border-0 hover:bg-accent/50">
                    <td className="whitespace-nowrap px-4 py-3 text-xs">{formatDate(emb.data)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium">{emb.cliente_cidade || "-"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">{emb.fornecedor_cidade || "-"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">{emb.material || "-"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs font-mono text-muted-foreground">{emb.placa || "-"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">{emb.motorista || "-"}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-500">
                        {statusLabel(emb.status_embarque)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-[11px] text-muted-foreground">
                      {"arquivado_at" in emb ? formatDateTime((emb as unknown as Record<string, string>).arquivado_at) : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
