import { useState, useEffect, useCallback } from "react";
import { BarChart3, Search, FileText, X, AlertCircle } from "lucide-react";
import { listEmbarquesRelatorio } from "@/lib/embarques";
import type { Embarque } from "@/types/embarque";

const STATUS_FILTERS = [
  { value: "", label: "Todos os status" },
  { value: "andamento", label: "Em andamento" },
  { value: "encerrados", label: "Encerrados" },
  { value: "cancelados", label: "Cancelados" },
];

function statusLabel(emb: Embarque): string {
  if (emb.status === "concluido" || emb.status_embarque === "concluido") return "Encerrado";
  if (emb.status === "motorista_avisado" || emb.status_motorista === "avisado") return "Motorista Avisado";
  if (emb.status === "sem_motorista" || emb.status_motorista === "sem_motorista") return "Sem Motorista";
  if (emb.status === "standby" || emb.status_embarque === "standby") return "Não confirmado";
  if (emb.status === "confirmado" || emb.status_embarque === "confirmado") return "Confirmado";
  return emb.status || emb.status_embarque || "-";
}

function formatDate(date: string | null | undefined): string {
  if (!date) return "-";
  try {
    return new Date(date).toLocaleDateString("pt-BR");
  } catch {
    return date;
  }
}

function gerarPDF(filters: { cliente: string; regiao: string; dateFrom: string; dateTo: string; status: string }, results: Embarque[]) {
  const total = results.length;
  const encerrados = results.filter((e) => e.status_embarque === "concluido" || e.status === "concluido").length;
  const andamento = results.filter((e) => e.status_embarque !== "concluido" && e.status !== "concluido").length;

  const linhasTabela = results
    .map(
      (e) => `
      <tr>
        <td style="padding:6px 8px;border-bottom:1px solid #ddd;font-size:11px;">${formatDate(e.data)}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #ddd;font-size:11px;">${e.cliente_cidade || "-"}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #ddd;font-size:11px;">${e.fornecedor_cidade || "-"}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #ddd;font-size:11px;">${e.material || "-"}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #ddd;font-size:11px;">${e.placa || "-"}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #ddd;font-size:11px;">${e.motorista || "-"}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #ddd;font-size:11px;">${statusLabel(e)}</td>
      </tr>`
    )
    .join("");

  const filtrosStr = [
    filters.cliente && `Cliente: ${filters.cliente}`,
    filters.regiao && `Região: ${filters.regiao}`,
    filters.dateFrom && `De: ${filters.dateFrom}`,
    filters.dateTo && `Até: ${filters.dateTo}`,
    STATUS_FILTERS.find((s) => s.value === filters.status)?.label,
  ]
    .filter(Boolean)
    .join(" | ");

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Relatório de Embarques</title>
<style>
  @page { margin: 20mm 15mm; }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Segoe UI',Arial,sans-serif; color:#222; padding:30px; padding-top:0; }
  .toolbar { position:sticky; top:0; z-index:10; display:flex; align-items:center; justify-content:center; background:#1e293b; padding:12px; margin:0 -30px 24px; }
  .toolbar button { display:inline-flex; align-items:center; gap:8px; background:#2563eb; color:#fff; border:none; border-radius:8px; padding:10px 24px; font-size:14px; font-weight:600; cursor:pointer; transition:background .2s; }
  .toolbar button:hover { background:#1d4ed8; }
  .toolbar button svg { width:18px; height:18px; }
  .header { display:flex; align-items:center; gap:16px; margin-bottom:24px; padding-bottom:16px; border-bottom:2px solid #2563eb; }
  .logo { width:48px; height:48px; background:#2563eb; border-radius:10px; display:flex; align-items:center; justify-content:center; color:#fff; font-weight:bold; font-size:20px; }
  .header-text h1 { font-size:18px; color:#111; }
  .header-text p { font-size:12px; color:#666; }
  .filtros { background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:12px 16px; margin-bottom:20px; font-size:12px; color:#555; }
  .resumo { display:flex; gap:16px; margin-bottom:20px; }
  .card { flex:1; border:1px solid #e2e8f0; border-radius:8px; padding:12px; text-align:center; }
  .card .num { font-size:22px; font-weight:700; color:#2563eb; }
  .card .rotulo { font-size:11px; color:#888; margin-top:4px; }
  table { width:100%; border-collapse:collapse; }
  th { background:#2563eb; color:#fff; padding:8px; font-size:11px; text-align:left; font-weight:600; }
  td { padding:6px 8px; border-bottom:1px solid #e2e8f0; font-size:11px; }
  tr:nth-child(even) { background:#f8fafc; }
  .footer { margin-top:24px; padding-top:12px; border-top:1px solid #e2e8f0; font-size:10px; color:#999; text-align:center; }
  @media print { .no-print { display:none; } body { padding:30px; } }
</style>
</head>
<body>
<div class="toolbar no-print">
  <button onclick="window.print()">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><path d="M6 14h12v8H6z"/></svg>
    Imprimir
  </button>
</div>
<div class="header">
  <div class="logo">TL</div>
  <div class="header-text">
    <h1>Relatório de Embarques</h1>
    <p>Translima - Logística e Transportes</p>
  </div>
</div>

${filtrosStr ? `<div class="filtros"><strong>Filtros aplicados:</strong> ${filtrosStr}</div>` : ""}

<div class="resumo">
  <div class="card"><div class="num">${total}</div><div class="rotulo">Total de embarques</div></div>
  <div class="card"><div class="num">${andamento}</div><div class="rotulo">Em andamento</div></div>
  <div class="card"><div class="num">${encerrados}</div><div class="rotulo">Encerrados</div></div>
</div>

<table>
<thead><tr>
  <th>Data</th><th>Cliente</th><th>Origem</th><th>Material</th><th>Placa</th><th>Motorista</th><th>Status</th>
</tr></thead>
<tbody>${linhasTabela || "<tr><td colspan='7' style='text-align:center;padding:20px;color:#999;'>Nenhum embarque encontrado.</td></tr>"}</tbody>
</table>

<div class="footer">Relatório gerado em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")} • Embarques Semanais</div>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
    win.focus();
  }
}

export function Relatorios() {
  const [cliente, setCliente] = useState("");
  const [regiao, setRegiao] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [status, setStatus] = useState("");
  const [results, setResults] = useState<Embarque[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchResults = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listEmbarquesRelatorio({
        cliente: cliente.trim() || undefined,
        regiao: regiao.trim() || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        status: status || undefined,
      });
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar dados.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [cliente, regiao, dateFrom, dateTo, status]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const total = results.length;
  const encerrados = results.filter((e) => e.status_embarque === "concluido" || e.status === "concluido").length;
  const andamento = results.filter((e) => e.status_embarque !== "concluido" && e.status !== "concluido").length;

  return (
    <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-3 border-l-2 border-primary pl-3">
        <BarChart3 className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-semibold">Relatórios de Embarques</h1>
      </div>

      {/* Filtros */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Filtros</span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Cliente</label>
            <input
              type="text"
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
              placeholder="Buscar cliente..."
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Região / Estado</label>
            <input
              type="text"
              value={regiao}
              onChange={(e) => setRegiao(e.target.value)}
              placeholder="Ex: Goiás, SP..."
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Data início</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/50 focus:ring-1 focus:ring-primary/30 [color-scheme:dark]"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Data fim</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/50 focus:ring-1 focus:ring-primary/30 [color-scheme:dark]"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
            >
              {STATUS_FILTERS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>
        {(cliente || regiao || dateFrom || dateTo || status) && (
          <button
            onClick={() => { setCliente(""); setRegiao(""); setDateFrom(""); setDateTo(""); setStatus(""); }}
            className="mt-3 flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
            Limpar filtros
          </button>
        )}
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-primary">{total}</p>
          <p className="text-xs text-muted-foreground">Total de embarques</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-amber-500">{andamento}</p>
          <p className="text-xs text-muted-foreground">Em andamento</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-emerald-500">{encerrados}</p>
          <p className="text-xs text-muted-foreground">Encerrados</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabela de resultados */}
      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold">
            Resultados {!loading && <span className="font-normal text-muted-foreground">({results.length})</span>}
          </h2>
          <button
            onClick={() => {
              if (results.length === 0) { alert("Nenhum dado para imprimir."); return; }
              gerarPDF({ cliente, regiao, dateFrom, dateTo, status }, results);
            }}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <FileText className="h-3.5 w-3.5" />
            Gerar PDF
          </button>
        </div>
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-8 animate-pulse rounded bg-muted" />
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-16 text-center text-sm text-muted-foreground">
            <BarChart3 className="h-8 w-8 opacity-20" />
            <span>Nenhum embarque encontrado com os filtros selecionados.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted">
                  {["Data", "Cliente", "Origem", "Material", "Placa", "Motorista", "Status"].map((h) => (
                    <th key={h} className="whitespace-nowrap px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map((emb) => (
                  <tr key={emb.id} className="border-b border-border/50 transition-colors last:border-0 hover:bg-accent/50">
                    <td className="whitespace-nowrap px-4 py-3 text-xs">{formatDate(emb.data)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium">{emb.cliente_cidade || "-"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">{emb.fornecedor_cidade || "-"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">{emb.material || "-"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs font-mono text-muted-foreground">{emb.placa || "-"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">{emb.motorista || "-"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs">{statusLabel(emb)}</td>
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
