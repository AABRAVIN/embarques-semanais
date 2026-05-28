import { useState, useEffect, useCallback } from "react";
import { Plus, Filter } from "lucide-react";
import { DashboardCards } from "@/components/DashboardCards";
import { EmbarquesTable } from "@/components/EmbarquesTable";
import { RightPanel } from "@/components/RightPanel";
import { DayNav } from "@/components/DayNav";
import { listEmbarques } from "@/lib/embarques";
import type { Embarque } from "@/types/embarque";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function Dashboard() {
  const [embarques, setEmbarques] = useState<Embarque[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listEmbarques();
      setEmbarques(data);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao carregar dados"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const counts: Record<string, number> = {};
  for (const emb of embarques) {
    const status = emb.status;
    counts[status] = (counts[status] ?? 0) + 1;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex h-full"
    >
      {/* Main content */}
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-6">
        <DashboardCards counts={counts} total={embarques.length} />

        <DayNav selectedDate={selectedDate} onDateChange={setSelectedDate} />

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-2">
          <button className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all duration-200 hover:bg-accent hover:text-foreground hover:shadow-glow">
            <Filter className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Filtros avançados</span>
          </button>
          <button className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-all duration-200 hover:bg-primary/90 hover:shadow-glow">
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Novo embarque</span>
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className={cn("h-12 animate-pulse rounded-lg bg-muted")}
              />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center text-sm text-destructive">
            {error}
          </div>
        ) : (
          <EmbarquesTable embarques={embarques} onAction={fetchData} selectedDate={selectedDate} />
        )}
      </div>

      <RightPanel />
    </motion.div>
  );
}
