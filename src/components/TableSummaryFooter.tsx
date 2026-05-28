import { Truck, Bell, Pause, UserX, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Embarque } from "@/types/embarque";

const STATUS_ITEMS = [
  { key: "confirmado", label: "Confirmados", icon: Truck, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { key: "motorista_avisado", label: "Motorista Avisado", icon: Bell, color: "text-blue-500", bg: "bg-blue-500/10" },
  { key: "standby", label: "Não Confirmada", icon: Pause, color: "text-orange-500", bg: "bg-orange-500/10" },
  { key: "sem_motorista", label: "Sem Motorista", icon: UserX, color: "text-purple-500", bg: "bg-purple-500/10" },
  { key: "concluido", label: "Finalizadas", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
];

interface TableSummaryFooterProps {
  embarques: Embarque[];
}

export function TableSummaryFooter({ embarques }: TableSummaryFooterProps) {
  const counts: Record<string, number> = {};
  for (const emb of embarques) {
    counts[emb.status] = (counts[emb.status] ?? 0) + 1;
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
      {STATUS_ITEMS.map((item) => {
        const Icon = item.icon;
        const count = counts[item.key] ?? 0;
        return (
          <div
            key={item.key}
            className="flex items-center gap-2.5 rounded-lg border border-border bg-card px-3 py-2.5 transition-colors hover:bg-accent"
          >
            <div className={cn("flex h-7 w-7 items-center justify-center rounded-md", item.bg)}>
              <Icon className={cn("h-3.5 w-3.5", item.color)} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground truncate">{item.label}</p>
              <p className="text-sm font-bold">{count}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
