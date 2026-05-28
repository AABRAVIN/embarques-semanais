import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ActionDropdown } from "./ActionDropdown";
import { Pagination } from "./Pagination";
import { TableSummaryFooter } from "./TableSummaryFooter";
import type { Embarque } from "@/types/embarque";

const STATUS_STYLE: Record<string, string> = {
  confirmado:
    "bg-emerald-500/15 text-emerald-500 border-emerald-500/25",
  motorista_avisado:
    "bg-blue-500/15 text-blue-500 border-blue-500/25",
  standby:
    "bg-orange-500/15 text-orange-500 border-orange-500/25",
  sem_motorista:
    "bg-purple-500/15 text-purple-500 border-purple-500/25",
  concluido:
    "bg-emerald-500/15 text-emerald-500 border-emerald-500/25",
};

const STATUS_LABEL: Record<string, string> = {
  confirmado: "Confirmado",
  motorista_avisado: "Motorista Avisado",
  standby: "Não confirmada",
  sem_motorista: "Sem Motorista",
  concluido: "Finalizada",
};

const DAY_NAMES = [
  "domingo", "segunda-feira", "terça-feira", "quarta-feira",
  "quinta-feira", "sexta-feira", "sábado",
];

function formatDate(date: string | null | undefined) {
  if (!date) return "-";
  try {
    const d = new Date(date);
    return d.toLocaleDateString("pt-BR");
  } catch {
    return date;
  }
}

function formatTitle(date: Date | null) {
  if (!date) return "Embarques da Semana";
  const dayName = DAY_NAMES[date.getDay()];
  const dayNum = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `Embarques de ${dayName} (${dayNum}/${month})`;
}

interface EmbarquesTableProps {
  embarques: Embarque[];
  onAction?: () => void;
  selectedDate?: Date | null;
}

export function EmbarquesTable({ embarques, onAction, selectedDate }: EmbarquesTableProps) {
  return (
    <div className="flex flex-col gap-3">
      {/* Dynamic title */}
      <div className="flex items-center gap-3 border-l-2 border-primary pl-3">
        <h2 className="text-sm font-semibold">
          {formatTitle(selectedDate ?? null)}
        </h2>
      </div>

      {/* Premium glass table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card transition-shadow duration-200 hover:shadow-glow">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted">
                {["ID", "Cliente", "Origem → Destino", "Motorista", "Status", "Previsão", "Confirmado", "Avisado", "Ações"].map((h) => (
                  <th key={h} className="whitespace-nowrap px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {embarques.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center text-sm text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-3xl opacity-20">📦</span>
                      <span>Nenhum embarque encontrado</span>
                    </div>
                  </td>
                </tr>
              ) : (
                embarques.map((emb) => (
                  <tr
                    key={emb.id}
                    className="border-b border-border transition-colors last:border-0 hover:bg-accent"
                  >
                    <td className="whitespace-nowrap px-4 py-3.5 font-mono text-[11px] text-muted-foreground">
                      {emb.id.slice(0, 8)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-sm font-medium">
                      {emb.cliente}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{emb.fornecedor_cidade}</span>
                      <span className="mx-1 text-muted-foreground">→</span>
                      <span className="font-medium text-foreground">{emb.cliente_cidade}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-xs text-muted-foreground">
                      {emb.motorista ?? (
                        <span className="italic text-muted-foreground">Pendente</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <span
                        className={cn(
                          "inline-block rounded-md border px-2 py-0.5 text-[11px] font-semibold tracking-wide",
                          STATUS_STYLE[emb.status] ?? ""
                        )}
                      >
                        {STATUS_LABEL[emb.status] ?? emb.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-xs text-muted-foreground">
                      {formatDate(emb.data)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-xs text-muted-foreground">
                      {emb.confirmado_at ? (
                        <span className="flex items-center gap-1">
                          <Check className="h-3 w-3 text-emerald-500" />
                          {formatDate(emb.confirmado_at)}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <X className="h-3 w-3 text-red-400" />
                          Pendente
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-xs text-muted-foreground">
                      {emb.avisado_at ? (
                        <span className="flex items-center gap-1">
                          <Check className="h-3 w-3 text-emerald-500" />
                          {formatDate(emb.avisado_at)}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <X className="h-3 w-3 text-red-400" />
                          Pendente
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <ActionDropdown
                        embarqueId={emb.id}
                        currentStatus={emb.status}
                        onAction={() => onAction?.()}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <Pagination current={1} total={Math.max(1, Math.ceil(embarques.length / 10))} />

      {/* Summary footer */}
      <TableSummaryFooter embarques={embarques} />
    </div>
  );
}
