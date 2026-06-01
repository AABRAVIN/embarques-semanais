import { Truck, Bell, Pause, UserX, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const CARD_CONFIG = [
  { key: "confirmado", label: "Confirmados", icon: Truck, border: "border-emerald-500/20" },
  { key: "motorista_avisado", label: "Motorista avisado", icon: Bell, border: "border-blue-500/20" },
  { key: "standby", label: "Não confirmada", icon: Pause, border: "border-orange-500/20" },
  { key: "sem_motorista", label: "Sem motorista", icon: UserX, border: "border-purple-500/20" },
  { key: "concluido", label: "Finalizadas", icon: CheckCircle2, border: "border-emerald-500/20" },
];

const CARD_COLORS = [
  { icon: "text-emerald-500", bg: "bg-emerald-500/10" },
  { icon: "text-blue-500", bg: "bg-blue-500/10" },
  { icon: "text-orange-500", bg: "bg-orange-500/10" },
  { icon: "text-purple-500", bg: "bg-purple-500/10" },
  { icon: "text-emerald-500", bg: "bg-emerald-500/10" },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: "easeOut" as const } },
};

interface DashboardCardsProps {
  counts?: Record<string, number>;
  total?: number;
  onCardClick?: (key: string) => void;
}

export function DashboardCards({ counts = {}, total = 0, onCardClick }: DashboardCardsProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
    >
      {CARD_CONFIG.map((card, idx) => {
        const Icon = card.icon;
        const count = counts[card.key] ?? 0;
        const colors = CARD_COLORS[idx];

        return (
          <motion.div
            key={card.key}
            variants={cardVariants}
            whileHover={{ y: -4, scale: 1.01, transition: { duration: 0.2 } }}
            onClick={() => onCardClick?.(card.key)}
            className={cn(
              "group relative cursor-pointer overflow-hidden rounded-xl border bg-card p-5 transition-all duration-300 hover:shadow-glow",
              card.border
            )}
          >
            <div className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              style={{ background: `linear-gradient(135deg, hsl(var(--primary)/0.03), transparent 60%)` }}
            />
            <div className="relative">
              <div className="flex items-start justify-between">
                <div className={cn("rounded-lg p-2.5", colors.bg)}>
                  <Icon className={cn("h-5 w-5", colors.icon)} />
                </div>
              </div>
              <div className="mt-3">
                <motion.p key={count} initial={{ scale: 1.2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-2xl font-bold tracking-tight">
                  {count}
                </motion.p>
                <p className="mt-0.5 text-sm text-muted-foreground">{card.label}</p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
