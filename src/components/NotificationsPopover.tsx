import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Bell,
  Send,
  CheckCircle2,
  AlertTriangle,
  Info,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useNotifications } from "@/hooks/use-notifications";

const TYPE_ICON: Record<string, typeof Bell> = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle2,
};

export function NotificationsPopover() {
  const { notifications, unreadCount, loading, send, markRead } =
    useNotifications();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"list" | "send">("list");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [recipientType, setRecipientType] = useState<"usuario" | "todos">(
    "todos"
  );
  const [sending, setSending] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState({ top: 0, right: 0 });

  const updatePosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPos({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
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

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    setSending(true);
    try {
      await send({
        title: title.trim(),
        message: message.trim(),
        recipient_type: recipientType,
        recipient_id: undefined,
      });
      setTitle("");
      setMessage("");
      setTab("list");
    } catch (err) {
      console.error("Erro ao enviar notificação:", err);
    } finally {
      setSending(false);
    }
  }

  function handleOpen() {
    updatePosition();
    setTab("list");
    setOpen(true);
  }

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleOpen}
        className={cn(
          "relative flex h-9 w-9 items-center justify-center rounded-lg",
          "border border-border bg-card text-muted-foreground transition-colors",
          "hover:bg-accent hover:text-accent-foreground",
          open && "bg-accent"
        )}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open &&
        createPortal(
          <AnimatePresence>
            {open && (
              <>
                <motion.div
                  key="notif-backdrop"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.1 }}
                  className="fixed inset-0 z-[9998]"
                  onClick={() => setOpen(false)}
                />

                <motion.div
                  key="notif-dropdown"
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="fixed z-[9999] w-[360px] rounded-xl border border-border bg-card shadow-2xl shadow-glow"
                  style={{ top: pos.top, right: pos.right }}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-border px-4 py-3">
                    <h3 className="text-sm font-semibold">Notificações</h3>
                    <div className="flex items-center gap-1 rounded-lg bg-muted p-0.5">
                      <button
                        onClick={() => setTab("list")}
                        className={cn(
                          "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                          tab === "list"
                            ? "bg-card text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        Lista
                      </button>
                      <button
                        onClick={() => setTab("send")}
                        className={cn(
                          "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                          tab === "send"
                            ? "bg-card text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        Enviar
                      </button>
                    </div>
                  </div>

                  {tab === "list" ? (
                    <div className="max-h-[400px] overflow-y-auto">
                      {loading ? (
                        <div className="space-y-2 p-4">
                          {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
                          ))}
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                          <Bell className="h-8 w-8 opacity-30" />
                          <p className="text-sm">Nenhuma notificação</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-border">
                          {notifications.map((notif) => {
                            const isUnread = !notif.read_at;
                            return (
                              <button
                                key={notif.id}
                                onClick={() => { if (isUnread) markRead(notif.id); }}
                                className={cn(
                                  "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/50",
                                  isUnread && "bg-accent/20"
                                )}
                              >
                                <div
                                  className={cn(
                                    "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                                    isUnread ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                                  )}
                                >
                                  <Bell className="h-3.5 w-3.5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className={cn("text-sm truncate", isUnread && "font-semibold")}>
                                      {notif.title}
                                    </p>
                                    {isUnread && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
                                  </div>
                                  <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                                    {notif.message}
                                  </p>
                                  <p className="mt-1 text-[10px] text-muted-foreground/60">
                                    {new Date(notif.created_at).toLocaleString("pt-BR")}
                                  </p>
                                </div>
                                {notif.recipient_type === "todos" && (
                                  <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                    Todos
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <form onSubmit={handleSend} className="p-4">
                      <div className="flex flex-col gap-3">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-muted-foreground">
                            Destinatário
                          </label>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setRecipientType("todos")}
                              className={cn(
                                "flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
                                recipientType === "todos"
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border text-muted-foreground hover:bg-accent"
                              )}
                            >
                              <Send className="h-3.5 w-3.5" />
                              Todos
                            </button>
                            <button
                              type="button"
                              onClick={() => setRecipientType("usuario")}
                              className={cn(
                                "flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
                                recipientType === "usuario"
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border text-muted-foreground hover:bg-accent"
                              )}
                            >
                              <User className="h-3.5 w-3.5" />
                              Usuário específico
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-muted-foreground">Título</label>
                          <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ex: Manutenção programada"
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-muted-foreground">Mensagem</label>
                          <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Descreva o aviso..."
                            rows={3}
                            className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={!title.trim() || !message.trim() || sending}
                          className="flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                        >
                          <Send className="h-4 w-4" />
                          {sending ? "Enviando..." : "Enviar aviso"}
                        </button>
                      </div>
                    </form>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}
