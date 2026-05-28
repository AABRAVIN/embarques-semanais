import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface PaginationProps {
  current: number;
  total: number;
  onChange?: (page: number) => void;
}

export function Pagination({ current, total, onChange }: PaginationProps) {
  if (total <= 1) return null;

  const pages: (number | "...")[] = [];
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= current - 1 && i <= current + 1)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs text-muted-foreground">
        Página {current} de {total}
      </span>
      <div className="flex items-center gap-1">
        <motion.button
          whileTap={{ scale: 0.92 }}
          disabled={current === 1}
          onClick={() => onChange?.(current - 1)}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-card/50 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-30"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </motion.button>

        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`ellipsis-${i}`} className="flex h-7 w-7 items-center justify-center text-xs text-muted-foreground">
              ...
            </span>
          ) : (
            <motion.button
              key={p}
              whileTap={{ scale: 0.92 }}
              onClick={() => onChange?.(p)}
              className={cn(
                "flex h-7 min-w-[28px] items-center justify-center rounded-md px-1.5 text-xs font-medium transition-all",
                p === current
                  ? "bg-primary text-primary-foreground shadow-glow"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              {p}
            </motion.button>
          )
        )}

        <motion.button
          whileTap={{ scale: 0.92 }}
          disabled={current === total}
          onClick={() => onChange?.(current + 1)}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-card/50 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-30"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </motion.button>
      </div>
    </div>
  );
}
