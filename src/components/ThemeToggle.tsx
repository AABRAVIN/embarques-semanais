import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Palette, Check } from "lucide-react";
import { useTheme, THEMES } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const PREVIEW_MAP: Record<string, string> = {
  "dark-premium": "bg-zinc-950 text-red-500 border-red-500/30",
  "light-clean": "bg-white text-zinc-900 border-zinc-300",
  "blue-corporate": "bg-blue-900 text-blue-200 border-blue-400",
  "logistics-red": "bg-red-950 text-red-400 border-red-500/40",
  "glass-midnight": "bg-blue-950 text-blue-300 border-blue-500/30",
};

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState({ top: 0, right: 0 });

  const updatePosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPos({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, updatePosition]);

  const current = THEMES.find((t) => t.id === theme) ?? THEMES[0];

  const handleOpen = () => {
    updatePosition();
    setOpen(true);
  };

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleOpen}
        className={cn(
          "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all duration-200",
          "border-border bg-card hover:bg-accent hover:shadow-glow",
          open && "bg-accent"
        )}
      >
        <Palette className="h-4 w-4" />
        <span className="hidden sm:inline">{current.label}</span>
      </button>

      {open &&
        createPortal(
          <AnimatePresence>
            {open && (
              <>
                {/* Backdrop — cobre a tela toda, fecha o menu ao clicar */}
                <motion.div
                  key="theme-backdrop"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.1 }}
                  className="fixed inset-0 z-[9998]"
                  onClick={() => setOpen(false)}
                />

                {/* Dropdown — posicionado via style inline calculado */}
                <motion.div
                  key="theme-dropdown"
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="fixed z-[9999] w-64 rounded-xl border border-border bg-card py-2 shadow-2xl shadow-glow"
                  style={{ top: pos.top, right: pos.right }}
                >
                  <div className="mb-1 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Tema visual
                  </div>
                  {THEMES.map((t) => {
                    const isActive = theme === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => {
                          setTheme(t.id);
                          setOpen(false);
                        }}
                        className={cn(
                          "flex w-full items-center gap-3 px-3 py-2.5 text-sm transition-all duration-150",
                          isActive
                            ? "bg-accent text-accent-foreground"
                            : "text-foreground hover:bg-accent"
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-7 w-7 shrink-0 items-center justify-center rounded-md border text-xs",
                            PREVIEW_MAP[t.id]
                          )}
                        >
                          {t.icon}
                        </span>
                        <div className="flex-1 text-left">
                          <p className="text-sm font-medium">{t.label}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {t.description}
                          </p>
                        </div>
                        {isActive && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{
                              type: "spring",
                              stiffness: 400,
                              damping: 20,
                            }}
                          >
                            <Check className="h-4 w-4 text-primary" />
                          </motion.div>
                        )}
                      </button>
                    );
                  })}
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}
