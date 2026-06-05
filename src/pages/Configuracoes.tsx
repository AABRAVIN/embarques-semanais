import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  UserPlus,
  Shield,
  Mail,
  KeyRound,
  User,
  CheckCircle2,
  AlertCircle,
  X,
  Trash2,
  Lock,
  Download,
  Archive,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { signUp, listProfiles } from "@/lib/auth";
import { supabase } from "@/lib/supabaseClient";
import { fetchAllEmbarquesForExport, exportToExcel, exportToJSON } from "@/lib/export";
import { archiveConcludedEmbarques } from "@/lib/embarques";
import type { Profile } from "@/types/profiles";

export function Configuracoes() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userRole, setUserRole] = useState("usuario");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [archiveLoading, setArchiveLoading] = useState(false);

  // Password change modal state
  const [passwordTarget, setPasswordTarget] = useState<{ id: string; nome: string } | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  const isAdmin = profile?.role === "admin";

  useEffect(() => {
    if (!loading && profile && !isAdmin) {
      navigate("/", { replace: true });
    }
  }, [loading, profile, isAdmin, navigate]);

  useEffect(() => {
    if (isAdmin) {
      loadProfiles();
    }
  }, [isAdmin]);

  async function loadProfiles() {
    setLoadingProfiles(true);
    try {
      const data = await listProfiles();
      setProfiles(data);
    } catch {
      setProfiles([]);
    } finally {
      setLoadingProfiles(false);
    }
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!nome.trim() || !email.trim() || !password.trim()) {
      setError("Preencha todos os campos.");
      return;
    }

    if (password.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres.");
      return;
    }

    setLoading(true);
    try {
      const result = await signUp(email, password, nome, userRole);

      if (result.user?.identities?.length === 0) {
        setSuccess(
          "Usuário criado! Pode ser necessário confirmar o e-mail antes do primeiro login."
        );
      } else {
        setSuccess("Usuário criado com sucesso!");
      }

      setNome("");
      setEmail("");
      setPassword("");
      setUserRole("usuario");
      loadProfiles();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao criar usuário.";
      if (msg.includes("already registered")) {
        setError("Este e-mail já está cadastrado.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteUser(id: string, nome: string) {
    if (!window.confirm(`Tem certeza que deseja excluir o usuário "${nome}"?`)) return;
    setActionLoading(id);
    setError("");
    setSuccess("");
    try {
      const { error } = await supabase.rpc("delete_user", { user_id: id });
      if (error) throw error;
      setSuccess(`Usuário "${nome}" excluído com sucesso.`);
      loadProfiles();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao excluir usuário.";
      setError(msg);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleChangePassword() {
    if (!passwordTarget) return;
    if (!newPassword || newPassword.length < 6) {
      setPasswordError("A senha deve ter no mínimo 6 caracteres.");
      return;
    }
    setPasswordLoading(true);
    setPasswordError("");
    try {
      const { error } = await supabase.rpc("update_user_password", {
        user_id: passwordTarget.id,
        new_password: newPassword,
      });
      if (error) throw error;
      setSuccess(`Senha do usuário "${passwordTarget.nome}" alterada com sucesso!`);
      setPasswordTarget(null);
      setNewPassword("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao alterar senha.";
      setPasswordError(msg);
    } finally {
      setPasswordLoading(false);
    }
  }

  async function handleArchive() {
    console.log("[handleArchive] Botão clicado!");
    if (!window.confirm("Arquivar todos os embarques concluídos há mais de 30 dias?")) {
      console.log("[handleArchive] Usuário cancelou.");
      return;
    }
    console.log("[handleArchive] Usuário confirmou. Iniciando...");
    setArchiveLoading(true);
    setError("");
    setSuccess("");
    try {
      const count = await archiveConcludedEmbarques(30);
      if (count === 0) {
        setSuccess("Nenhum embarque concluído antigo para arquivar.");
      } else {
        setSuccess(`${count} embarque(s) arquivado(s) com sucesso!`);
      }
    } catch (err: unknown) {
      console.error("[handleArchive] Erro capturado:", err);
      const msg = err instanceof Error ? err.message : "Erro ao arquivar.";
      setError(msg);
    } finally {
      setArchiveLoading(false);
    }
  }

  async function handleExport(format: "xlsx" | "json") {
    setShowExportDropdown(false);
    setExportLoading(true);
    setError("");
    setSuccess("");
    try {
      const data = await fetchAllEmbarquesForExport();
      if (data.length === 0) {
        setError("Nenhum dado encontrado para exportar.");
        return;
      }
      if (format === "xlsx") {
        exportToExcel(data);
      } else {
        exportToJSON(data);
      }
      setSuccess(`Backup exportado como ${format.toUpperCase()} com sucesso!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao exportar backup.";
      setError(msg);
    } finally {
      setExportLoading(false);
    }
  }

  if (loading) return null;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
      <div className="flex items-center gap-3">
        <Shield className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-semibold">Configurações</h1>
      </div>

      {/* User creation form - Admin only */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <UserPlus className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Adicionar novo usuário</h2>
            <p className="text-xs text-muted-foreground">
              Crie contas para motoristas, clientes ou outros administradores.
            </p>
          </div>
        </div>

        <form onSubmit={handleCreateUser} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <User className="h-3.5 w-3.5" />
                Nome completo
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Nome do usuário"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Mail className="h-3.5 w-3.5" />
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@exemplo.com"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <KeyRound className="h-3.5 w-3.5" />
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Shield className="h-3.5 w-3.5" />
                Perfil de acesso
              </label>
              <select
                value={userRole}
                onChange={(e) => setUserRole(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
              >
                <option value="usuario">Usuário</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{error}</span>
              <button
                type="button"
                onClick={() => setError("")}
                className="ml-auto"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-500">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              <span>{success}</span>
              <button
                type="button"
                onClick={() => setSuccess("")}
                className="ml-auto"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            {loading ? "Criando..." : "Criar usuário"}
          </button>
        </form>
      </div>

      {/* Users list */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold">Usuários cadastrados</h2>

        {loadingProfiles ? (
          <p className="text-xs text-muted-foreground">Carregando...</p>
        ) : profiles.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhum usuário encontrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="pb-2 font-medium">Nome</th>
                  <th className="pb-2 font-medium">E-mail</th>
                  <th className="pb-2 font-medium">Perfil</th>
                  <th className="pb-2 font-medium">Criado em</th>
                  <th className="pb-2 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((p) => (
                  <tr key={p.id} className="border-b border-border/50 last:border-0">
                    <td className="py-2.5 text-sm">{p.nome}</td>
                    <td className="py-2.5 text-xs text-muted-foreground">{p.email}</td>
                    <td className="py-2.5">
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.5 text-[10px] font-medium",
                          p.role === "admin"
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {p.role === "admin" ? "Admin" : "Usuário"}
                      </span>
                    </td>
                    <td className="py-2.5 text-xs text-muted-foreground">
                      {new Date(p.created_at).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setPasswordTarget({ id: p.id, nome: p.nome })}
                          disabled={actionLoading === p.id}
                          className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40"
                          title="Alterar senha"
                        >
                          <Lock className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(p.id, p.nome)}
                          disabled={actionLoading === p.id}
                          className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
                          title="Excluir usuário"
                        >
                          {actionLoading === p.id ? (
                            <span className="h-3 w-3 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
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

      {/* Export backup card */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Download className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Exportar Backup Completo</h2>
            <p className="text-xs text-muted-foreground">
              Baixe todos os embarques (ativos + histórico) em Excel ou JSON.
            </p>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowExportDropdown(!showExportDropdown)}
            disabled={exportLoading}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {exportLoading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {exportLoading ? "Exportando..." : "Exportar Backup Completo"}
          </button>

          {showExportDropdown && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowExportDropdown(false)}
              />
              <div className="absolute left-0 top-full z-50 mt-1 w-44 rounded-xl border border-border bg-card p-1 shadow-lg">
                <button
                  onClick={() => handleExport("xlsx")}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
                >
                  Excel (.xlsx)
                </button>
                <button
                  onClick={() => handleExport("json")}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
                >
                  JSON (.json)
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Archive card */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Archive className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Arquivar Embarques Concluídos</h2>
            <p className="text-xs text-muted-foreground">
              Move embarques com status "concluído" e mais de 30 dias para o histórico.
            </p>
          </div>
        </div>

        <button
          onClick={handleArchive}
          disabled={archiveLoading}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {archiveLoading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <Archive className="h-4 w-4" />
          )}
          {archiveLoading ? "Arquivando..." : "Arquivar Agora"}
        </button>
      </div>

      {/* Password change modal */}
      {passwordTarget && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60" onClick={() => { setPasswordTarget(null); setNewPassword(""); setPasswordError(""); }}>
          <div
            className="w-full max-w-sm rounded-xl border border-border bg-card p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">Alterar senha</h3>
              </div>
              <button
                onClick={() => { setPasswordTarget(null); setNewPassword(""); setPasswordError(""); }}
                className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Usuário: <span className="font-medium text-foreground">{passwordTarget.nome}</span>
            </p>
            <div className="mt-4">
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Nova senha
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
              />
            </div>
            {passwordError && (
              <p className="mt-2 text-xs text-destructive">{passwordError}</p>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => { setPasswordTarget(null); setNewPassword(""); setPasswordError(""); }}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                Cancelar
              </button>
              <button
                onClick={handleChangePassword}
                disabled={passwordLoading}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {passwordLoading ? (
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                ) : (
                  <KeyRound className="h-3.5 w-3.5" />
                )}
                {passwordLoading ? "Alterando..." : "Alterar senha"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
