import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Bell,
  Send,
  User,
  Users,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useMessages } from "@/hooks/use-messages";
import type { MessageInput } from "@/types/messages";
import { useAuth } from "@/hooks/use-auth";
import { listProfiles } from "@/lib/auth";
import type { Profile } from "@/types/profiles";

export function NotificationsPopover() {
  const { user, profile } = useAuth();
  const { messages, unreadCount, loading, send, markRead, hide } =
    useMessages(user?.id);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"list" | "send">("list");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [recipientType, setRecipientType] = useState<"usuario" | "todos">(
    "todos"
  );
  const [recipientId, setRecipientId] = useState("");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
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

  useEffect(() => {
    listProfiles().then(setProfiles).catch(console.error);
  }, []);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setSendError("");

    const data: MessageInput = {
      content: `${title.trim()}\n${message.trim()}`,
      recipient_id: recipientType === "usuario" ? recipientId : null,
    };
    console.log("📤 Dados da mensagem para envio:", data);
    console.log("👤 user?.id:", user?.id);
    console.log("👤 user?.email:", user?.email);
    console.log("👤 user?.role:", user?.role);
    console.log("👤 profile:", profile);

    if (!title.trim() || !message.trim()) return;
    if (recipientType === "usuario" && !recipientId) return;

    setSending(true);
    try {
      await send(data);
      setTitle("");
      setMessage("");
      setRecipientId("");
      setTab("list");
    } catch (err) {
      console.group("❌ Erro ao enviar mensagem");
      console.error("Objeto do erro:", err);
      if (err && typeof err === "object") {
        console.error("code:", (err as Record<string, unknown>).code);
        console.error("details:", (err as Record<string, unknown>).details);
        console.error("hint:", (err as Record<string, unknown>).hint);
        console.error("message:", (err as Record<string, unknown>).message);
        console.error("statusCode:", (err as Record<string, unknown>).statusCode);
      }
      console.groupEnd();
      const msg =
        err instanceof Error
          ? err.message
          : err && typeof err === "object" && "message" in (err as Record<string, unknown>)
            ? String((err as Record<string, unknown>).message)
            : String(err);
      setSendError(msg);
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
                    <h3 className="text-sm font-semibold">Mensagens</h3>
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
                      ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                          <Bell className="h-8 w-8 opacity-30" />
                          <p className="text-sm">Nenhuma mensagem</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-border">
                          {messages.map((msg) => (
                            <div
                              key={msg.id}
                              className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-accent/50 group"
                            >
                              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                                {!msg.recipient_id ? (
                                  <Users className="h-3.5 w-3.5" />
                                ) : (
                                  <User className="h-3.5 w-3.5" />
                                )}
                              </div>
                              <div
                                className="flex-1 min-w-0 cursor-pointer"
                                onClick={() => markRead(msg.id)}
                              >
                                <div className="flex items-center gap-2">
                                  <p className="text-sm truncate font-semibold">
                                    {msg.content.split('\n')[0]}
                                  </p>
                                </div>
                                <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2 whitespace-pre-line">
                                  {msg.content.split('\n').slice(1).join('\n') || msg.content}
                                </p>
                                <p className="mt-1 text-[10px] text-muted-foreground/60">
                                  {new Date(msg.created_at).toLocaleString("pt-BR")}
                                </p>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                {!msg.recipient_id ? (
                                  <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                    Todos
                                  </span>
                                ) : (
                                  <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">
                                    Direta
                                  </span>
                                )}
                                <button
                                  onClick={() => markRead(msg.id)}
                                  className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground/40 opacity-0 transition-all hover:bg-primary/10 hover:text-primary group-hover:opacity-100"
                                  title="Marcar como lida"
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => hide(msg.id)}
                                  className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground/40 opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                                  title="Apagar mensagem"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
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
                              onClick={() => { setRecipientType("todos"); setRecipientId(""); }}
                              className={cn(
                                "flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
                                recipientType === "todos"
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border text-muted-foreground hover:bg-accent"
                              )}
                            >
                              <Users className="h-3.5 w-3.5" />
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

                        {recipientType === "usuario" && (
                          <div>
                            <label className="mb-1 block text-xs font-medium text-muted-foreground">
                              Selecionar Usuário
                            </label>
                            <select
                              value={recipientId}
                              onChange={(e) => setRecipientId(e.target.value)}
                              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                            >
                              <option value="">Selecione um usuário...</option>
                              {profiles
                                .filter((p) => p.id !== user?.id)
                                .map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.nome} ({p.email})
                                  </option>
                                ))}
                            </select>
                          </div>
                        )}

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
                        {sendError && (
                          <p className="text-xs text-destructive">{sendError}</p>
                        )}
                        <button
                          type="submit"
                          disabled={
                            !title.trim() ||
                            !message.trim() ||
                            sending ||
                            (recipientType === "usuario" && !recipientId)
                          }
                          className="flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                        >
                          <Send className="h-4 w-4" />
                          {sending ? "Enviando..." : "Enviar mensagem"}
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
