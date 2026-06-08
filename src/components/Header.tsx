import { useState, useEffect } from "react";
import { Menu } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationsPopover } from "./NotificationsPopover";
import { AvatarUpload } from "./AvatarUpload";
import { useAuth } from "@/hooks/use-auth";

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
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
    <header className="flex h-[var(--header-height)] items-center justify-between border-b border-border bg-card px-4 md:px-6">
      {/* Mobile hamburger */}
      <button
        onClick={onToggleSidebar}
        className="mr-2 flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:hidden"
        aria-label="Abrir menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Date / Time */}
      <div className="hidden items-center gap-2 md:flex">
        <span className="text-sm text-muted-foreground capitalize first-letter:uppercase">
          {dateStr}
        </span>
        <span className="text-lg font-bold tabular-nums tracking-tight">
          {timeStr}
        </span>
      </div>

      {/* Spacer to keep right side pushed right */}
      <div className="flex-1" />

      {/* Right side */}
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <NotificationsPopover />

        {/* User Profile */}
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 transition-colors hover:bg-accent">
          <AvatarUpload size="sm" />
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
