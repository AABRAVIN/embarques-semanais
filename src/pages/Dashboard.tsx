import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Plus, X, Save, Calendar, CalendarDays, AlertCircle, Search } from "lucide-react";
import { DashboardCards } from "@/components/DashboardCards";
import { EmbarquesTable } from "@/components/EmbarquesTable";
import { RightPanel } from "@/components/RightPanel";
import { DayNav } from "@/components/DayNav";
import { listEmbarques, createEmbarque, updateEmbarque, countByEmbStatus, countByMotStatus, searchEmbarques } from "@/lib/embarques";
import { listMotoristasVeiculos } from "@/lib/motoristasVeiculos";
import type { Embarque } from "@/types/embarque";
import type { MotoristaVeiculo } from "@/types/motoristaVeiculo";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

export function Dashboard() {
  const [embarques, setEmbarques] = useState<Embarque[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("daily");
  const [dateFrom, setDateFrom] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [dateTo, setDateTo] = useState<string>(() => new Date().toISOString().slice(0, 10));

  // Helper to get range for a given date and period
  const getRangeForDateAndPeriod = useCallback((refDate: Date, p: "daily" | "weekly" | "monthly") => {
    const d = new Date(refDate);
    d.setHours(0, 0, 0, 0);

    if (p === "daily") {
      const s = d.toISOString().slice(0, 10);
      return { from: s, to: s };
    }
    if (p === "weekly") {
      const day = d.getDay();
      const mon = new Date(d);
      mon.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 6);
      return { from: mon.toISOString().slice(0, 10), to: sun.toISOString().slice(0, 10) };
    }
    // monthly
    const first = new Date(d.getFullYear(), d.getMonth(), 1);
    const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    return { from: first.toISOString().slice(0, 10), to: last.toISOString().slice(0, 10) };
  }, []);

  const handlePeriodChange = (p: "daily" | "weekly" | "monthly") => {
    setPeriod(p);
    let refDate = new Date();
    if (selectedDate) {
      refDate = new Date(selectedDate);
    } else if (dateFrom) {
      const parsed = new Date(dateFrom + "T12:00:00");
      if (!isNaN(parsed.getTime())) {
        refDate = parsed;
      }
    }
    const { from, to } = getRangeForDateAndPeriod(refDate, p);
    setDateFrom(from);
    setDateTo(to);
  };

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
    if (date) {
      const { from, to } = getRangeForDateAndPeriod(date, period);
      setDateFrom(from);
      setDateTo(to);
    }
  };

  // Sync selectedDate and period when custom dates are manually changed
  useEffect(() => {
    if (!dateFrom || !dateTo) return;
    
    const fromDate = new Date(dateFrom + "T12:00:00");
    const toDate = new Date(dateTo + "T12:00:00");
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) return;

    // Check if daily
    if (dateFrom === dateTo) {
      setPeriod("daily");
      if (!selectedDate || selectedDate.getTime() !== fromDate.getTime()) {
        setSelectedDate(fromDate);
      }
      return;
    }

    // Check if monthly
    const isFirstDay = fromDate.getDate() === 1;
    const expectedLastDay = new Date(fromDate.getFullYear(), fromDate.getMonth() + 1, 0).getDate();
    const isLastDay = toDate.getDate() === expectedLastDay;
    const isSameMonth = fromDate.getMonth() === toDate.getMonth() && fromDate.getFullYear() === toDate.getFullYear();
    
    if (isFirstDay && isLastDay && isSameMonth) {
      setPeriod("monthly");
      if (!selectedDate || selectedDate.getMonth() !== fromDate.getMonth() || selectedDate.getFullYear() !== fromDate.getFullYear()) {
        setSelectedDate(fromDate);
      }
      return;
    }

    // Check if weekly
    const diffTime = Math.abs(toDate.getTime() - fromDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const isMonday = fromDate.getDay() === 1;
    if (diffDays === 6 && isMonday) {
      setPeriod("weekly");
      if (!selectedDate || selectedDate.getTime() < fromDate.getTime() || selectedDate.getTime() > toDate.getTime()) {
        setSelectedDate(fromDate);
      }
      return;
    }
  }, [dateFrom, dateTo, selectedDate]);

  // Check if current range matches a standard period for style highlighting
  const activePeriod = useMemo(() => {
    if (!dateFrom || !dateTo) return null;
    if (dateFrom === dateTo) return "daily";
    
    const fromDate = new Date(dateFrom + "T12:00:00");
    const toDate = new Date(dateTo + "T12:00:00");
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) return null;

    // Check if monthly
    const isFirstDay = fromDate.getDate() === 1;
    const expectedLastDay = new Date(fromDate.getFullYear(), fromDate.getMonth() + 1, 0).getDate();
    const isLastDay = toDate.getDate() === expectedLastDay;
    const isSameMonth = fromDate.getMonth() === toDate.getMonth() && fromDate.getFullYear() === toDate.getFullYear();
    if (isFirstDay && isLastDay && isSameMonth) return "monthly";

    // Check if weekly
    const diffTime = Math.abs(toDate.getTime() - fromDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const isMonday = fromDate.getDay() === 1;
    if (diffDays === 6 && isMonday) return "weekly";

    return null;
  }, [dateFrom, dateTo]);

  // Drill-down state
  const [drillKey, setDrillKey] = useState<string | null>(null);

  /** Date range from dateFrom / dateTo with fallbacks */
  function getDateRange(): { from?: string; to?: string } {
    if (dateFrom || dateTo) {
      return { from: dateFrom || undefined, to: dateTo || undefined };
    }
    if (selectedDate) {
      const s = new Date(selectedDate).toISOString().slice(0, 10);
      return { from: s, to: s };
    }
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    const s = d.toISOString().slice(0, 10);
    return { from: s, to: s };
  }

  // Global search
  const [globalSearch, setGlobalSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Embarque[] | null>(null);
  const [searching, setSearching] = useState(false);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const initialFormRef = useRef<string>("");
  const [motoristas, setMotoristas] = useState<MotoristaVeiculo[]>([]);
  const [selectedMotoristaId, setSelectedMotoristaId] = useState<string>("");
  const [selectedPlaca, setSelectedPlaca] = useState<string>("");

  const [form, setForm] = useState({
    data: new Date().toISOString().slice(0, 10),
    coletas: [{ fornecedor: "", material: "", quantidade: "", local_coleta: "" }],
    entregas: [{ cliente: "", local_entrega: "" }],
    placa: "",
    motorista: "",
    motorista_id: null as string | null,
    status_motorista: "",
    status_embarque: "standby",
    obs: "",
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { from, to } = getDateRange();
      const [data, motoristasData, confirmadoCount, standbyCount, concluidoCount, avisadoCount, semMotoristaCount] = await Promise.all([
        listEmbarques(from, to),
        listMotoristasVeiculos(),
        countByEmbStatus("confirmado", from, to),
        countByEmbStatus("standby", from, to),
        countByEmbStatus("concluido", from, to),
        countByMotStatus("avisado", from, to),
        countByMotStatus("sem_motorista", from, to),
      ]);
      setEmbarques(data);
      setMotoristas(motoristasData);
      setCounts({
        confirmado: confirmadoCount,
        standby: standbyCount,
        concluido: concluidoCount,
        motorista_avisado: avisadoCount,
        sem_motorista: semMotoristaCount,
      });
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao carregar dados"
      );
    } finally {
      setLoading(false);
    }
  }, [period, selectedDate, dateFrom, dateTo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Global search — debounced, no date filter
  useEffect(() => {
    const trimmed = globalSearch.trim();
    if (trimmed.length < 2) {
      setSearchResults(null);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchEmbarques(trimmed);
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [globalSearch]);

  function resetForm(date?: Date | null) {
    const dataStr = date
      ? new Date(date).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10);
    const fresh = {
      data: dataStr,
      coletas: [{ fornecedor: "", material: "", quantidade: "", local_coleta: "" }],
      entregas: [{ cliente: "", local_entrega: "" }],
      placa: "",
      motorista: "",
      motorista_id: null as string | null,
      status_motorista: "",
      status_embarque: "standby",
      obs: "",
    };
    setForm(fresh);
    setSelectedMotoristaId("");
    setSelectedPlaca("");
    initialFormRef.current = JSON.stringify(fresh);
    setEditingId(null);
    setFormError("");
  }

  function openModal() {
    resetForm(selectedDate);
    setModalOpen(true);
  }

  function openModalForEdit(emb: Embarque) {
    function parseJson(raw: string): Array<{ local: string; quantidade: string; material: string }> {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.map((item: unknown) => {
            if (typeof item === "string") return { local: item, quantidade: "", material: "" };
            const obj = item as Record<string, string>;
            return { local: obj.local ?? "", quantidade: obj.quantidade ?? "", material: obj.material ?? "" };
          });
        }
      } catch {}
      return raw ? raw.split(", ").map((s) => ({ local: s, quantidade: "", material: "" })) : [];
    }

    const fornecedorItens = parseJson(emb.fornecedor);
    const fornecedorCidades = (emb.fornecedor_cidade ?? "").split(" + ").map((s) => s.trim());
    const clienteItens = parseJson(emb.cliente);
    const clienteCidades = (emb.cliente_cidade ?? "").split(" + ").map((s) => s.trim());

    const coletasLen = Math.max(fornecedorItens.length, fornecedorCidades.length, 1);
    const coletas = Array.from({ length: coletasLen }, (_, i) => ({
      fornecedor: fornecedorCidades[i] ?? "",
      material: fornecedorItens[i]?.material ?? "",
      quantidade: fornecedorItens[i]?.quantidade ?? "",
      local_coleta: fornecedorItens[i]?.local ?? "",
    }));

    const entregasLen = Math.max(clienteItens.length, clienteCidades.length, 1);
    const entregas = Array.from({ length: entregasLen }, (_, i) => ({
      cliente: clienteCidades[i] ?? "",
      local_entrega: clienteItens[i]?.local ?? "",
    }));

    const editForm = {
      data: emb.data ? emb.data.slice(0, 10) : new Date().toISOString().slice(0, 10),
      coletas,
      entregas,
      placa: emb.placa ?? "",
      motorista: emb.motorista ?? "",
      motorista_id: emb.motorista_id ?? null,
      status_motorista: emb.status_motorista ?? "",
      status_embarque: emb.status_embarque ?? "standby",
      obs: emb.obs ?? "",
    };
    setForm(editForm);
    setSelectedMotoristaId(emb.motorista_id ?? "");
    setSelectedPlaca(emb.placa ?? "");
    initialFormRef.current = JSON.stringify(editForm);
    setEditingId(emb.id);
    setFormError("");
    setModalOpen(true);
  }

  function closeModal() {
    const current = JSON.stringify(form);
    if (current !== initialFormRef.current) {
      if (!window.confirm("Deseja descartar as alterações?")) return;
    }
    setModalOpen(false);
    resetForm();
  }

  function getFinalStatus(): string {
    if (form.status_motorista === "avisado") return "motorista_avisado";
    if (form.status_motorista === "sem_motorista") return "sem_motorista";
    return form.status_embarque;
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    const coletasValidas = form.coletas.filter(
      (c) => c.fornecedor.trim() || c.local_coleta.trim() || c.material.trim()
    );
    const entregasValidas = form.entregas.filter(
      (e) => e.cliente.trim() || e.local_entrega.trim()
    );

    if (!coletasValidas.length || !entregasValidas.some((e) => e.cliente.trim()) || !form.placa.trim() || !form.data.trim()) {
      setFormError("Preencha os campos obrigatórios: Cliente, Fornecedor e Placa.");
      return;
    }

    setSaving(true);
    try {
      const primeiroMaterial = coletasValidas.find((c) => c.material.trim())?.material ?? "";

      const coletasData = coletasValidas.map((c) => ({
        local: c.local_coleta || c.fornecedor,
        quantidade: c.quantidade,
        material: c.material || primeiroMaterial,
      }));

      const entregasData = entregasValidas.map((e) => ({
        local: e.local_entrega,
        quantidade: "",
        material: primeiroMaterial,
      }));

      const fornecedorCidades = [...new Set(coletasValidas.map((c) => c.fornecedor || c.local_coleta).filter(Boolean))];
      const clienteCidades = [...new Set(entregasValidas.map((e) => e.cliente).filter(Boolean))];

      const payload = {
        data: form.data,
        fornecedor: JSON.stringify(coletasData),
        fornecedor_cidade: fornecedorCidades.join(" + "),
        cliente: JSON.stringify(entregasData),
        cliente_cidade: clienteCidades.join(" + "),
        qtd: "",
        material: primeiroMaterial,
        placa: form.placa,
        motorista: form.motorista || null,
        motorista_id: form.motorista_id || null,
        obs: form.obs || null,
        status: getFinalStatus(),
        status_embarque: form.status_embarque,
        status_motorista: form.status_motorista,
        destaque: "",
      };

      if (editingId) {
        await updateEmbarque(editingId, payload);
      } else {
        await createEmbarque(payload);
      }
      closeModal();
      fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao salvar embarque.";
      setFormError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex h-full"
    >
      {/* Main content */}
      <div className="mx-auto w-full max-w-screen-2xl flex min-w-0 flex-1 flex-col gap-3 overflow-y-auto p-4 md:p-6">
        <DashboardCards counts={counts} total={embarques.length} onCardClick={(key) => setDrillKey(key)} />

        {/* Date Range Picker */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 shadow-sm">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-32 bg-transparent text-xs text-foreground outline-none [color-scheme:dark]"
              placeholder="Data inicial"
            />
            <span className="text-xs text-muted-foreground">—</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-32 bg-transparent text-xs text-foreground outline-none [color-scheme:dark]"
              placeholder="Data final"
            />
          </div>
          {(dateFrom || dateTo) && (
            <button
              onClick={() => { setDateFrom(""); setDateTo(""); }}
              className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
              Limpar
            </button>
          )}
        </div>

        {/* Period tabs */}
        <div className="flex items-center gap-1">
          {(["daily", "weekly", "monthly"] as const).map((p) => (
            <button
              key={p}
              onClick={() => handlePeriodChange(p)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors ${
                activePeriod === p
                  ? "bg-primary text-primary-foreground shadow-glow"
                  : "border border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              {p === "daily" ? "Diário" : p === "weekly" ? "Semanal" : "Mensal"}
            </button>
          ))}
        </div>

        <DayNav selectedDate={selectedDate} onDateChange={handleDateChange} />

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              placeholder="Buscar por cliente, placa ou motorista..."
              className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-8 text-sm transition-all duration-200 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:shadow-glow"
            />
            {globalSearch && (
              <button
                onClick={() => { setGlobalSearch(""); setSearchResults(null); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <button
            onClick={openModal}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-all duration-200 hover:bg-primary/90 hover:shadow-glow"
          >
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
        ) : globalSearch.trim().length >= 2 && searchResults ? (
          <>
            {searchResults.length > 0 ? (
              <div className="mb-1 text-xs text-muted-foreground">
                Busca global: <span className="font-medium text-foreground">{searchResults.length}</span> resultado(s)
                para "<span className="font-medium text-foreground">{globalSearch.trim()}</span>"
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
                <Search className="h-4 w-4 shrink-0" />
                Nenhum resultado encontrado para "<span className="font-medium text-foreground">{globalSearch.trim()}</span>"
                <button
                  onClick={() => { setGlobalSearch(""); setSearchResults(null); }}
                  className="ml-auto text-xs text-primary hover:underline"
                >
                  Limpar busca
                </button>
              </div>
            )}
            {searchResults.length > 0 && (
              <EmbarquesTable
                embarques={searchResults}
                onAction={fetchData}
                onEdit={openModalForEdit}
                selectedDate={selectedDate}
                dateFrom={dateFrom}
                dateTo={dateTo}
              />
            )}
          </>
        ) : (
          <EmbarquesTable
            embarques={embarques}
            onAction={fetchData}
            onEdit={openModalForEdit}
            selectedDate={selectedDate}
            dateFrom={dateFrom}
            dateTo={dateTo}
          />
        )}
      </div>

      <RightPanel />

      {/* Drill-down Modal — full screen */}
      {drillKey && createPortal(
        <AnimatePresence>
          {drillKey && (
            <motion.div
              key="drill-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
            >
              <motion.div
                key="drill-modal"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="mx-4 flex w-[90vw] max-w-4xl h-[80vh] flex-col rounded-xl border border-border bg-card p-6 shadow-2xl shadow-glow"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex shrink-0 items-center justify-between border-b border-border pb-4">
                  <h2 className="text-lg font-semibold capitalize">{drillKey.replace(/_/g, " ")}</h2>
                  <button
                    onClick={() => setDrillKey(null)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto pt-4">
                  {(() => {
                    const isEmbStatus = ["confirmado", "standby", "concluido"].includes(drillKey);
                    const isMotStatus = ["motorista_avisado", "sem_motorista"].includes(drillKey);
                    const filtered = embarques.filter((e) => {
                      if (isEmbStatus) return e.status_embarque === drillKey;
                      if (isMotStatus) {
                        const motKey = drillKey === "motorista_avisado" ? "avisado" : "sem_motorista";
                        return e.status_motorista === motKey;
                      }
                      return e.status === drillKey;
                    });
                    return filtered.length === 0 ? (
                      <p className="py-16 text-center text-sm text-muted-foreground">Nenhum embarque encontrado.</p>
                    ) : (
                      <EmbarquesTable
                        embarques={filtered}
                        onAction={fetchData}
                        onEdit={(emb) => { setDrillKey(null); openModalForEdit(emb); }}
                        selectedDate={null}
                      />
                    );
                  })()}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Modal Novo Embarque */}
      {modalOpen &&
        createPortal(
          <AnimatePresence>
            {modalOpen && (
              <motion.div
                key="embarque-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
              >
                  <motion.div
                    key="embarque-modal"
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="flex w-full max-w-4xl flex-col max-h-[90vh] rounded-xl border border-border bg-card shadow-2xl shadow-glow"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="shrink-0 flex items-center justify-between gap-3 border-b border-border p-6 pb-4">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                          <Calendar className="h-4 w-4 text-primary" />
                        </div>
                        <h2 className="text-sm font-semibold">{editingId ? "Editar embarque" : "Novo embarque"}</h2>
                      </div>
                      <button
                        onClick={closeModal}
                        className="flex h-6 w-6 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <form onSubmit={handleSave} className="flex min-h-0 flex-1 flex-col">
                      <div className="flex-1 space-y-5 overflow-y-auto px-6">
                        {/* Section: Coletas */}
                        <div>
                          <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                            Coletas
                          </h3>
                          <div className="space-y-2">
                            {form.coletas.map((coleta, i) => (
                              <div
                                key={i}
                                className="rounded-lg border border-border/60 bg-background p-3 flex items-start gap-2"
                              >
                                <div className="flex-1 grid grid-cols-3 gap-2">
                                  <div>
                                    <label className="mb-1 block text-[10px] font-medium text-muted-foreground">
                                      Fornecedor
                                    </label>
                                    <input
                                      type="text"
                                      value={coleta.fornecedor}
                                      onChange={(ev) => {
                                        const next = [...form.coletas];
                                        next[i] = { ...next[i], fornecedor: ev.target.value };
                                        setForm((p) => ({ ...p, coletas: next }));
                                      }}
                                      placeholder="Nome do fornecedor"
                                      className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm outline-none transition-colors focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                                    />
                                  </div>
                                  <div>
                                    <label className="mb-1 block text-[10px] font-medium text-muted-foreground">
                                      Material/Qtd
                                    </label>
                                    <div className="flex gap-1">
                                      <input
                                        type="text"
                                        value={coleta.material}
                                        onChange={(ev) => {
                                          const next = [...form.coletas];
                                          next[i] = { ...next[i], material: ev.target.value };
                                          setForm((p) => ({ ...p, coletas: next }));
                                        }}
                                        placeholder="Material"
                                        className="flex-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm outline-none transition-colors focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                                      />
                                      <input
                                        type="text"
                                        value={coleta.quantidade}
                                        onChange={(ev) => {
                                          const next = [...form.coletas];
                                          next[i] = { ...next[i], quantidade: ev.target.value };
                                          setForm((p) => ({ ...p, coletas: next }));
                                        }}
                                        placeholder="Qtd"
                                        className="w-16 rounded-lg border border-border bg-background px-2 py-1.5 text-sm outline-none transition-colors focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <label className="mb-1 block text-[10px] font-medium text-muted-foreground">
                                      Local de Coleta
                                    </label>
                                    <input
                                      type="text"
                                      value={coleta.local_coleta}
                                      onChange={(ev) => {
                                        const next = [...form.coletas];
                                        next[i] = { ...next[i], local_coleta: ev.target.value };
                                        setForm((p) => ({ ...p, coletas: next }));
                                      }}
                                      placeholder="Cidade / Endereço"
                                      className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm outline-none transition-colors focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                                    />
                                  </div>
                                </div>
                                {form.coletas.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => setForm((p) => ({ ...p, coletas: p.coletas.filter((_, j) => j !== i) }))}
                                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive mt-5"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => setForm((p) => ({
                                ...p,
                                coletas: [...p.coletas, { fornecedor: "", material: "", quantidade: "", local_coleta: "" }]
                              }))}
                              className="flex items-center gap-1 text-[11px] font-medium text-primary transition-colors hover:text-primary/80"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              Adicionar Coleta
                            </button>
                          </div>
                        </div>

                    <div className="border-t border-border/50" />

                        {/* Section: Entregas */}
                        <div>
                          <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                            Entregas
                          </h3>
                          <div className="space-y-2">
                            {form.entregas.map((entrega, i) => (
                              <div
                                key={i}
                                className="rounded-lg border border-border/60 bg-background p-3 flex items-start gap-2"
                              >
                                <div className="flex-1 grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="mb-1 block text-[10px] font-medium text-muted-foreground">
                                      Cliente <span className="text-destructive">*</span>
                                    </label>
                                    <input
                                      type="text"
                                      value={entrega.cliente}
                                      onChange={(ev) => {
                                        const next = [...form.entregas];
                                        next[i] = { ...next[i], cliente: ev.target.value };
                                        setForm((p) => ({ ...p, entregas: next }));
                                      }}
                                      placeholder="Nome do cliente"
                                      className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm outline-none transition-colors focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                                    />
                                  </div>
                                  <div>
                                    <label className="mb-1 block text-[10px] font-medium text-muted-foreground">
                                      Local de Entrega <span className="text-destructive">*</span>
                                    </label>
                                    <input
                                      type="text"
                                      value={entrega.local_entrega}
                                      onChange={(ev) => {
                                        const next = [...form.entregas];
                                        next[i] = { ...next[i], local_entrega: ev.target.value };
                                        setForm((p) => ({ ...p, entregas: next }));
                                      }}
                                      placeholder="Cidade / Endereço de entrega"
                                      className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm outline-none transition-colors focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                                    />
                                  </div>
                                </div>
                                {form.entregas.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => setForm((p) => ({ ...p, entregas: p.entregas.filter((_, j) => j !== i) }))}
                                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive mt-5"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => setForm((p) => ({
                                ...p,
                                entregas: [...p.entregas, { cliente: "", local_entrega: "" }]
                              }))}
                              className="flex items-center gap-1 text-[11px] font-medium text-primary transition-colors hover:text-primary/80"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              Adicionar Entrega
                            </button>
                          </div>
                        </div>

                    <div className="border-t border-border/50" />

                    {/* Section 3: Dados do Veículo e Status */}
                    <div>
                      <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                        Dados do Veículo e Status
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="mb-1 block text-[11px] font-medium text-muted-foreground">
                            Nome do Motorista
                          </label>
                          <select
                            value={selectedMotoristaId}
                            onChange={(e) => {
                              const motId = e.target.value;
                              setSelectedMotoristaId(motId);
                              const mot = motoristas.find((m) => m.id === motId);
                              if (mot) {
                                setForm((p) => ({ ...p, motorista: mot.nome, motorista_id: mot.id, placa: mot.placas[0] ?? "" }));
                                setSelectedPlaca(mot.placas[0] ?? "");
                              } else {
                                setForm((p) => ({ ...p, motorista: "", motorista_id: null }));
                                setSelectedPlaca("");
                              }
                            }}
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                          >
                            <option value="">Sem motorista</option>
                            {motoristas.map((mot) => (
                              <option key={mot.id} value={mot.id}>{mot.nome}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-[11px] font-medium text-muted-foreground">
                            Placa <span className="text-destructive">*</span>
                          </label>
                          {selectedMotoristaId && motoristas.find((m) => m.id === selectedMotoristaId)?.placas.length ? (
                            <div className="flex flex-wrap gap-1">
                              {motoristas.find((m) => m.id === selectedMotoristaId)!.placas.map((p) => (
                                <button
                                  key={p}
                                  type="button"
                                  onClick={() => {
                                    setSelectedPlaca(p);
                                    setForm((prev) => ({ ...prev, placa: p }));
                                  }}
                                  className={`rounded-md border px-2.5 py-1 text-[11px] font-mono font-medium transition-colors ${
                                    selectedPlaca === p
                                      ? "border-primary bg-primary/10 text-primary"
                                      : "border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                                  }`}
                                >
                                  {p}
                                </button>
                              ))}
                              <input
                                type="text"
                                value={form.placa}
                                onChange={(e) => {
                                  setForm((p) => ({ ...p, placa: e.target.value }));
                                  setSelectedPlaca("");
                                }}
                                placeholder="Ou digite outra placa"
                                className="ml-1 flex-1 rounded-lg border border-border bg-background px-2.5 py-1 text-sm outline-none transition-colors focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                              />
                            </div>
                          ) : (
                            <input
                              type="text"
                              value={form.placa}
                              onChange={(e) => setForm((p) => ({ ...p, placa: e.target.value }))}
                              placeholder="Ex: ABC-1234"
                              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                            />
                          )}
                        </div>
                        <div>
                          <label className="mb-1 block text-[11px] font-medium text-muted-foreground">
                            Data do Embarque <span className="text-destructive">*</span>
                          </label>
                          <input
                            type="date"
                            value={form.data}
                            onChange={(e) => setForm((p) => ({ ...p, data: e.target.value }))}
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-[11px] font-medium text-muted-foreground">
                            Status do Motorista
                          </label>
                          <select
                            value={form.status_motorista}
                            onChange={(e) => setForm((p) => ({ ...p, status_motorista: e.target.value }))}
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                          >
                            <option value="">Selecionar...</option>
                            <option value="avisado">Avisado</option>
                            <option value="sem_motorista">Sem motorista</option>
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-[11px] font-medium text-muted-foreground">
                            Status do Embarque
                          </label>
                          <select
                            value={form.status_embarque}
                            onChange={(e) => setForm((p) => ({ ...p, status_embarque: e.target.value }))}
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                          >
                            <option value="confirmado">Confirmado</option>
                            <option value="standby">Não confirmado</option>
                          </select>
                        </div>
                      </div>

                      <div className="mt-4">
                        <label className="mb-1 block text-[11px] font-medium text-muted-foreground">
                          Observações
                        </label>
                        <textarea
                          value={form.obs}
                          onChange={(e) => setForm((p) => ({ ...p, obs: e.target.value }))}
                          placeholder="Observações adicionais..."
                          rows={2}
                          className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                        />
                      </div>
                    </div>

                      {formError && (
                        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                          <span>{formError}</span>
                        </div>
                      )}
                    </div>

                    <div className="shrink-0 flex justify-end gap-2 border-t border-border bg-card px-6 py-4">
                        <button
                          type="button"
                          onClick={closeModal}
                          className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={saving}
                          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {saving ? (
                            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                          ) : (
                            <Save className="h-3.5 w-3.5" />
                          )}
                          {saving ? "Salvando..." : "Salvar"}
                        </button>
                      </div>
                    </form>
                  </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </motion.div>
  );
}
