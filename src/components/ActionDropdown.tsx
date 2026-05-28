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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { updateEmbarqueStatus, deleteEmbarque } from "@/lib/embarques";
import type { EmbarqueStatus } from "@/types/embarque";

interface ActionDropdownProps {
  embarqueId: string;
  currentStatus: string;
  onAction: () => void;
}

const ACTIONS = [
  { key: "concluido", label: "Finalizar", icon: CheckCircle2, color: "text-emerald-500" },
  { key: "motorista_avisado", label: "Motorista Avisado", icon: Bell, color: "text-amber-500" },
  { key: "sem_motorista", label: "Sem Motorista", icon: UserX, color: "text-red-500" },
  { key: "editar", label: "Editar", icon: Pencil, color: "text-blue-500" },
  { key: "excluir", label: "Excluir", icon: Trash2, color: "text-destructive", destructive: true },
  { key: "mover_data", label: "Mover Data", icon: Calendar, color: "text-purple-500" },
];

export function ActionDropdown({ embarqueId, currentStatus, onAction }: ActionDropdownProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState({ top: 0, right: 0 });

  const updatePosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
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
    if (key === "editar" || key === "mover_data") return;
    if (key === "excluir") {
      if (!window.confirm("Tem certeza que deseja excluir este embarque?")) return;
      setBusy(true);
      try { await deleteEmbarque(embarqueId); onAction(); }
      catch (err) { console.error(err); }
      finally { setBusy(false); }
      return;
    }
    setBusy(true);
    try { await updateEmbarqueStatus(embarqueId, key as EmbarqueStatus); onAction(); }
    catch (err) { console.error(err); }
    finally { setBusy(false); }
  }

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

      {open && createPortal(
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
                className="fixed z-[9999] w-48 rounded-xl border border-border bg-card py-1 shadow-2xl shadow-glow"
                style={{ top: pos.top, right: pos.right }}
              >
                {ACTIONS.map((action) => {
                  const Icon = action.icon;
                  const isCurrent = action.key === currentStatus || (action.key === "motorista_avisado" && currentStatus === "motorista_avisado");
                  return (
                    <button
                      key={action.key}
                      onClick={() => handleAction(action.key)}
                      disabled={isCurrent || busy}
                      className={cn(
                        "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors",
                        action.destructive ? "text-destructive hover:bg-destructive/10" : "text-foreground hover:bg-accent",
                        isCurrent && "opacity-40"
                      )}
                    >
                      <Icon className={cn("h-4 w-4 shrink-0", action.color)} />
                      <span className="flex-1">{action.label}</span>
                      {isCurrent && <span className="text-[10px] text-muted-foreground">Atual</span>}
                    </button>
                  );
                })}
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
