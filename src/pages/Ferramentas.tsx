import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Save, X, AlertCircle, Globe } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { listLinksRapidos, createLinksRapidos, updateLinksRapidos, deleteLinksRapidos } from "@/lib/linksRapidos";
import type { LinksRapidos } from "@/types/linksRapidos";

export function Ferramentas() {
  const [records, setRecords] = useState<LinksRapidos[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [nome, setNome] = useState("");
  const [url, setUrl] = useState("");
  const [ordem, setOrdem] = useState(0);

  useEffect(() => {
    loadRecords();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("public:links_rapidos")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "links_rapidos" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setRecords((prev) => [...prev, payload.new as LinksRapidos].sort((a, b) => a.ordem - b.ordem));
          } else if (payload.eventType === "UPDATE") {
            setRecords((prev) =>
              prev.map((c) =>
                c.id === (payload.new as LinksRapidos).id
                  ? { ...c, ...(payload.new as LinksRapidos) }
                  : c
              )
            );
          } else if (payload.eventType === "DELETE") {
            setRecords((prev) =>
              prev.filter((c) => c.id !== (payload.old as LinksRapidos).id)
            );
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function loadRecords() {
    setLoading(true);
    try {
      const data = await listLinksRapidos();
      setRecords(data);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setNome("");
    setUrl("");
    setOrdem(0);
    setEditingId(null);
    setError("");
    setSuccess("");
  }

  function openCreate() {
    resetForm();
    setShowForm(true);
  }

  function startEdit(item: LinksRapidos) {
    setNome(item.nome);
    setUrl(item.url);
    setOrdem(item.ordem);
    setEditingId(item.id);
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
    if (!nome.trim() || !url.trim()) {
      setError("Nome e URL são obrigatórios.");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (editingId) {
        await updateLinksRapidos(editingId, { nome: nome.trim(), url: url.trim(), ordem });
        setSuccess("Link atualizado com sucesso!");
      } else {
        await createLinksRapidos({ nome: nome.trim(), url: url.trim(), ordem });
        setSuccess("Link cadastrado com sucesso!");
      }
      setShowForm(false);
      resetForm();
      loadRecords();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao salvar link.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item: LinksRapidos) {
    if (!window.confirm(`Tem certeza que deseja excluir "${item.nome}"?`)) return;
    try {
      await deleteLinksRapidos(item.id);
      setSuccess("Link excluído.");
      loadRecords();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao excluir.");
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-4 p-4 md:p-6">
      <div className="flex items-center gap-3 border-l-2 border-primary pl-3">
        <Globe className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-semibold">Gerenciar Links Úteis</h1>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-glow"
        >
          <Plus className="h-3.5 w-3.5" />
          Novo link
        </button>
      </div>

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

      {showForm && (
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold">{editingId ? "Editar link" : "Novo link"}</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Nome *</label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Nome do link"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-muted-foreground">URL *</label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Ordem</label>
                <input
                  type="number"
                  value={ordem}
                  onChange={(e) => setOrdem(Number(e.target.value))}
                  placeholder="0"
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

      <div className="overflow-hidden rounded-xl border border-border bg-card transition-shadow duration-200 hover:shadow-glow">
        <div className="table-responsive-wrapper">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted">
                {["Nome", "URL", "Ordem"].map((h) => (
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
                  <td colSpan={4} className="px-4 py-16 text-center text-sm text-muted-foreground">
                    Carregando...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-16 text-center text-sm text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Globe className="h-8 w-8 opacity-20" />
                      <span>Nenhum link cadastrado</span>
                    </div>
                  </td>
                </tr>
              ) : (
                records.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-border transition-colors last:border-0 hover:bg-accent"
                  >
                    <td className="whitespace-nowrap px-4 py-3.5 text-sm font-medium">{item.nome}</td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-xs text-muted-foreground">
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:text-primary hover:underline">
                        {item.url}
                      </a>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-xs text-muted-foreground">{item.ordem}</td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => startEdit(item)}
                          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
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
