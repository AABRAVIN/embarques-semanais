import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Plus, X, Pencil, Check, RefreshCw, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FilaItem {
  id: string;
  pos: number;
  veiculo: string;
  categoria: "VANDERLEIA" | "CARRETA LS" | "BITRUCK" | "BITREM";
  created_at: string;
}

const CATEGORIES = ["VANDERLEIA", "CARRETA LS", "BITRUCK", "BITREM"] as const;

export function OrdemChegada() {
  const [fila, setFila] = useState<FilaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // States for adding new items
  const [newVeiculo, setNewVeiculo] = useState<Record<string, string>>({
    VANDERLEIA: "",
    "CARRETA LS": "",
    BITRUCK: "",
    BITREM: "",
  });

  // State for editing name
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  // State for editing position
  const [editingPosId, setEditingPosId] = useState<string | null>(null);
  const [editingPosVal, setEditingPosVal] = useState<number>(1);

  const getErrorMessage = (err: any): string => {
    if (!err) return "Erro desconhecido";
    if (typeof err === "string") return err;
    if (err.message) return err.message;
    if (err.details) return err.details;
    return JSON.stringify(err);
  };

  // Fetch the waitlist
  const fetchFila = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: fetchErr } = await supabase
        .from("fila_espera")
        .select("*")
        .order("pos", { ascending: true });

      if (fetchErr) throw fetchErr;
      setFila(data || []);
      setError(null);
    } catch (err) {
      console.error("Erro ao carregar fila:", err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFila();
  }, [fetchFila]);

  // Group items by category
  const groupedFila = useMemo(() => {
    const groups: Record<string, FilaItem[]> = {
      VANDERLEIA: [],
      "CARRETA LS": [],
      BITRUCK: [],
      BITREM: [],
    };
    fila.forEach((item) => {
      if (groups[item.categoria]) {
        groups[item.categoria].push(item);
      }
    });
    // Ensure they are sorted by position
    CATEGORIES.forEach((cat) => {
      groups[cat].sort((a, b) => a.pos - b.pos);
    });
    return groups;
  }, [fila]);

  // Add new vehicle to a category
  const handleAddItem = async (category: typeof CATEGORIES[number]) => {
    const name = newVeiculo[category]?.trim();
    if (!name) return;

    try {
      const nextPos = groupedFila[category].length + 1;
      const { error: insertErr } = await supabase
        .from("fila_espera")
        .insert([
          {
            veiculo: name,
            categoria: category,
            pos: nextPos,
          },
        ]);

      if (insertErr) throw insertErr;

      setNewVeiculo((prev) => ({ ...prev, [category]: "" }));
      await fetchFila();
    } catch (err) {
      console.error("Erro ao adicionar item:", err);
      alert(getErrorMessage(err));
    }
  };

  // Delete vehicle and reorder the rest of the category
  const handleDeleteItem = async (itemId: string, category: string, currentItems: FilaItem[]) => {
    const confirmDelete = window.confirm("Deseja realmente remover este veículo da fila?");
    if (!confirmDelete) return;

    try {
      // 1. Try SQL RPC first
      const { error: rpcErr } = await supabase.rpc("delete_from_fila_espera", {
        p_id: itemId,
      });

      if (!rpcErr) {
        await fetchFila();
        return;
      }
      console.warn("RPC delete_from_fila_espera not found, executing client-side fallback:", rpcErr.message);
    } catch (e) {
      console.warn("RPC call failed, using client-side fallback", e);
    }

    // 2. Client-side fallback delete & shift
    try {
      const targetItem = currentItems.find((item) => item.id === itemId);
      if (!targetItem) return;

      const oldPos = targetItem.pos;

      const { error: deleteErr } = await supabase
        .from("fila_espera")
        .delete()
        .eq("id", itemId);

      if (deleteErr) throw deleteErr;

      const updates = currentItems
        .filter((item) => item.id !== itemId && item.pos > oldPos)
        .map((item) =>
          supabase
            .from("fila_espera")
            .update({ pos: item.pos - 1 })
            .eq("id", item.id)
        );

      if (updates.length > 0) {
        await Promise.all(updates);
      }
      await fetchFila();
    } catch (err) {
      console.error("Erro ao excluir item:", err);
      alert(getErrorMessage(err));
    }
  };

  // Edit vehicle name
  const handleSaveName = async (itemId: string) => {
    const trimmed = editingName.trim();
    if (!trimmed) return;

    try {
      const { error: updateErr } = await supabase
        .from("fila_espera")
        .update({ veiculo: trimmed })
        .eq("id", itemId);

      if (updateErr) throw updateErr;

      setEditingId(null);
      await fetchFila();
    } catch (err) {
      console.error("Erro ao salvar nome:", err);
      alert(getErrorMessage(err));
    }
  };

  // Reorder positions
  const handleSavePosition = async (itemId: string, newPos: number, category: string, currentItems: FilaItem[]) => {
    const maxPos = currentItems.length;
    const clampedNewPos = Math.max(1, Math.min(newPos, maxPos));

    setEditingPosId(null);

    try {
      // 1. Try SQL RPC first
      const { error: rpcErr } = await supabase.rpc("reorder_fila_espera", {
        p_id: itemId,
        p_new_pos: clampedNewPos,
      });

      if (!rpcErr) {
        await fetchFila();
        return;
      }
      console.warn("RPC reorder_fila_espera not found, executing client-side fallback:", rpcErr.message);
    } catch (e) {
      console.warn("RPC call failed, using client-side fallback", e);
    }

    // 2. Client-side fallback shift
    try {
      const targetItem = currentItems.find((item) => item.id === itemId);
      if (!targetItem) return;

      const oldPos = targetItem.pos;
      if (oldPos === clampedNewPos) return;

      const updates = [];

      for (const item of currentItems) {
        if (item.id === itemId) continue;

        if (clampedNewPos < oldPos) {
          if (item.pos >= clampedNewPos && item.pos < oldPos) {
            updates.push(
              supabase
                .from("fila_espera")
                .update({ pos: item.pos + 1 })
                .eq("id", item.id)
            );
          }
        } else {
          if (item.pos > oldPos && item.pos <= clampedNewPos) {
            updates.push(
              supabase
                .from("fila_espera")
                .update({ pos: item.pos - 1 })
                .eq("id", item.id)
            );
          }
        }
      }

      // Add main item update
      updates.push(
          supabase
            .from("fila_espera")
            .update({ pos: clampedNewPos })
          .eq("id", itemId)
      );

      await Promise.all(updates);
      await fetchFila();
    } catch (err) {
      console.error("Erro ao salvar posição:", err);
      alert(getErrorMessage(err));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="mx-auto w-full max-w-screen-2xl p-4 md:p-6"
    >
      {/* Title */}
      <div className="mb-6 flex items-center justify-between border-b border-border/40 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Ordem de Chegada</h1>
          <p className="text-xs text-muted-foreground">Fila de espera para carregamento / descarga</p>
        </div>
        <button
          onClick={fetchFila}
          disabled={loading}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-lg bg-destructive/10 px-4 py-3 text-xs text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid structure for the categories */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {CATEGORIES.map((category) => {
          const items = groupedFila[category];

          return (
            <div
              key={category}
              className="flex flex-col rounded-xl border border-border bg-card shadow-sm transition-all duration-200 hover:shadow-glow"
            >
              {/* Category Header */}
              <div className="flex items-center justify-between border-b border-border/50 bg-muted/40 p-4">
                <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  {category}
                </span>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                  {items.length} {items.length === 1 ? "veículo" : "veículos"}
                </span>
              </div>

              {/* Category Queue List */}
              <div className="flex-1 space-y-2 p-3 min-h-[300px] overflow-y-auto">
                <AnimatePresence initial={false}>
                  {items.length === 0 ? (
                    <div className="flex h-full min-h-[250px] flex-col items-center justify-center text-center text-xs text-muted-foreground">
                      <span>Nenhum veículo na fila</span>
                    </div>
                  ) : (
                    items.map((item) => {
                      const isEditingName = editingId === item.id;
                      const isEditingPos = editingPosId === item.id;

                      return (
                        <motion.div
                          key={item.id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ type: "spring", stiffness: 500, damping: 40 }}
                          className="flex items-center gap-2.5 rounded-lg border border-border/60 bg-background/50 p-2.5 transition-colors hover:border-primary/20"
                        >
                          {/* Position Badge (Editable) */}
                          <div className="shrink-0">
                            {isEditingPos ? (
                              <input
                                type="number"
                                min={1}
                                max={items.length}
                                value={editingPosVal}
                                onChange={(e) => setEditingPosVal(parseInt(e.target.value) || 1)}
                                onBlur={() => handleSavePosition(item.id, editingPosVal, category, items)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleSavePosition(item.id, editingPosVal, category, items);
                                  if (e.key === "Escape") setEditingPosId(null);
                                }}
                                className="h-7 w-10 rounded-md border border-primary bg-primary/10 text-center text-xs font-bold text-primary outline-none focus:ring-1 focus:ring-primary/30"
                                autoFocus
                              />
                            ) : (
                              <button
                                onClick={() => {
                                  setEditingPosId(item.id);
                                  setEditingPosVal(item.pos);
                                }}
                                title="Clique para alterar a posição"
                                className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-500/10 text-xs font-bold text-blue-500 border border-blue-500/25 transition-all hover:bg-blue-500/20 hover:scale-105"
                              >
                                {item.pos}
                              </button>
                            )}
                          </div>

                          {/* Vehicle Name / Edit Field */}
                          <div className="flex-1 min-w-0">
                            {isEditingName ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="text"
                                  value={editingName}
                                  onChange={(e) => setEditingName(e.target.value)}
                                  className="w-full rounded-md border border-border bg-background px-2 py-1 text-xs outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") handleSaveName(item.id);
                                    if (e.key === "Escape") setEditingId(null);
                                  }}
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveName(item.id)}
                                  className="flex h-6 w-6 items-center justify-center rounded bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25"
                                >
                                  <Check className="h-3 w-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingId(null)}
                                  className="flex h-6 w-6 items-center justify-center rounded bg-destructive/15 text-destructive hover:bg-destructive/25"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ) : (
                              <p className="truncate text-xs font-medium text-foreground">
                                {item.veiculo}
                              </p>
                            )}
                          </div>

                          {/* Actions */}
                          {!isEditingName && (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingId(item.id);
                                  setEditingName(item.veiculo);
                                }}
                                className="flex h-6 px-1.5 items-center gap-0.5 rounded border border-border/80 bg-muted/30 text-[10px] font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                              >
                                <Pencil className="h-2.5 w-2.5" />
                                EDITAR
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteItem(item.id, category, items)}
                                className="flex h-6 w-6 items-center justify-center rounded border border-destructive/20 text-destructive bg-destructive/5 transition-colors hover:bg-destructive/15"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                        </motion.div>
                      );
                    })
                  )}
                </AnimatePresence>
              </div>

              {/* Add form footer */}
              <div className="border-t border-border/40 p-3 bg-muted/10">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAddItem(category);
                  }}
                  className="flex items-center gap-1.5"
                >
                  <input
                    type="text"
                    value={newVeiculo[category] || ""}
                    onChange={(e) =>
                      setNewVeiculo((prev) => ({ ...prev, [category]: e.target.value }))
                    }
                    placeholder="Nome ou Placa..."
                    className="flex-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs outline-none transition-all placeholder:text-muted-foreground/60 focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                  />
                  <button
                    type="submit"
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-glow shrink-0"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
