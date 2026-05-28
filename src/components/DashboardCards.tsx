import { Truck, Bell, Pause, UserX, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

function Sparkline({ color, data }: { color: string; data: number[] }) {
  const w = 80;
  const h = 28;
  const max = Math.max(...data, 1);
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-7 w-20" preserveAspectRatio="none">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const CARD_CONFIG = [
  { key: "confirmado", label: "Confirmados", icon: Truck, border: "border-emerald-500/20", trend: [12, 19, 15, 22, 18, 25, 30], stroke: "#10b981" },
  { key: "motorista_avisado", label: "Motorista avisado", icon: Bell, border: "border-blue-500/20", trend: [8, 10, 7, 14, 11, 9, 15], stroke: "#3b82f6" },
  { key: "standby", label: "Não confirmada", icon: Pause, border: "border-orange-500/20", trend: [5, 3, 6, 4, 7, 5, 4], stroke: "#f97316" },
  { key: "sem_motorista", label: "Sem motorista", icon: UserX, border: "border-purple-500/20", trend: [3, 5, 2, 4, 6, 3, 2], stroke: "#a855f7" },
  { key: "concluido", label: "Finalizadas", icon: CheckCircle2, border: "border-emerald-500/20", trend: [20, 25, 22, 28, 24, 30, 35], stroke: "#10b981" },
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
}

export function DashboardCards({ counts = {}, total = 0 }: DashboardCardsProps) {
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
        const trendUp = card.trend[card.trend.length - 1] > card.trend[0];
        const trendPct = (
          ((card.trend[card.trend.length - 1] - card.trend[0]) / (card.trend[0] || 1)) * 100
        ).toFixed(0);

        return (
          <motion.div
            key={card.key}
            variants={cardVariants}
            whileHover={{ y: -4, scale: 1.01, transition: { duration: 0.2 } }}
            className={cn(
              "group relative overflow-hidden rounded-xl border bg-card p-5 transition-all duration-300 hover:shadow-glow",
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
                <Sparkline color={card.stroke} data={card.trend} />
              </div>
              <div className="mt-3">
                <motion.p key={count} initial={{ scale: 1.2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-2xl font-bold tracking-tight">
                  {count}
                </motion.p>
                <p className="mt-0.5 text-sm text-muted-foreground">{card.label}</p>
              </div>
              <div className="mt-3 flex items-center gap-1.5">
                <span className={cn("inline-block h-1.5 w-1.5 rounded-full", trendUp ? "bg-emerald-500" : "bg-red-500")} />
                <span className="text-xs text-muted-foreground">
                  {trendUp ? "+" : ""}{trendPct}%
                </span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
