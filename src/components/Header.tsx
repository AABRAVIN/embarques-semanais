import { useState, useEffect } from "react";
import { Search, User } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationsPopover } from "./NotificationsPopover";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

export function Header() {
  const { profile } = useAuth();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const dateStr = now.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const timeStr = now.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <header className="flex h-[var(--header-height)] items-center justify-between border-b border-border bg-card px-6">
      {/* Date / Time */}
      <div className="hidden items-center gap-2 md:flex">
        <span className="text-sm text-muted-foreground capitalize first-letter:uppercase">
          {dateStr}
        </span>
        <span className="text-lg font-bold tabular-nums tracking-tight">
          {timeStr}
        </span>
      </div>

      {/* Centered Search */}
      <div className="flex flex-1 justify-center px-8">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar embarques, motoristas, clientes..."
            className={cn(
              "h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm transition-all duration-200",
              "placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:shadow-glow"
            )}
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <NotificationsPopover />

        {/* User Profile */}
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 transition-colors hover:bg-accent">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
            <User className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="hidden text-right md:block">
            <p className="text-xs font-medium leading-tight">
              {profile?.nome ?? "Usuário"}
            </p>
            <p className="text-[10px] leading-tight text-muted-foreground">
              {profile?.email ?? ""}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
