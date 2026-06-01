import { useState } from "react";
import {
  AlertTriangle,
  Info,
  Clock,
  Circle,
  CheckCircle2,
  XCircle,
  Calendar,
  Trash2,
  X,
  Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

interface AgendaItem {
  id: number;
  date: string;
  title: string;
  desc: string;
  priority: "alta" | "media" | "baixa";
}

interface OcorrenciaItem {
  id: number;
  title: string;
  desc: string;
  time: string;
  status: string;
  type: string;
}

const INITIAL_AGENDA: AgendaItem[] = [
  { id: 1, date: "28/05", title: "Manutenção programada", desc: "Sistema offline das 02h às 04h para atualização do servidor de banco de dados.", priority: "alta" },
  { id: 2, date: "29/05", title: "Novo motorista", desc: "Carlos Silva - CNH categoria E ok. Documentação completa e treinamento realizado.", priority: "media" },
  { id: 3, date: "30/05", title: "Vistoria veicular", desc: "ABC-1234 precisa de vistoria anual. Agendado para as 10h no posto credenciado.", priority: "alta" },
  { id: 4, date: "31/05", title: "Meta da semana", desc: "95% dos embarques concluídos no prazo. Atualmente em 87% - necessário reforço.", priority: "baixa" },
];

const INITIAL_OCORRENCIAS: OcorrenciaItem[] = [
  { id: 1, title: "Atraso na coleta", desc: "Fornecedor atrasou 2h", time: "15:45", status: "aberto", type: "critico" },
  { id: 2, title: "Problema mecânico", desc: "Bitrem falha nos freios", time: "14:20", status: "andamento", type: "medio" },
  { id: 3, title: "Rota alternativa", desc: "Interdição BR-101", time: "11:00", status: "resolvido", type: "info" },
  { id: 4, title: "Cancelamento", desc: "Cliente cancelou", time: "09:30", status: "resolvido", type: "baixo" },
];

const PRIORITY_STYLE: Record<string, string> = {
  alta: "text-red-500 border-red-500/20 bg-red-500/10",
  media: "text-amber-500 border-amber-500/20 bg-amber-500/10",
  baixa: "text-emerald-500 border-emerald-500/20 bg-emerald-500/10",
};

const PRIORITY_LABEL: Record<string, string> = {
  alta: "Alta",
  media: "Média",
  baixa: "Baixa",
};

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
  const [agenda, setAgenda] = useState<AgendaItem[]>(INITIAL_AGENDA);
  const [ocorrencias, setOcorrencias] = useState<OcorrenciaItem[]>(INITIAL_OCORRENCIAS);
  const [selectedItem, setSelectedItem] = useState<AgendaItem | null>(null);
  const [selectedOcorrencia, setSelectedOcorrencia] = useState<OcorrenciaItem | null>(null);
  const [agendaEditMode, setAgendaEditMode] = useState(false);
  const [ocoEditMode, setOcoEditMode] = useState(false);
  const [agendaEditForm, setAgendaEditForm] = useState<AgendaItem>({
    id: 0, date: "", title: "", desc: "", priority: "baixa",
  });
  const [ocoEditForm, setOcoEditForm] = useState<OcorrenciaItem>({
    id: 0, title: "", desc: "", time: "", status: "", type: "",
  });

  function deleteItem(id: number) {
    setAgenda((prev) => prev.filter((item) => item.id !== id));
    if (selectedItem?.id === id) setSelectedItem(null);
  }

  function deleteOcorrencia(id: number) {
    setOcorrencias((prev) => prev.filter((item) => item.id !== id));
    if (selectedOcorrencia?.id === id) setSelectedOcorrencia(null);
  }

  function openAgendaEdit() {
    if (!selectedItem) return;
    setAgendaEditForm({ ...selectedItem });
    setAgendaEditMode(true);
  }

  function saveAgendaEdit() {
    setAgenda((prev) =>
      prev.map((item) => (item.id === agendaEditForm.id ? agendaEditForm : item))
    );
    setSelectedItem(agendaEditForm);
    setAgendaEditMode(false);
  }

  function cancelAgendaEdit() {
    setAgendaEditMode(false);
  }

  function openOcoEdit() {
    if (!selectedOcorrencia) return;
    setOcoEditForm({ ...selectedOcorrencia });
    setOcoEditMode(true);
  }

  function saveOcoEdit() {
    setOcorrencias((prev) =>
      prev.map((item) => (item.id === ocoEditForm.id ? ocoEditForm : item))
    );
    setSelectedOcorrencia(ocoEditForm);
    setOcoEditMode(false);
  }

  function cancelOcoEdit() {
    setOcoEditMode(false);
  }

  return (
    <>
      <div className="hidden xl:flex w-[280px] shrink-0 flex-col gap-4 overflow-y-auto border-l border-border bg-card p-4">
        {/* Agenda */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Agenda</h3>
          </div>
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
            className="flex flex-col gap-1.5 max-h-[250px] overflow-y-auto"
          >
            {agenda.length === 0 ? (
              <p className="py-4 text-center text-[10px] text-muted-foreground">Nenhum item na agenda</p>
            ) : (
              agenda.map((item) => (
                <motion.div
                  key={item.id}
                  variants={itemVariants}
                  layout
                  className="group relative cursor-pointer rounded-lg border border-border bg-background px-3 py-2.5 transition-all duration-200 hover:bg-accent hover:shadow-glow"
                  onClick={() => { setSelectedItem(item); setAgendaEditMode(false); setSelectedOcorrencia(null); }}
                >
                  <div className="flex items-start gap-2.5">
                    <div className={cn("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border", PRIORITY_STYLE[item.priority])}>
                      <Calendar className="h-2.5 w-2.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium leading-tight">{item.title}</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground leading-tight line-clamp-2">{item.desc}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-[9px] text-muted-foreground">{item.date}</span>
                        <span className={cn("rounded px-1 py-0.5 text-[8px] font-medium", PRIORITY_STYLE[item.priority])}>
                          {PRIORITY_LABEL[item.priority]}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }}
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground opacity-0 transition-all duration-200 hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        </section>

        <div className="border-t border-border" />

        {/* Ocorrências recentes */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ocorrências</h3>
          </div>
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
            className="flex flex-col gap-1.5 max-h-[210px] overflow-y-auto"
          >
            {ocorrencias.length === 0 ? (
              <p className="py-4 text-center text-[10px] text-muted-foreground">Nenhuma ocorrência</p>
            ) : (
              ocorrencias.map((oco) => {
                const Icon = TYPE_ICON[oco.type] ?? AlertTriangle;
                return (
                  <motion.div
                    key={oco.id}
                    variants={itemVariants}
                    className="group relative cursor-pointer rounded-lg border border-border bg-background px-3 py-2.5 transition-all duration-200 hover:bg-accent hover:shadow-glow"
                    onClick={() => { setSelectedOcorrencia(oco); setOcoEditMode(false); setSelectedItem(null); }}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className={cn("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border", TYPE_COLOR[oco.type])}>
                        <Icon className="h-2.5 w-2.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium leading-tight">{oco.title}</p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground leading-tight">{oco.desc}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className={cn("flex items-center gap-1 text-[9px]", STATUS_OCORRENCIA[oco.status] ?? "text-muted-foreground")}>
                            <Circle className={cn("h-1.5 w-1.5 fill-current")} />
                            {oco.status === "aberto" ? "Aberto" : oco.status === "andamento" ? "Em andamento" : "Resolvido"}
                          </span>
                          <span className="flex items-center gap-1 text-[9px] text-muted-foreground">
                            <Clock className="h-2.5 w-2.5" />
                            {oco.time}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteOcorrencia(oco.id); }}
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground opacity-0 transition-all duration-200 hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </motion.div>
        </section>
      </div>

      {/* Modal de detalhes - Agenda */}
      {selectedItem &&
        createPortal(
          <AnimatePresence>
            {selectedItem && (
              <>
                <motion.div
                  key="agenda-backdrop"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="fixed inset-0 z-[9999] bg-black/60"
                  onClick={() => { cancelAgendaEdit(); setSelectedItem(null); }}
                />
                <motion.div
                  key="agenda-modal"
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="fixed left-1/2 top-1/2 z-[10000] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-5 shadow-2xl shadow-glow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg border", PRIORITY_STYLE[selectedItem.priority])}>
                        <Calendar className="h-4 w-4" />
                      </div>
                      <div>
                        {agendaEditMode ? (
                          <input
                            value={agendaEditForm.title}
                            onChange={(e) => setAgendaEditForm((prev) => ({ ...prev, title: e.target.value }))}
                            className="w-full rounded-lg border border-border bg-background px-2 py-1 text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        ) : (
                          <h4 className="text-sm font-semibold">{selectedItem.title}</h4>
                        )}
                        {agendaEditMode ? (
                          <select
                            value={agendaEditForm.priority}
                            onChange={(e) => setAgendaEditForm((prev) => ({ ...prev, priority: e.target.value as "alta" | "media" | "baixa" }))}
                            className={cn("mt-1 rounded border border-border bg-background px-1 py-0.5 text-[10px] font-medium focus:outline-none focus:ring-1 focus:ring-primary", PRIORITY_STYLE[agendaEditForm.priority])}
                          >
                            <option value="alta">Alta</option>
                            <option value="media">Média</option>
                            <option value="baixa">Baixa</option>
                          </select>
                        ) : (
                          <span className={cn("text-[10px] font-medium", PRIORITY_STYLE[selectedItem.priority])}>
                            {PRIORITY_LABEL[selectedItem.priority]}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => { cancelAgendaEdit(); setSelectedItem(null); }}
                      className="flex h-6 w-6 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {agendaEditMode ? (
                        <input
                          value={agendaEditForm.date}
                          onChange={(e) => setAgendaEditForm((prev) => ({ ...prev, date: e.target.value }))}
                          className="rounded-lg border border-border bg-background px-2 py-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      ) : (
                        <span>{selectedItem.date}</span>
                      )}
                    </div>
                    {agendaEditMode ? (
                      <textarea
                        value={agendaEditForm.desc}
                        onChange={(e) => setAgendaEditForm((prev) => ({ ...prev, desc: e.target.value }))}
                        rows={3}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm leading-relaxed focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                      />
                    ) : (
                      <p className="text-sm leading-relaxed text-foreground">
                        {selectedItem.desc}
                      </p>
                    )}
                  </div>
                  <div className="mt-5 flex justify-end gap-2 border-t border-border pt-4">
                    {agendaEditMode ? (
                      <>
                        <button
                          onClick={cancelAgendaEdit}
                          className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={saveAgendaEdit}
                          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Salvar Alterações
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setSelectedItem(null)}
                          className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        >
                          Fechar
                        </button>
                        <button
                          onClick={openAgendaEdit}
                          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Editar
                        </button>
                        <button
                          onClick={() => deleteItem(selectedItem.id)}
                          className="flex items-center gap-1.5 rounded-lg bg-destructive px-3 py-1.5 text-xs font-medium text-destructive-foreground transition-colors hover:bg-destructive/90"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Excluir
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}

      {/* Modal de detalhes - Ocorrências */}
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
                  onClick={() => { cancelOcoEdit(); setSelectedOcorrencia(null); }}
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
                        const OcoIcon = TYPE_ICON[selectedOcorrencia.type] ?? AlertTriangle;
                        return (
                          <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg border", TYPE_COLOR[selectedOcorrencia.type])}>
                            <OcoIcon className="h-4 w-4" />
                          </div>
                        );
                      })()}
                      <div>
                        {ocoEditMode ? (
                          <input
                            value={ocoEditForm.title}
                            onChange={(e) => setOcoEditForm((prev) => ({ ...prev, title: e.target.value }))}
                            className="w-full rounded-lg border border-border bg-background px-2 py-1 text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        ) : (
                          <h4 className="text-sm font-semibold">{selectedOcorrencia.title}</h4>
                        )}
                        {ocoEditMode ? (
                          <select
                            value={ocoEditForm.status}
                            onChange={(e) => setOcoEditForm((prev) => ({ ...prev, status: e.target.value }))}
                            className={cn("mt-1 rounded border border-border bg-background px-1 py-0.5 text-[10px] font-medium focus:outline-none focus:ring-1 focus:ring-primary", STATUS_OCORRENCIA[ocoEditForm.status] ?? "")}
                          >
                            <option value="aberto">Aberto</option>
                            <option value="andamento">Em andamento</option>
                            <option value="resolvido">Resolvido</option>
                          </select>
                        ) : (
                          <span className={cn("flex items-center gap-1 text-[10px] font-medium", STATUS_OCORRENCIA[selectedOcorrencia.status])}>
                            <Circle className="h-1.5 w-1.5 fill-current" />
                            {STATUS_LABEL[selectedOcorrencia.status] ?? selectedOcorrencia.status}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => { cancelOcoEdit(); setSelectedOcorrencia(null); }}
                      className="flex h-6 w-6 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {ocoEditMode ? (
                        <input
                          value={ocoEditForm.time}
                          onChange={(e) => setOcoEditForm((prev) => ({ ...prev, time: e.target.value }))}
                          className="rounded-lg border border-border bg-background px-2 py-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      ) : (
                        <span>{selectedOcorrencia.time}</span>
                      )}
                    </div>
                    {ocoEditMode ? (
                      <textarea
                        value={ocoEditForm.desc}
                        onChange={(e) => setOcoEditForm((prev) => ({ ...prev, desc: e.target.value }))}
                        rows={3}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm leading-relaxed focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                      />
                    ) : (
                      <p className="text-sm leading-relaxed text-foreground">
                        {selectedOcorrencia.desc}
                      </p>
                    )}
                  </div>
                  <div className="mt-5 flex justify-end gap-2 border-t border-border pt-4">
                    {ocoEditMode ? (
                      <>
                        <button
                          onClick={cancelOcoEdit}
                          className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={saveOcoEdit}
                          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Salvar Alterações
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setSelectedOcorrencia(null)}
                          className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        >
                          Fechar
                        </button>
                        <button
                          onClick={openOcoEdit}
                          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Editar
                        </button>
                        <button
                          onClick={() => deleteOcorrencia(selectedOcorrencia.id)}
                          className="flex items-center gap-1.5 rounded-lg bg-destructive px-3 py-1.5 text-xs font-medium text-destructive-foreground transition-colors hover:bg-destructive/90"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Excluir
                        </button>
                      </>
                    )}
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
