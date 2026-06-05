import { useState, useEffect, useRef, useCallback } from "react";
import { ScrollText, X, Clock, User, Database, ArrowRightLeft, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { fetchLogs, formatLogMessage, formatLogTimestamp } from "@/lib/logs";
import type { LogEntry } from "@/lib/logs";

type TabelaFilter = "" | "embarques" | "ocorrencias" | "clientes";

const FILTERS: { key: TabelaFilter; label: string }[] = [
  { key: "embarques", label: "Embarques" },
  { key: "ocorrencias", label: "Ocorrências" },
  { key: "clientes", label: "Clientes" },
];

const FILTER_LABEL: Record<string, string> = {
  embarques: "Embarques",
  ocorrencias: "Ocorrências",
  clientes: "Clientes",
};

const FILTER_COLOR: Record<string, string> = {
  embarques: "border-l-blue-500 bg-blue-500/5",
  ocorrencias: "border-l-amber-500 bg-amber-500/5",
  clientes: "border-l-emerald-500 bg-emerald-500/5",
};

export function Logs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [filter, setFilter] = useState<TabelaFilter>("embarques");
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const feedRef = useRef<HTMLDivElement>(null);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchLogs(filter || undefined, { limit: 20, offset: 0 });
      setLogs(result.logs);
      setHasMore(result.hasMore);
    } catch {
      setLogs([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  useEffect(() => {
    const channel = supabase
      .channel("public:logs")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "logs" },
        async (payload) => {
          const novo = payload.new as LogEntry;
          if (novo.usuario_id) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("nome")
              .eq("id", novo.usuario_id)
              .single();
            novo.usuario_nome = (profile as { nome: string } | null)?.nome ?? null;
          }
          setLogs((prev) => {
            if (prev.some((l) => l.id === novo.id)) return prev;
            const tabela = filter || undefined;
            if (tabela && novo.tabela !== tabela) return prev;
            return [novo, ...prev];
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [filter]);

  async function handleLoadMore() {
    setLoadingMore(true);
    try {
      const result = await fetchLogs(filter || undefined, { limit: 20, offset: logs.length });
      setLogs((prev) => [...prev, ...result.logs]);
      setHasMore(result.hasMore);
    } catch {
      // silent
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-3 border-l-2 border-primary pl-3">
        <ScrollText className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-semibold">Logs</h1>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors ${
              filter === f.key
                ? "bg-primary text-primary-foreground shadow-glow"
                : "border border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Feed */}
      <div ref={feedRef} className="flex flex-col gap-2">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card py-16 text-sm text-muted-foreground">
            <ScrollText className="h-8 w-8 opacity-20" />
            <span>Nenhum log encontrado</span>
          </div>
        ) : (
          <>
            {logs.map((log) => (
              <motion.button
                key={log.id}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setSelectedLog(log)}
                className={`flex w-full items-start gap-3 rounded-xl border border-border bg-card p-4 text-left transition-all hover:shadow-glow ${FILTER_COLOR[log.tabela] || "border-l-border"}`}
                style={{ borderLeftWidth: 3 }}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-snug text-foreground">{formatLogMessage(log)}</p>
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatLogTimestamp(log.created_at)}
                    <span className="mx-1">·</span>
                    <Database className="h-3 w-3" />
                    {FILTER_LABEL[log.tabela] || log.tabela}
                  </p>
                </div>
              </motion.button>
            ))}
            {hasMore && (
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-4 py-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
              >
                {loadingMore ? (
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
                {loadingMore ? "Carregando..." : "Carregar mais"}
              </button>
            )}
          </>
        )}
      </div>

      {/* Slide-over */}
      <AnimatePresence>
        {selectedLog && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-[9998] bg-black/40"
              onClick={() => setSelectedLog(null)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed right-0 top-0 z-[9999] flex h-full w-full max-w-md flex-col border-l border-border bg-card shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <h2 className="text-sm font-semibold">Detalhes do Log</h2>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5">
                <div className="space-y-5">
                  {/* User */}
                  <div>
                    <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                      <User className="h-3.5 w-3.5" />
                      Quem alterou
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      {selectedLog.usuario_nome || "Sistema"}
                    </p>
                  </div>

                  {/* Table */}
                  <div>
                    <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                      <Database className="h-3.5 w-3.5" />
                      Tabela
                    </div>
                    <p className="text-sm text-foreground">
                      {FILTER_LABEL[selectedLog.tabela] || selectedLog.tabela}
                    </p>
                  </div>

                  {/* Change description */}
                  <div>
                    <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                      <ArrowRightLeft className="h-3.5 w-3.5" />
                      O que mudou
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3 text-sm leading-relaxed text-foreground">
                      {formatLogMessage(selectedLog)}
                    </div>
                  </div>

                  {/* Raw values */}
                  {selectedLog.campo !== "criacao" && selectedLog.campo !== "exclusao" && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                          Valor Antigo
                        </div>
                        <div className="rounded-lg bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                          {selectedLog.valor_antigo || <span className="italic">vazio</span>}
                        </div>
                      </div>
                      <div>
                        <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                          Valor Novo
                        </div>
                        <div className="rounded-lg bg-muted/30 px-3 py-2 text-sm text-foreground">
                          {selectedLog.valor_novo || <span className="italic">vazio</span>}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Timestamp */}
                  <div>
                    <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                      <Clock className="h-3.5 w-3.5" />
                      Quando
                    </div>
                    <p className="text-sm text-foreground">
                      {new Date(selectedLog.created_at).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
