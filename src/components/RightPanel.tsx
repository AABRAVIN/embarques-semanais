import { useState, useEffect } from "react";
import {
  AlertTriangle,
  Info,
  Clock,
  Circle,
  CheckCircle2,
  XCircle,
  StickyNote,
  Trash2,
  X,
  Pencil,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { useAuth } from "@/hooks/use-auth";
import { fetchLembretes, createLembrete, updateLembrete, deleteLembrete } from "@/lib/lembretes";
import { fetchOcorrencias, createOcorrencia, updateOcorrencia, deleteOcorrencia } from "@/lib/ocorrencias";
import { supabase } from "@/lib/supabase";
import type { Lembrete } from "@/types/lembretes";
import type { Ocorrencia } from "@/types/ocorrencias";

const STATUS_OCORRENCIA: Record<string, string> = {
  aberto: "text-red-500",
  andamento: "text-amber-500",
  resolvido: "text-emerald-500",
};

const STATUS_LABEL: Record<string, string> = {
  aberto: "Aberto",
  andamento: "Em andamento",
  resolvido: "Resolvido",
};

const TYPE_ICON: Record<string, typeof AlertTriangle> = {
  warning: AlertTriangle, info: Info, alert: AlertTriangle, success: CheckCircle2,
  critico: XCircle, medio: AlertTriangle, baixo: Circle,
};

const TYPE_COLOR: Record<string, string> = {
  warning: "text-amber-500 border-amber-500/20 bg-amber-500/10",
  info: "text-blue-500 border-blue-500/20 bg-blue-500/10",
  alert: "text-red-500 border-red-500/20 bg-red-500/10",
  success: "text-emerald-500 border-emerald-500/20 bg-emerald-500/10",
  critico: "text-red-500 border-red-500/20 bg-red-500/10",
  medio: "text-orange-500 border-orange-500/20 bg-orange-500/10",
  baixo: "text-slate-400 border-slate-500/20 bg-slate-500/10",
};

const itemVariants = {
  hidden: { opacity: 0, x: 16 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.25 } },
};

export function RightPanel() {
  const { user } = useAuth();
  const [lembretes, setLembretes] = useState<Lembrete[]>([]);
  const [newLembreteText, setNewLembreteText] = useState("");
  const [selectedLembrete, setSelectedLembrete] = useState<Lembrete | null>(null);
  const [editLembreteText, setEditLembreteText] = useState("");
  const [sendingLembrete, setSendingLembrete] = useState(false);
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [selectedOcorrencia, setSelectedOcorrencia] = useState<Ocorrencia | null>(null);
  const [newOcorrenciaTitulo, setNewOcorrenciaTitulo] = useState("");
  const [newOcorrenciaDesc, setNewOcorrenciaDesc] = useState("");
  const [editOcorrenciaTitulo, setEditOcorrenciaTitulo] = useState("");
  const [editOcorrenciaDesc, setEditOcorrenciaDesc] = useState("");
  const [editOcorrenciaTipo, setEditOcorrenciaTipo] = useState("info");
  const [editOcorrenciaStatus, setEditOcorrenciaStatus] = useState("aberto");
  const [sendingOcorrencia, setSendingOcorrencia] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    fetchLembretes(user.id).then(setLembretes).catch(console.error);
  }, [user?.id]);

  useEffect(() => {
    fetchOcorrencias().then(setOcorrencias).catch(console.error);
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("public:ocorrencias")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ocorrencias" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const item = payload.new as Ocorrencia;
            setOcorrencias((prev) =>
              prev.some((o) => o.id === item.id) ? prev : [item, ...prev]
            );
          } else if (payload.eventType === "UPDATE") {
            const item = payload.new as Ocorrencia;
            setOcorrencias((prev) =>
              prev.map((o) => (o.id === item.id ? item : o))
            );
            setSelectedOcorrencia((prev) =>
              prev?.id === item.id ? item : prev
            );
          } else if (payload.eventType === "DELETE") {
            const id = (payload.old as { id: string }).id;
            setOcorrencias((prev) => prev.filter((o) => o.id !== id));
            setSelectedOcorrencia((prev) =>
              prev?.id === id ? null : prev
            );
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel("lembretes-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "lembretes" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const item = payload.new as Lembrete;
            setLembretes((prev) =>
              prev.some((l) => l.id === item.id) ? prev : [item, ...prev]
            );
          } else if (payload.eventType === "UPDATE") {
            const item = payload.new as Lembrete;
            setLembretes((prev) =>
              prev.map((l) => (l.id === item.id ? item : l))
            );
            setSelectedLembrete((prev) =>
              prev?.id === item.id ? item : prev
            );
          } else if (payload.eventType === "DELETE") {
            const id = (payload.old as { id: string }).id;
            setLembretes((prev) => prev.filter((l) => l.id !== id));
            setSelectedLembrete((prev) =>
              prev?.id === id ? null : prev
            );
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  async function handleCreateLembrete() {
    const text = newLembreteText.trim();
    if (!text || !user?.id || sendingLembrete) return;
    setSendingLembrete(true);
    try {
      const novo = await createLembrete({ conteudo: text }, user.id);
      setLembretes((prev) => [novo, ...prev]);
      setNewLembreteText("");
    } catch (err) {
      console.error("Erro ao criar lembrete:", err);
    } finally {
      setSendingLembrete(false);
    }
  }

  async function handleDeleteLembrete(id: string) {
    if (!user?.id) return;
    try {
      await deleteLembrete(id);
      setLembretes((prev) => prev.filter((l) => l.id !== id));
      if (selectedLembrete?.id === id) setSelectedLembrete(null);
    } catch (err) {
      console.error("Erro ao excluir lembrete:", err);
    }
  }

  async function handleSaveEdit() {
    if (!selectedLembrete) return;
    const text = editLembreteText.trim();
    if (!text) return;
    try {
      const atualizado = await updateLembrete(selectedLembrete.id, { conteudo: text });
      setLembretes((prev) => prev.map((l) => (l.id === atualizado.id ? atualizado : l)));
      setSelectedLembrete(atualizado);
      setEditLembreteText("");
    } catch (err) {
      console.error("Erro ao editar lembrete:", err);
    }
  }

  async function handleCreateOcorrencia() {
    const titulo = newOcorrenciaTitulo.trim();
    const desc = newOcorrenciaDesc.trim();
    if (!titulo || !desc || !user?.id || sendingOcorrencia) return;
    setSendingOcorrencia(true);
    try {
      const nova = await createOcorrencia({ titulo, descricao: desc, tipo: "info" }, user.id);
      setOcorrencias((prev) => [nova, ...prev]);
      setNewOcorrenciaTitulo("");
      setNewOcorrenciaDesc("");
    } catch (err) {
      console.error("Erro ao criar ocorrência:", err);
    } finally {
      setSendingOcorrencia(false);
    }
  }

  async function handleDeleteOcorrencia(id: string) {
    try {
      await deleteOcorrencia(id);
      setOcorrencias((prev) => prev.filter((o) => o.id !== id));
      if (selectedOcorrencia?.id === id) setSelectedOcorrencia(null);
    } catch (err) {
      console.error("Erro ao excluir ocorrência:", err);
    }
  }

  async function handleSaveOcorrencia() {
    if (!selectedOcorrencia) return;
    const titulo = editOcorrenciaTitulo.trim();
    const desc = editOcorrenciaDesc.trim();
    if (!titulo || !desc) return;
    try {
      const atualizada = await updateOcorrencia(selectedOcorrencia.id, {
        titulo,
        descricao: desc,
        tipo: editOcorrenciaTipo,
        status: editOcorrenciaStatus,
      });
      setOcorrencias((prev) => prev.map((o) => (o.id === atualizada.id ? atualizada : o)));
      setSelectedOcorrencia(atualizada);
    } catch (err) {
      console.error("Erro ao editar ocorrência:", err);
    }
  }

  return (
    <>
      <div className="hidden xl:flex w-[280px] shrink-0 flex-col gap-4 overflow-y-auto border-l border-border bg-card p-4">
        {/* Lembretes */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <StickyNote className="h-3.5 w-3.5 text-primary" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Lembretes</h3>
          </div>

          <div className="mb-2 flex gap-1.5">
            <input
              value={newLembreteText}
              onChange={(e) => setNewLembreteText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleCreateLembrete(); }}
              placeholder="Novo lembrete..."
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              onClick={handleCreateLembrete}
              disabled={!newLembreteText.trim() || sendingLembrete}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
            className="flex flex-col gap-1.5 max-h-[250px] overflow-y-auto"
          >
            {lembretes.length === 0 ? (
              <p className="py-4 text-center text-[10px] text-muted-foreground">Nenhum lembrete</p>
            ) : (
              lembretes.map((item) => (
                <motion.div
                  key={item.id}
                  variants={itemVariants}
                  layout
                  className="group relative cursor-pointer rounded-lg border border-border bg-amber-50/70 dark:bg-amber-950/20 px-3 py-2.5 transition-all duration-200 hover:bg-amber-100/70 dark:hover:bg-amber-950/40 hover:shadow-glow"
                  onClick={() => { setSelectedLembrete(item); setEditLembreteText(item.conteudo); setSelectedOcorrencia(null); }}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border border-amber-300/50 bg-amber-200/50 dark:border-amber-600/30 dark:bg-amber-700/20">
                      <StickyNote className="h-2.5 w-2.5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] leading-tight whitespace-pre-line">{item.conteudo}</p>
                      <p className="mt-1 text-[9px] text-muted-foreground">
                        {new Date(item.created_at).toLocaleString("pt-BR")}
                      </p>
                    </div>
                    <div className="flex gap-0.5 shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedLembrete(item); setEditLembreteText(item.conteudo); }}
                        className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground opacity-0 transition-all duration-200 hover:bg-primary/10 hover:text-primary group-hover:opacity-100"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteLembrete(item.id); }}
                        className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground opacity-0 transition-all duration-200 hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        </section>

        <div className="border-t border-border" />

        {/* Ocorrências - Mural Colaborativo */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ocorrências</h3>
          </div>

          <div className="mb-2 flex flex-col gap-1.5">
            <input
              value={newOcorrenciaTitulo}
              onChange={(e) => setNewOcorrenciaTitulo(e.target.value)}
              placeholder="Título da ocorrência..."
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <div className="flex gap-1.5">
              <input
                value={newOcorrenciaDesc}
                onChange={(e) => setNewOcorrenciaDesc(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleCreateOcorrencia(); }}
                placeholder="Descrição..."
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                onClick={handleCreateOcorrencia}
                disabled={!newOcorrenciaTitulo.trim() || !newOcorrenciaDesc.trim() || sendingOcorrencia}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-destructive text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
            className="flex flex-col gap-1.5 max-h-[250px] overflow-y-auto"
          >
            {ocorrencias.length === 0 ? (
              <p className="py-4 text-center text-[10px] text-muted-foreground">Nenhuma ocorrência</p>
            ) : (
              ocorrencias.map((oco) => {
                const Icon = TYPE_ICON[oco.tipo] ?? AlertTriangle;
                return (
                  <motion.div
                    key={oco.id}
                    variants={itemVariants}
                    layout
                    className="group relative cursor-pointer rounded-lg border border-border bg-amber-50/70 dark:bg-amber-950/20 px-3 py-2.5 transition-all duration-200 hover:bg-amber-100/70 dark:hover:bg-amber-950/40 hover:shadow-glow"
                    onClick={() => { setSelectedOcorrencia(oco); setEditOcorrenciaTitulo(oco.titulo); setEditOcorrenciaDesc(oco.descricao); setEditOcorrenciaTipo(oco.tipo); setEditOcorrenciaStatus(oco.status); setSelectedLembrete(null); }}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className={cn("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border", TYPE_COLOR[oco.tipo])}>
                        <Icon className="h-2.5 w-2.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium leading-tight">{oco.titulo}</p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground leading-tight line-clamp-2">{oco.descricao}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className={cn("flex items-center gap-1 text-[9px]", STATUS_OCORRENCIA[oco.status] ?? "text-muted-foreground")}>
                            <Circle className={cn("h-1.5 w-1.5 fill-current")} />
                            {STATUS_LABEL[oco.status] ?? oco.status}
                          </span>
                          <span className="text-[9px] text-muted-foreground">
                            {new Date(oco.created_at).toLocaleString("pt-BR")}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-0.5 shrink-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedOcorrencia(oco); setEditOcorrenciaTitulo(oco.titulo); setEditOcorrenciaDesc(oco.descricao); setEditOcorrenciaTipo(oco.tipo); setEditOcorrenciaStatus(oco.status); }}
                          className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground opacity-0 transition-all duration-200 hover:bg-primary/10 hover:text-primary group-hover:opacity-100"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteOcorrencia(oco.id); }}
                          className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground opacity-0 transition-all duration-200 hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </motion.div>
        </section>
      </div>

      {/* Modal de detalhes - Lembrete */}
      {selectedLembrete &&
        createPortal(
          <AnimatePresence>
            {selectedLembrete && (
              <>
                <motion.div
                  key="lembrete-backdrop"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="fixed inset-0 z-[9999] bg-black/60"
                  onClick={() => setSelectedLembrete(null)}
                />
                <motion.div
                  key="lembrete-modal"
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="fixed left-1/2 top-1/2 z-[10000] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-5 shadow-2xl shadow-glow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-300/50 bg-amber-200/50 dark:border-amber-600/30 dark:bg-amber-700/20">
                        <StickyNote className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      </div>
                      <h4 className="text-sm font-semibold">Lembrete</h4>
                    </div>
                    <button
                      onClick={() => setSelectedLembrete(null)}
                      className="flex h-6 w-6 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-4">
                    <textarea
                      value={editLembreteText}
                      onChange={(e) => setEditLembreteText(e.target.value)}
                      rows={4}
                      className="w-full rounded-lg border border-border bg-amber-50/70 dark:bg-amber-950/20 px-3 py-2 text-sm leading-relaxed focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                    />
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      Criado em {new Date(selectedLembrete.created_at).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <div className="mt-5 flex justify-end gap-2 border-t border-border pt-4">
                    <button
                      onClick={() => setSelectedLembrete(null)}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    >
                      Fechar
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      disabled={!editLembreteText.trim()}
                      className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Salvar
                    </button>
                    <button
                      onClick={() => handleDeleteLembrete(selectedLembrete.id)}
                      className="flex items-center gap-1.5 rounded-lg bg-destructive px-3 py-1.5 text-xs font-medium text-destructive-foreground transition-colors hover:bg-destructive/90"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Excluir
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}

      {/* Modal de detalhes - Ocorrência */}
      {selectedOcorrencia &&
        createPortal(
          <AnimatePresence>
            {selectedOcorrencia && (
              <>
                <motion.div
                  key="oco-backdrop"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="fixed inset-0 z-[9999] bg-black/60"
                  onClick={() => setSelectedOcorrencia(null)}
                />
                <motion.div
                  key="oco-modal"
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="fixed left-1/2 top-1/2 z-[10000] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-5 shadow-2xl shadow-glow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {(() => {
                        const OcoIcon = TYPE_ICON[editOcorrenciaTipo] ?? AlertTriangle;
                        return (
                          <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg border", TYPE_COLOR[editOcorrenciaTipo])}>
                            <OcoIcon className="h-4 w-4" />
                          </div>
                        );
                      })()}
                      <div>
                        <input
                          value={editOcorrenciaTitulo}
                          onChange={(e) => setEditOcorrenciaTitulo(e.target.value)}
                          className="w-full rounded-lg border border-border bg-background px-2 py-1 text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        <div className="mt-1 flex gap-1">
                          <select
                            value={editOcorrenciaTipo}
                            onChange={(e) => setEditOcorrenciaTipo(e.target.value)}
                            className={cn("rounded border border-border bg-background px-1 py-0.5 text-[10px] font-medium focus:outline-none focus:ring-1 focus:ring-primary", TYPE_COLOR[editOcorrenciaTipo])}
                          >
                            <option value="critico">Crítico</option>
                            <option value="medio">Médio</option>
                            <option value="baixo">Baixo</option>
                            <option value="info">Info</option>
                            <option value="warning">Warning</option>
                            <option value="alert">Alert</option>
                          </select>
                          <select
                            value={editOcorrenciaStatus}
                            onChange={(e) => setEditOcorrenciaStatus(e.target.value)}
                            className={cn("rounded border border-border bg-background px-1 py-0.5 text-[10px] font-medium focus:outline-none focus:ring-1 focus:ring-primary", STATUS_OCORRENCIA[editOcorrenciaStatus] ?? "")}
                          >
                            <option value="aberto">Aberto</option>
                            <option value="andamento">Em andamento</option>
                            <option value="resolvido">Resolvido</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedOcorrencia(null)}
                      className="flex h-6 w-6 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-4">
                    <textarea
                      value={editOcorrenciaDesc}
                      onChange={(e) => setEditOcorrenciaDesc(e.target.value)}
                      rows={4}
                      className="w-full rounded-lg border border-border bg-amber-50/70 dark:bg-amber-950/20 px-3 py-2 text-sm leading-relaxed focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                    />
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      Criado em {new Date(selectedOcorrencia.created_at).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <div className="mt-5 flex justify-end gap-2 border-t border-border pt-4">
                    <button
                      onClick={() => setSelectedOcorrencia(null)}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    >
                      Fechar
                    </button>
                    <button
                      onClick={handleSaveOcorrencia}
                      disabled={!editOcorrenciaTitulo.trim() || !editOcorrenciaDesc.trim()}
                      className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Salvar
                    </button>
                    <button
                      onClick={() => handleDeleteOcorrencia(selectedOcorrencia.id)}
                      className="flex items-center gap-1.5 rounded-lg bg-destructive px-3 py-1.5 text-xs font-medium text-destructive-foreground transition-colors hover:bg-destructive/90"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Excluir
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}
