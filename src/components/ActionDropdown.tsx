import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  MoreHorizontal,
  CheckCircle2,
  Bell,
  UserX,
  Pencil,
  Trash2,
  Calendar,
  CalendarDays,
  Pause,
  Check,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { updateEmbarqueEmbStatus, updateEmbarqueMotStatus, deleteEmbarque, moveEmbarqueDate } from "@/lib/embarques";
import type { EmbStatus, MotStatus } from "@/types/embarque";
import type { Embarque } from "@/types/embarque";

interface ActionDropdownProps {
  embarqueId: string;
  embarque: Embarque;
  currentEmbStatus?: string | null;
  currentMotStatus?: string | null;
  onAction: () => void;
  onEdit?: (emb: Embarque) => void;
}

interface ActionItem {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  destructive?: boolean;
}

const EMB_GROUP: ActionItem[] = [
  { key: "confirmado", label: "Confirmar", icon: CheckCircle2, color: "text-emerald-500" },
  { key: "standby", label: "Não Confirmar", icon: Pause, color: "text-orange-500" },
  { key: "concluido", label: "Finalizar", icon: CheckCircle2, color: "text-emerald-500" },
];

const MOT_GROUP: ActionItem[] = [
  { key: "avisado", label: "Motorista Avisado", icon: Bell, color: "text-amber-500" },
  { key: "sem_motorista", label: "Sem motorista", icon: UserX, color: "text-red-500" },
];

const ACTION_GROUP: ActionItem[] = [
  { key: "editar", label: "Editar", icon: Pencil, color: "text-blue-500" },
  { key: "excluir", label: "Excluir", icon: Trash2, color: "text-destructive", destructive: true },
  { key: "mover_data", label: "Mover Data", icon: Calendar, color: "text-purple-500" },
];

const EMB_KEYS = new Set(EMB_GROUP.map((a) => a.key));
const MOT_KEYS = new Set(MOT_GROUP.map((a) => a.key));

export function ActionDropdown({ embarqueId, embarque, currentEmbStatus, currentMotStatus, onAction, onEdit }: ActionDropdownProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [moveDateTarget, setMoveDateTarget] = useState<string | null>(null);
  const [moveDateValue, setMoveDateValue] = useState("");
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ top?: number; bottom?: number; right: number }>({ top: 0, right: 0 });

  const updatePosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const right = window.innerWidth - rect.right;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      if (spaceBelow >= 240 || spaceBelow >= spaceAbove) {
        setPos({ top: rect.bottom + 4, right });
      } else {
        setPos({ bottom: window.innerHeight - rect.top + 4, right });
      }
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, updatePosition]);

  async function handleAction(key: string) {
    setOpen(false);
    if (key === "editar") { onEdit?.(embarque); return; }
    if (key === "mover_data") {
      const currentDate = embarque.data ? embarque.data.slice(0, 10) : new Date().toISOString().slice(0, 10);
      setMoveDateValue(currentDate);
      setMoveDateTarget(embarqueId);
      return;
    }
    if (key === "excluir") {
      if (!window.confirm("Tem certeza que deseja excluir este embarque?")) return;
      setBusy(true);
      try { await deleteEmbarque(embarqueId); onAction(); }
      catch (err) { console.error(err); }
      finally { setBusy(false); }
      return;
    }
    setBusy(true);
    try {
      if (EMB_KEYS.has(key)) {
        await updateEmbarqueEmbStatus(embarqueId, key as EmbStatus);
      } else if (MOT_KEYS.has(key)) {
        await updateEmbarqueMotStatus(embarqueId, key as MotStatus);
      }
      onAction();
    } catch (err) { console.error(err); }
    finally { setBusy(false); }
  }

  function renderGroup(items: ActionItem[], currentValue?: string | null) {
    return items.map((action) => {
      const Icon = action.icon;
      const isCurrent = action.key === currentValue;
      if (action.key === "concluido" && currentEmbStatus === "concluido") return null;
      return (
        <button
          key={action.key}
          onClick={() => handleAction(action.key)}
          disabled={busy}
          className={cn(
            "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors",
            action.destructive ? "text-destructive hover:bg-destructive/10" : "text-foreground hover:bg-accent"
          )}
        >
          <Icon className={cn("h-4 w-4 shrink-0", action.color)} />
          <span className="flex-1">{action.label}</span>
          {isCurrent && <Check className="h-3.5 w-3.5 text-primary" />}
        </button>
      );
    });
  }

  async function handleMoveDate() {
    if (!moveDateTarget || !moveDateValue) return;
    setBusy(true);
    try {
      await moveEmbarqueDate(moveDateTarget, moveDateValue);
      onAction();
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(false);
      setMoveDateTarget(null);
      setMoveDateValue("");
    }
  }

  const headerClass = "px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50";
  const separatorClass = "mx-3 my-1 border-t border-border/50";

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => { updatePosition(); setOpen(true); }}
        disabled={busy}
        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
        title="Ações"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {createPortal(
        <AnimatePresence>
          {open && (
            <>
              <motion.div
                key="action-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1 }}
                className="fixed inset-0 z-[9998]"
                onClick={() => setOpen(false)}
              />
              <motion.div
                key="action-dropdown"
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                transition={{ duration: 0.12 }}
                className="fixed z-[9999] w-56 overflow-y-auto rounded-xl border border-border bg-card py-1 shadow-2xl shadow-glow"
                style={{ top: pos.top, bottom: pos.bottom, right: pos.right, maxHeight: "80vh" }}
              >
                <div className={headerClass}>Ações de Embarque</div>
                {renderGroup(EMB_GROUP, currentEmbStatus)}

                <div className={separatorClass} />

                <div className={headerClass}>Ações de Motorista</div>
                {renderGroup(MOT_GROUP, currentMotStatus)}

                <div className={separatorClass} />

                <div className={headerClass}>Ações</div>
                {renderGroup(ACTION_GROUP)}
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Mover Data modal */}
      {moveDateTarget && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60" onClick={() => setMoveDateTarget(null)}>
          <div
            className="w-full max-w-sm rounded-xl border border-border bg-card p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">Mover Data</h3>
              </div>
              <button
                onClick={() => setMoveDateTarget(null)}
                className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4">
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Selecione a nova data
              </label>
              <input
                type="date"
                value={moveDateValue}
                onChange={(e) => setMoveDateValue(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
              />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setMoveDateTarget(null)}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                Cancelar
              </button>
              <button
                onClick={handleMoveDate}
                disabled={busy || !moveDateValue}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? (
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                ) : (
                  <CalendarDays className="h-3.5 w-3.5" />
                )}
                {busy ? "Movendo..." : "Mover"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
