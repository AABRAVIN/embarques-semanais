import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import {
  LayoutDashboard,
  Truck,
  Calendar,
  AlertTriangle,
  Users,
  Car,
  Building2,
  Bell,
  BarChart3,
  ScrollText,
  Settings,
  Shield,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/", adminOnly: false },
  { label: "Embarques", icon: Truck, href: "/embarques", adminOnly: false },
  { label: "Agenda", icon: Calendar, href: "/agenda", adminOnly: false },
  { label: "Ocorrências", icon: AlertTriangle, href: "/ocorrencias", adminOnly: false },
  { label: "Motoristas", icon: Users, href: "/motoristas", adminOnly: false },
  { label: "Veículos", icon: Car, href: "/veiculos", adminOnly: false },
  { label: "Clientes", icon: Building2, href: "/clientes", adminOnly: false },
  { label: "Notificações", icon: Bell, href: "/notificacoes", badge: 3, adminOnly: false },
  { label: "Relatórios", icon: BarChart3, href: "/relatorios", adminOnly: false },
  { label: "Logs", icon: ScrollText, href: "/logs", adminOnly: false },
  { label: "Usuários", icon: Shield, href: "/usuarios", adminOnly: true },
  { label: "Configurações", icon: Settings, href: "/configuracoes", adminOnly: true },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.03, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -16 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.25, ease: "easeOut" as const } },
};

interface SidebarProps {
  activePath?: string;
}

export function Sidebar({ activePath: _activePath }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const isAdmin = profile?.role === "admin";
  const activePath = location.pathname;

  const visibleItems = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);

  async function handleLogout() {
    await signOut();
    navigate("/login", { replace: true });
  }

  return (
    <motion.aside
      layout
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className={cn(
        "flex h-screen flex-col bg-sidebar text-sidebar-foreground transition-[width] duration-300",
        collapsed ? "w-16" : "w-[var(--sidebar-width)]"
      )}
    >
      {/* Logo */}
      <div className="flex h-[var(--header-height)] items-center gap-3 border-b border-border/50 px-4">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground shadow-glow"
        >
          TL
        </motion.div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="overflow-hidden text-lg font-bold tracking-tight text-foreground"
            >
              Embarques Semanais
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden p-2">
        <motion.ul
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-0.5"
        >
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePath === item.href;
            return (
              <motion.li key={item.href} variants={itemVariants}>
                <Link
                  to={item.href}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-sidebar-active/20 text-sidebar-active-foreground shadow-sm"
                      : "text-sidebar-foreground hover:bg-sidebar-hover hover:text-foreground"
                  )}
                >
                  {isActive && (
                    <motion.span
                      layoutId="active-nav"
                      className="absolute inset-0 rounded-lg bg-sidebar-active/15"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-3">
                    <Icon className="h-5 w-5 shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </span>
                  {!collapsed && item.badge && (
                    <span className="relative z-10 ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary/20 px-1.5 text-[11px] font-semibold text-primary">
                      {item.badge}
                    </span>
                  )}
                </Link>
              </motion.li>
            );
          })}
        </motion.ul>
      </nav>

      {/* User Profile */}
      <div className="border-t border-border/50 p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <motion.div
            whileHover={{ scale: 1.1 }}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sidebar-hover"
          >
            <User className="h-4 w-4 text-sidebar-foreground" />
          </motion.div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 overflow-hidden"
              >
                <p className="truncate text-sm font-medium text-foreground">
                  {profile?.nome ?? "Usuário"}
                </p>
                <p className="truncate text-xs text-sidebar-foreground">
                  {profile?.email ?? ""}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <motion.button
          whileHover={{ x: 4 }}
          onClick={handleLogout}
          className={cn(
            "mt-1 flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-hover hover:text-foreground",
            collapsed && "justify-center"
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                Sair do sistema
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Collapse toggle */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center border-t border-border/50 py-3 text-sidebar-foreground transition-colors hover:bg-sidebar-hover hover:text-foreground"
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </motion.button>
    </motion.aside>
  );
}
