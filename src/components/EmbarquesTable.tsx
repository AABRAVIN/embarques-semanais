import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { ActionDropdown } from "./ActionDropdown";
import { Pagination } from "./Pagination";
import { updateEmbarqueEmbStatus, updateEmbarqueMotStatus, clearEmbarqueMotStatus, updateEmbarqueMotorista, updateEmbarqueObs, type EmbarqueComOrigem } from "@/lib/embarques";
import { EditableCell } from "./EditableCell";
import type { Embarque, EmbStatus, MotStatus } from "@/types/embarque";

const STATUS_STYLE: Record<string, string> = {
  confirmado:
    "bg-emerald-500/15 text-emerald-500 border-emerald-500/25",
  standby:
    "bg-orange-500/15 text-orange-500 border-orange-500/25",
  concluido:
    "bg-emerald-500/15 text-emerald-500 border-emerald-500/25",
};

const STATUS_LABEL: Record<string, string> = {
  confirmado: "Confirmado",
  standby: "Não confirmada",
  concluido: "Finalizada",
};

const MOT_STATUS_STYLE: Record<string, string> = {
  avisado:
    "bg-amber-500/15 text-amber-500 border-amber-500/25",
  sem_motorista:
    "bg-purple-500/15 text-purple-500 border-purple-500/25",
};

const MOT_STATUS_LABEL: Record<string, string> = {
  avisado: "Motorista Avisado",
  sem_motorista: "Sem motorista",
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

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

function formatTitle(date: Date | null, dateFrom?: string, dateTo?: string) {
  if (dateFrom && dateTo) {
    if (dateFrom === dateTo) {
      try {
        const d = new Date(dateFrom + "T12:00:00");
        const dayName = DAY_NAMES[d.getDay()];
        const dayNum = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0");
        return `Embarques de ${dayName} (${dayNum}/${month})`;
      } catch {
        return `Embarques de ${dateFrom}`;
      }
    }
    // Check if it's a full month
    try {
      const fromDate = new Date(dateFrom + "T12:00:00");
      const toDate = new Date(dateTo + "T12:00:00");
      if (!isNaN(fromDate.getTime()) && !isNaN(toDate.getTime())) {
        const isFirstDay = fromDate.getDate() === 1;
        const expectedLastDay = new Date(fromDate.getFullYear(), fromDate.getMonth() + 1, 0).getDate();
        const isLastDay = toDate.getDate() === expectedLastDay;
        const isSameMonth = fromDate.getMonth() === toDate.getMonth() && fromDate.getFullYear() === toDate.getFullYear();
        if (isFirstDay && isLastDay && isSameMonth) {
          return `Embarques de ${MONTH_NAMES[fromDate.getMonth()]} de ${fromDate.getFullYear()}`;
        }
      }
    } catch {}

    const formatDDMM = (s: string) => {
      const parts = s.split("-");
      if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
      return s;
    };
    return `Embarques de ${formatDDMM(dateFrom)} até ${formatDDMM(dateTo)}`;
  }

  if (!date) return "Embarques da Semana";
  const dayName = DAY_NAMES[date.getDay()];
  const dayNum = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `Embarques de ${dayName} (${dayNum}/${month})`;
}

interface ColetaItem {
  local: string;
  quantidade: string;
  material: string;
}

interface LocalItem {
  local: string;
  quantidade: string;
}

function parseLocais(raw: string): LocalItem[] {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((item: unknown) =>
        typeof item === "string"
          ? { local: item, quantidade: "" }
          : { local: (item as Record<string, string>).local ?? "", quantidade: (item as Record<string, string>).quantidade ?? "" }
      );
    }
  } catch {}
  return raw.split(", ").filter(Boolean).map((s) => ({ local: s, quantidade: "" }));
}

function parseColetas(raw: string): ColetaItem[] {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((item: unknown) =>
        typeof item === "string"
          ? { local: item, quantidade: "", material: "" }
          : {
              local: (item as Record<string, string>).local ?? "",
              quantidade: (item as Record<string, string>).quantidade ?? "",
              material: (item as Record<string, string>).material ?? "",
            }
      );
    }
  } catch {}
  return raw.split(", ").filter(Boolean).map((s) => ({ local: s, quantidade: "", material: "" }));
}

function parseEntregas(raw: string): { local: string; quantidade: string }[] {
  return parseLocais(raw);
}

function formatarLocal(item: LocalItem): string {
  return item.quantidade ? `${item.local} (${item.quantidade})` : item.local;
}

function TableRow({ emb, onAction, onEdit }: { emb: Embarque; onAction?: () => void; onEdit?: (emb: Embarque) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [openSelector, setOpenSelector] = useState<"emb" | "mot" | null>(null);
  const [busyStatus, setBusyStatus] = useState(false);
  const embRef = useRef<HTMLButtonElement>(null);
  const motRef = useRef<HTMLButtonElement>(null);
  const [selectorPos, setSelectorPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  async function handleSaveMotorista(newValue: string) {
    await updateEmbarqueMotorista(emb.id, newValue);
    onAction?.();
  }

  async function handleSaveObs(newValue: string) {
    await updateEmbarqueObs(emb.id, newValue);
    onAction?.();
  }

  const updateSelectorPosition = useCallback((el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    setSelectorPos({ top: rect.bottom + 4, left: rect.left });
  }, []);

  useEffect(() => {
    if (!openSelector) return;
    const handleScroll = () => {
      const ref = openSelector === "emb" ? embRef.current : motRef.current;
      if (ref) updateSelectorPosition(ref);
    };
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleScroll);
    };
  }, [openSelector, updateSelectorPosition]);

  async function handleEmbStatusChange(status: EmbStatus) {
    setOpenSelector(null);
    if (status === (emb.status_embarque ?? emb.status)) return;
    setBusyStatus(true);
    try {
      await updateEmbarqueEmbStatus(emb.id, status);
      onAction?.();
    } catch (err) {
      console.error(err);
    } finally {
      setBusyStatus(false);
    }
  }

  async function handleMotStatusChange(status: MotStatus | "") {
    setOpenSelector(null);
    if (status === (emb.status_motorista ?? "")) return;
    setBusyStatus(true);
    try {
      if (status) {
        await updateEmbarqueMotStatus(emb.id, status as MotStatus);
      } else {
        await clearEmbarqueMotStatus(emb.id);
      }
      onAction?.();
    } catch (err) {
      console.error(err);
    } finally {
      setBusyStatus(false);
    }
  }

  const coletaItems = parseColetas(emb.fornecedor);
  const entregaItems = parseEntregas(emb.cliente);
  const origemItems = parseLocais(emb.fornecedor_cidade);
  const destinoItems = parseLocais(emb.cliente_cidade);

  const origemDisplayCompact = origemItems.length
    ? formatarLocal(origemItems[0])
    : emb.fornecedor_cidade || "";
  const destinoDisplayCompact = destinoItems.length
    ? formatarLocal(destinoItems[0])
    : emb.cliente_cidade || "";

  return (
    <>
      <tr
        className="border-b border-border transition-colors last:border-0 hover:bg-accent cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        <td className="whitespace-nowrap px-4 py-3.5 font-mono text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span
              className="transition-transform duration-300"
              style={{ transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}
            >
              <ChevronDown className="h-3 w-3" />
            </span>
            {emb.id.slice(0, 8)}
            {(emb as EmbarqueComOrigem)._source === "historico" && (
              <span className="ml-1 rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-semibold text-amber-500 border border-amber-500/25">
                HISTÓRICO
              </span>
            )}
          </div>
        </td>
        <td className="whitespace-nowrap px-4 py-3.5 text-sm font-medium">
          {(() => {
            const items = parseLocais(emb.cliente);
            if (!items.length) return emb.cliente;
            return (
              <span>
                {formatarLocal(items[0])}
                {items.length > 1 && <span className="ml-1 text-[10px] text-muted-foreground">...+{items.length - 1}</span>}
              </span>
            );
          })()}
        </td>
        <td className="whitespace-nowrap px-4 py-3.5 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{origemDisplayCompact}</span>
          {origemItems.length > 1 && <span className="ml-0.5 text-[10px] text-muted-foreground">...+{origemItems.length - 1}</span>}
          <span className="mx-1 text-muted-foreground">→</span>
          <span className="font-medium text-foreground">{destinoDisplayCompact}</span>
          {destinoItems.length > 1 && <span className="ml-0.5 text-[10px] text-muted-foreground">...+{destinoItems.length - 1}</span>}
        </td>
        <td className="whitespace-nowrap px-4 py-3.5">
          <button
            ref={embRef}
            onClick={(e) => { e.stopPropagation(); if (!busyStatus) { updateSelectorPosition(e.currentTarget); setOpenSelector(openSelector === "emb" ? null : "emb"); } }}
            disabled={busyStatus}
            className={cn(
              "inline-block rounded-md border px-2 py-0.5 text-[11px] font-semibold tracking-wide transition-colors hover:opacity-80 disabled:opacity-50",
              STATUS_STYLE[emb.status_embarque ?? emb.status] ?? ""
            )}
          >
            {STATUS_LABEL[emb.status_embarque ?? emb.status] ?? "-"}
          </button>
        </td>
        <td className="whitespace-nowrap px-4 py-3.5">
          <button
            ref={motRef}
            onClick={(e) => { e.stopPropagation(); if (!busyStatus) { updateSelectorPosition(e.currentTarget); setOpenSelector(openSelector === "mot" ? null : "mot"); } }}
            disabled={busyStatus}
            className={cn(
              "inline-block rounded-md border px-2 py-0.5 text-[11px] font-semibold tracking-wide transition-colors hover:opacity-80 disabled:opacity-50",
              MOT_STATUS_STYLE[emb.status_motorista ?? ""] ?? "text-muted-foreground border-border/40 bg-muted/30"
            )}
          >
            {MOT_STATUS_LABEL[emb.status_motorista ?? ""] ?? "-"}
          </button>
        </td>
        <td className="whitespace-nowrap px-4 py-3.5 text-xs text-muted-foreground">
          {formatDate(emb.data)}
        </td>
        <td className="whitespace-nowrap px-4 py-3.5">
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <ActionDropdown
              embarqueId={emb.id}
              embarque={emb}
              currentEmbStatus={emb.status_embarque ?? emb.status}
              currentMotStatus={emb.status_motorista ?? ""}
              onAction={() => onAction?.()}
              onEdit={onEdit}
            />
          </div>
        </td>
      </tr>

      {/* Status da Carga dropdown */}
      {openSelector === "emb" && createPortal(
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="fixed inset-0 z-[9998]"
            onClick={() => setOpenSelector(null)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.12 }}
            className="fixed z-[9999] w-44 overflow-hidden rounded-xl border border-border bg-card py-1 shadow-2xl shadow-glow"
            style={{ top: selectorPos.top, left: selectorPos.left }}
          >
            {(["confirmado", "standby", "concluido"] as EmbStatus[]).map((opt) => {
              const current = emb.status_embarque ?? emb.status;
              const isCurrent = opt === current;
              return (
                <button
                  key={opt}
                  onClick={() => handleEmbStatusChange(opt)}
                  disabled={isCurrent || busyStatus}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors",
                    isCurrent ? "text-primary" : "text-foreground hover:bg-accent"
                  )}
                >
                  <span className={cn("h-2 w-2 rounded-full shrink-0", isCurrent ? "bg-primary" : "bg-muted-foreground/30")} />
                  <span className="flex-1">{STATUS_LABEL[opt]}</span>
                  {isCurrent && <Check className="h-3.5 w-3.5 text-primary" />}
                </button>
              );
            })}
          </motion.div>
        </>,
        document.body
      )}

      {/* Status Motorista dropdown */}
      {openSelector === "mot" && createPortal(
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="fixed inset-0 z-[9998]"
            onClick={() => setOpenSelector(null)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.12 }}
            className="fixed z-[9999] w-44 overflow-hidden rounded-xl border border-border bg-card py-1 shadow-2xl shadow-glow"
            style={{ top: selectorPos.top, left: selectorPos.left }}
          >
            {(["avisado", "sem_motorista"] as MotStatus[]).map((opt) => {
              const current = emb.status_motorista ?? "";
              const isCurrent = opt === current;
              return (
                <button
                  key={opt}
                  onClick={() => handleMotStatusChange(opt)}
                  disabled={isCurrent || busyStatus}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors",
                    isCurrent ? "text-primary" : "text-foreground hover:bg-accent"
                  )}
                >
                  <span className={cn("h-2 w-2 rounded-full shrink-0", isCurrent ? "bg-primary" : "bg-muted-foreground/30")} />
                  <span className="flex-1">{MOT_STATUS_LABEL[opt]}</span>
                  {isCurrent && <Check className="h-3.5 w-3.5 text-primary" />}
                </button>
              );
            })}
            {emb.status_motorista && (
              <>
                <div className="mx-3 my-1 border-t border-border/50" />
                <button
                  onClick={() => handleMotStatusChange("")}
                  disabled={busyStatus}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-destructive transition-colors hover:bg-destructive/10"
                >
                  <X className="h-3.5 w-3.5" />
                  <span className="flex-1">Limpar</span>
                </button>
              </>
            )}
          </motion.div>
        </>,
        document.body
      )}
      <AnimatePresence>
        {expanded && (
          <motion.tr
            key={`${emb.id}-detail`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="border-b border-border bg-muted/30 overflow-hidden"
          >
              <td colSpan={7} className="px-4 py-3">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, delay: 0.05 }}
              >
                {(() => {
                  const fornecedorCities = (emb.fornecedor_cidade ?? "").split(" + ").map(s => s.trim()).filter(Boolean);
                  const entregaLocais = entregaItems.map(c => c.local).filter(Boolean);
                  const clienteNome = emb.cliente_cidade || "-";
                  const entregaLocaisStr = entregaLocais.length ? entregaLocais.join(" + ") : "";
                  const obsStr = emb.obs?.trim() || "-";
                  return (
                    <>
                      <div className="mb-3 rounded-lg bg-muted/50 px-3 py-2 text-xs leading-relaxed text-muted-foreground space-y-1">
                        <div>
                          <span className="font-medium text-foreground">Cliente:</span> {clienteNome}{entregaLocaisStr ? ` ${entregaLocaisStr}` : ""}
                        </div>
                        <div>
                          <span className="font-medium text-foreground">Motorista:</span>{" "}
                          <EditableCell
                            value={emb.motorista || ""}
                            onSave={handleSaveMotorista}
                            placeholder="Sem motorista"
                            displayClass="font-medium text-foreground"
                          />
                        </div>
                        <div className="pt-1 border-t border-border/40">
                          <span className="font-medium text-foreground">Placa:</span> {emb.placa || "-"} | <span className="font-medium text-foreground">Observações:</span>{" "}
                          <EditableCell
                            value={emb.obs?.trim() || ""}
                            onSave={handleSaveObs}
                            placeholder="Sem observações"
                            type="textarea"
                            displayClass="text-muted-foreground"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {coletaItems.length > 0 && (
                          <div>
                            <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Coletas (Fornecedores)</h4>
                            <div className="space-y-1">
                              {coletaItems.map((item, i) => {
                                const fornCity = fornecedorCities[i] || fornecedorCities[0] || item.local;
                                const matQtd = [item.material, item.quantidade].filter(Boolean).join("/");
                                return (
                                  <div key={i} className="flex items-center gap-1 text-xs">
                                    <span className="font-medium text-foreground">{fornCity}</span>
                                    {matQtd && <span className="text-muted-foreground">| {matQtd}</span>}
                                    <span className="text-muted-foreground">| {item.local}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        {entregaItems.length > 0 && (
                          <div>
                            <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Entregas</h4>
                            <div className="space-y-1">
                              {entregaItems.map((item, i) => (
                                <div key={i} className="flex items-center gap-2 text-xs">
                                  <span className="font-medium text-foreground">{item.local}</span>
                                  {item.quantidade && <span className="text-muted-foreground">({item.quantidade})</span>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}
                {!coletaItems.length && !entregaItems.length && (
                  <p className="text-xs text-muted-foreground">Nenhum detalhe disponível</p>
                )}
              </motion.div>
            </td>
          </motion.tr>
        )}
      </AnimatePresence>
    </>
  );
}

interface EmbarquesTableProps {
  embarques: Embarque[];
  onAction?: () => void;
  onEdit?: (emb: Embarque) => void;
  selectedDate?: Date | null;
  dateFrom?: string;
  dateTo?: string;
}

export function EmbarquesTable({ embarques, onAction, onEdit, selectedDate, dateFrom, dateTo }: EmbarquesTableProps) {
  return (
    <div className="flex flex-col gap-3">
      {/* Dynamic title */}
      <div className="flex items-center gap-3 border-l-2 border-primary pl-3">
        <h2 className="text-sm font-semibold">
          {formatTitle(selectedDate ?? null, dateFrom, dateTo)}
        </h2>
      </div>

      {/* Premium glass table */}
      <div className="overflow-visible rounded-xl border border-border bg-card transition-shadow duration-200 hover:shadow-glow">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted">
                {["ID", "Cliente", "Origem → Destino", "Status da Carga", "Status Motorista", "Data do Embarque"].map((h) => (
                  <th key={h} className="whitespace-nowrap px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {h}
                  </th>
                ))}
                <th className="px-4 py-3 text-right" />
              </tr>
            </thead>
            <tbody>
              {embarques.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-sm text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-3xl opacity-20">📦</span>
                      <span>Nenhum embarque encontrado</span>
                    </div>
                  </td>
                </tr>
              ) : (
                embarques.map((emb) => (
                  <TableRow key={emb.id} emb={emb} onAction={onAction} onEdit={onEdit} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <Pagination current={1} total={Math.max(1, Math.ceil(embarques.length / 10))} />
    </div>
  );
}
