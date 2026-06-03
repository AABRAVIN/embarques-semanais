import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { Dashboard } from "@/pages/Dashboard";
import { Configuracoes } from "@/pages/Configuracoes";
import { MotoristasVeiculos } from "@/pages/MotoristasVeiculos";
import { Clientes } from "@/pages/Clientes";
import { Login } from "@/pages/Login";
import { Navigate, Route, Routes } from "react-router-dom";
import { OrdemChegada } from "@/pages/OrdemChegada";

function ProtectedLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
            <Route path="/motoristas-veiculos" element={<MotoristasVeiculos />} />
            <Route path="/ordem-chegada" element={<OrdemChegada />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="*" element={<Dashboard />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/*" element={<ProtectedLayout />} />
    </Routes>
  );
}
