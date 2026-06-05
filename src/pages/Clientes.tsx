import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, Save, X, AlertCircle, Search, Building2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { listClientes, searchClientes, createCliente, updateCliente, deleteCliente } from "@/lib/clientes";
import type { Cliente } from "@/types/clientes";

export function Clientes() {
  const [records, setRecords] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [nome, setNome] = useState("");
  const [local, setLocal] = useState("");
  const [frete, setFrete] = useState("");
  const [condPagto, setCondPagto] = useState("");

  useEffect(() => {
    loadRecords();
  }, []);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel("public:clientes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "clientes" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setRecords((prev) => [payload.new as Cliente, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setRecords((prev) =>
              prev.map((c) =>
                c.id === (payload.new as Cliente).id
                  ? { ...c, ...(payload.new as Cliente) }
                  : c
              )
            );
          } else if (payload.eventType === "DELETE") {
            setRecords((prev) =>
              prev.filter((c) => c.id !== (payload.old as Cliente).id)
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
        const results = await searchClientes(trimmed);
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
      const data = await listClientes();
      setRecords(data);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setNome("");
    setLocal("");
    setFrete("");
    setCondPagto("");
    setEditingId(null);
    setError("");
    setSuccess("");
  }

  function openCreate() {
    resetForm();
    setShowForm(true);
  }

  function startEdit(cliente: Cliente) {
    setNome(cliente.nome);
    setLocal(cliente.local ?? "");
    setFrete(cliente.frete_acordado ?? "");
    setCondPagto(cliente.cond_pagamento ?? "");
    setEditingId(cliente.id);
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    resetForm();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) {
      setError("O nome do cliente é obrigatório.");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (editingId) {
        await updateCliente(editingId, {
          nome: nome.trim(), local: local.trim(), frete_acordado: frete.trim(), cond_pagamento: condPagto.trim()
        });
        setSuccess("Cliente atualizado com sucesso!");
      } else {
        await createCliente({
          nome: nome.trim(), local: local.trim(), frete_acordado: frete.trim(), cond_pagamento: condPagto.trim()
        });
        setSuccess("Cliente cadastrado com sucesso!");
      }
      setShowForm(false);
      resetForm();
      loadRecords();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao salvar cliente.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(cliente: Cliente) {
    if (!window.confirm(`Tem certeza que deseja excluir "${cliente.nome}"?`)) return;
    try {
      await deleteCliente(cliente.id);
      setSuccess("Cliente excluído.");
      loadRecords();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao excluir.");
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-3 border-l-2 border-primary pl-3">
        <Building2 className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-semibold">Clientes</h1>
      </div>

      {/* Search + New button */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou local..."
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
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-glow"
        >
          <Plus className="h-3.5 w-3.5" />
          Novo cliente
        </button>
      </div>

      {/* Success/Error messages */}
      {success && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-500">
          <span>{success}</span>
          <button onClick={() => setSuccess("")} className="ml-auto"><X className="h-3 w-3" /></button>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold">{editingId ? "Editar cliente" : "Novo cliente"}</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Nome *</label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Nome do cliente"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Local</label>
                <input
                  type="text"
                  value={local}
                  onChange={(e) => setLocal(e.target.value)}
                  placeholder="Cidade / Endereço"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Frete Acordado</label>
                <input
                  type="text"
                  value={frete}
                  onChange={(e) => setFrete(e.target.value)}
                  placeholder="Valor do frete"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Cond. Pagamento</label>
                <input
                  type="text"
                  value={condPagto}
                  onChange={(e) => setCondPagto(e.target.value)}
                  placeholder="Ex: 30 dias"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={cancelForm}
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
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card transition-shadow duration-200 hover:shadow-glow">
        <div className="table-responsive-wrapper">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted">
                {["Nome", "Local", "Frete Acordado", "Cond. Pagamento", "Cadastro"].map((h) => (
                  <th key={h} className="whitespace-nowrap px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {h}
                  </th>
                ))}
                <th className="px-4 py-3 text-right" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center text-sm text-muted-foreground">
                    Carregando...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center text-sm text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Building2 className="h-8 w-8 opacity-20" />
                      <span>Nenhum cliente encontrado</span>
                    </div>
                  </td>
                </tr>
              ) : (
                records.map((cliente) => (
                  <tr
                    key={cliente.id}
                    className="border-b border-border transition-colors last:border-0 hover:bg-accent"
                  >
                    <td className="whitespace-nowrap px-4 py-3.5 text-sm font-medium">{cliente.nome}</td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-xs text-muted-foreground">
                      {cliente.local || "-"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-xs text-muted-foreground">
                      {cliente.frete_acordado || "-"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-xs text-muted-foreground">
                      {cliente.cond_pagamento || "-"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-xs text-muted-foreground">
                      {new Date(cliente.created_at).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => startEdit(cliente)}
                          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(cliente)}
                          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
