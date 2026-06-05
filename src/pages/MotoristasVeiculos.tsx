import { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  AlertCircle,
  CheckCircle2,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabaseClient";
import { createMotoristaVeiculo, listMotoristasVeiculos, updateMotoristaVeiculo, deleteMotoristaVeiculo, searchMotoristasVeiculos } from "@/lib/motoristasVeiculos";
import type { MotoristaVeiculo } from "@/types/motoristaVeiculo";

const CAPACIDADE_OPTIONS = [
  "12 TON", "15 TON", "20 TON", "25 TON", "27 TON",
  "30 TON", "32 TON", "35 TON", "40 TON", "45 TON", "50 TON",
];

const PLACA_REGEX = /^[A-Za-z]{3}-\d[A-Za-z0-9]\d{2}$/;

function formatPlaca(val: string): string {
  const upper = val.toUpperCase().replace(/[^A-Z0-9-]/g, "");
  if (upper.length <= 3) return upper;
  if (upper.length === 4 && !upper.includes("-")) return upper.slice(0, 3) + "-" + upper.slice(3);
  const parts = upper.split("-");
  if (parts.length > 1) return parts[0].slice(0, 3) + "-" + parts[1].slice(0, 4);
  return upper.slice(0, 7);
}

export function MotoristasVeiculos() {
  const [records, setRecords] = useState<MotoristaVeiculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [nome, setNome] = useState("");
  const [placas, setPlacas] = useState([""]);
  const [capacidade, setCapacidade] = useState(CAPACIDADE_OPTIONS[0]);
  const [carroceria, setCarroceria] = useState("");

  useEffect(() => {
    loadRecords();
  }, []);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel("public:motoristas_veiculos")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "motoristas_veiculos" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setRecords((prev) => [payload.new as MotoristaVeiculo, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setRecords((prev) =>
              prev.map((r) =>
                r.id === (payload.new as MotoristaVeiculo).id
                  ? { ...r, ...(payload.new as MotoristaVeiculo) }
                  : r
              )
            );
          } else if (payload.eventType === "DELETE") {
            setRecords((prev) =>
              prev.filter((r) => r.id !== (payload.old as MotoristaVeiculo).id)
            );
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Busca com debounce
  useEffect(() => {
    const trimmed = search.trim();
    if (trimmed.length < 2) {
      loadRecords();
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const results = await searchMotoristasVeiculos(trimmed);
        setRecords(results);
      } catch {
        setRecords([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  async function loadRecords() {
    setLoading(true);
    try {
      const data = await listMotoristasVeiculos();
      setRecords(data);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setNome("");
    setPlacas([""]);
    setCapacidade(CAPACIDADE_OPTIONS[0]);
    setCarroceria("");
    setEditingId(null);
  }

  function startEdit(rec: MotoristaVeiculo) {
    setNome(rec.nome);
    setPlacas(rec.placas.length > 0 ? [...rec.placas] : [""]);
    setCapacidade(rec.capacidade);
    setCarroceria(rec.carroceria);
    setEditingId(rec.id);
    setError("");
    setSuccess("");
  }

  function handlePlacaChange(i: number, val: string) {
    const next = [...placas];
    next[i] = formatPlaca(val);
    setPlacas(next);
  }

  function addPlaca() {
    setPlacas([...placas, ""]);
  }

  function removePlaca(i: number) {
    if (placas.length <= 1) return;
    setPlacas(placas.filter((_, j) => j !== i));
  }

  function placasValidas(): boolean {
    const preenchidas = placas.filter((p) => p.trim().length > 0);
    if (preenchidas.length === 0) return false;
    return preenchidas.every((p) => PLACA_REGEX.test(p));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!nome.trim() || !carroceria.trim()) {
      setError("Preencha todos os campos obrigatórios.");
      return;
    }

    const placasPreenchidas = placas.map((p) => p.trim()).filter(Boolean);
    if (placasPreenchidas.length === 0) {
      setError("Informe ao menos uma placa.");
      return;
    }

    const invalidas = placasPreenchidas.filter((p) => !PLACA_REGEX.test(p));
    if (invalidas.length > 0) {
      setError(`Formato inválido: ${invalidas.join(", ")}. Use AAA-0000 ou AAA-0A00.`);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        nome: nome.trim(),
        placas: placasPreenchidas.map((p) => p.toUpperCase()),
        capacidade,
        carroceria: carroceria.trim(),
      };

      if (editingId) {
        await updateMotoristaVeiculo(editingId, payload);
        setSuccess("Registro atualizado com sucesso!");
      } else {
        await createMotoristaVeiculo(payload);
        setSuccess("Registro criado com sucesso!");
      }

      resetForm();
      loadRecords();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao salvar.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, nomeRec: string) {
    if (!window.confirm(`Tem certeza que deseja excluir "${nomeRec}"?`)) return;
    setError("");
    setSuccess("");
    try {
      await deleteMotoristaVeiculo(id);
      setSuccess(`"${nomeRec}" excluído com sucesso.`);
      loadRecords();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao excluir.";
      setError(msg);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
      <div className="flex items-center gap-3">
        <Users className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-semibold">Motoristas e Veículos</h1>
      </div>

      {/* Form */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            {editingId ? <Pencil className="h-4 w-4 text-primary" /> : <Plus className="h-4 w-4 text-primary" />}
          </div>
          <div>
            <h2 className="text-sm font-semibold">{editingId ? "Editar registro" : "Adicionar novo registro"}</h2>
            <p className="text-xs text-muted-foreground">
              {editingId ? "Altere os dados e salve." : "Preencha os dados do motorista e veículo."}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Nome do Motorista <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Nome completo"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Capacidade
              </label>
              <select
                value={capacidade}
                onChange={(e) => setCapacidade(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
              >
                {CAPACIDADE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Placas <span className="text-destructive">*</span>
              </label>
              <div className="space-y-1.5">
                {placas.map((placa, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={placa}
                      onChange={(e) => handlePlacaChange(i, e.target.value)}
                      placeholder="AAA-0000 / AAA-0A00"
                      className={cn(
                        "flex-1 rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:ring-1",
                        placa && !PLACA_REGEX.test(placa) && placa.length >= 7
                          ? "border-destructive/50 focus:border-destructive focus:ring-destructive/30"
                          : "border-border bg-background focus:border-primary/50 focus:ring-primary/30"
                      )}
                    />
                    {placas.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePlaca(i)}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addPlaca}
                  className="flex items-center gap-1 text-[11px] font-medium text-primary transition-colors hover:text-primary/80"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Adicionar Placa
                </button>
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Carroceria <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={carroceria}
                onChange={(e) => setCarroceria(e.target.value)}
                placeholder="Ex: Baú, Sider, Graneleiro, etc."
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{error}</span>
              <button type="button" onClick={() => setError("")} className="ml-auto"><X className="h-3 w-3" /></button>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-500">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              <span>{success}</span>
              <button type="button" onClick={() => setSuccess("")} className="ml-auto"><X className="h-3 w-3" /></button>
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? "Salvando..." : editingId ? "Atualizar" : "Adicionar"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <X className="h-4 w-4" />
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por motorista ou placa..."
          className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-8 text-sm transition-all placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:shadow-glow"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold">Registros cadastrados</h2>

        {loading ? (
          <p className="text-xs text-muted-foreground">Carregando...</p>
        ) : records.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhum registro encontrado.</p>
        ) : (
          <div className="table-responsive-wrapper">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="pb-2 font-medium">Motorista</th>
                  <th className="pb-2 font-medium">Placas</th>
                  <th className="pb-2 font-medium">Capacidade</th>
                  <th className="pb-2 font-medium">Carroceria</th>
                  <th className="pb-2 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {records.map((rec) => (
                  <tr key={rec.id} className="border-b border-border/50 last:border-0">
                    <td className="py-2.5 text-sm font-medium">{rec.nome}</td>
                    <td className="py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {rec.placas.length > 0 ? rec.placas.map((p, i) => (
                          <span
                            key={i}
                            className="inline-block rounded-md border border-border/60 bg-muted/50 px-1.5 py-0.5 text-[11px] font-mono font-medium text-foreground"
                          >
                            {p}
                          </span>
                        )) : <span className="text-xs text-muted-foreground">-</span>}
                      </div>
                    </td>
                    <td className="py-2.5 text-xs text-muted-foreground">{rec.capacidade}</td>
                    <td className="py-2.5 text-xs text-muted-foreground">{rec.carroceria}</td>
                    <td className="py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => startEdit(rec)}
                          className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                          title="Editar"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(rec.id, rec.nome)}
                          className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                          title="Excluir"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
