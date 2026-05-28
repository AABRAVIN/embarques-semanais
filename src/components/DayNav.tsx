import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

function getMonday(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekDays(monday: Date) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatDateInput(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const DAY_ABBR = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

interface DayNavProps {
  selectedDate: Date | null;
  onDateChange: (date: Date | null) => void;
}

export function DayNav({ selectedDate, onDateChange }: DayNavProps) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const initialMonday = selectedDate ? getMonday(selectedDate) : getMonday(today);
  const [currentMonday, setCurrentMonday] = useState(initialMonday);

  const weekDays = useMemo(() => getWeekDays(currentMonday), [currentMonday]);
  const isSemanal = selectedDate === null;

  function selectDate(date: Date) {
    const monday = getMonday(date);
    if (monday.getTime() !== currentMonday.getTime()) {
      setCurrentMonday(monday);
    }
    onDateChange(date);
  }

  function goSemanal() {
    onDateChange(null);
  }

  function goHoje() {
    const monday = getMonday(today);
    setCurrentMonday(monday);
    onDateChange(today);
  }

  function prevWeek() {
    const prev = new Date(currentMonday);
    prev.setDate(prev.getDate() - 7);
    setCurrentMonday(prev);
    if (selectedDate) {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() + (selectedDate.getDay() || 7) - 1);
      onDateChange(newDate);
    }
  }

  function nextWeek() {
    const next = new Date(currentMonday);
    next.setDate(next.getDate() + 7);
    setCurrentMonday(next);
    if (selectedDate) {
      const newDate = new Date(next);
      newDate.setDate(next.getDate() + (selectedDate.getDay() || 7) - 1);
      onDateChange(newDate);
    }
  }

  function handleDatePicker(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.value) return;
    const d = new Date(e.target.value + "T00:00:00");
    if (!isNaN(d.getTime())) {
      const monday = getMonday(d);
      setCurrentMonday(monday);
      onDateChange(d);
    }
  }

  const pickerValue = selectedDate ? formatDateInput(selectedDate) : "";

  return (
    <div className="flex items-center gap-1.5">
      {/* Semanal */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={goSemanal}
        className={cn(
          "flex h-9 items-center justify-center rounded-lg px-3 text-xs font-bold uppercase tracking-wide transition-colors",
          isSemanal
            ? "bg-primary text-primary-foreground shadow-glow"
            : "border border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground"
        )}
      >
        Semanal
      </motion.button>

      {/* Anterior */}
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={prevWeek}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
      </motion.button>

      {/* Dias da semana */}
      <div className="flex items-center gap-0.5">
        {weekDays.map((date, idx) => {
          const isToday = isSameDay(date, today);
          const isActive = !isSemanal && selectedDate && isSameDay(date, selectedDate);
          const label = isToday ? "Hoje" : DAY_ABBR[idx];

          return (
            <motion.button
              key={idx}
              onClick={() => selectDate(date)}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "relative flex h-9 items-center justify-center rounded-lg px-3 text-xs font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground shadow-glow"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <span className="mr-1">{label}</span>
              <span className={cn("text-[10px]", isActive ? "text-primary-foreground/70" : "text-muted-foreground")}>
                {date.getDate()}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Próximo */}
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={nextWeek}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <ChevronRight className="h-4 w-4" />
      </motion.button>

      {/* Datepicker */}
      <div className="relative ml-1">
        <CalendarDays className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="date"
          value={pickerValue}
          onChange={handleDatePicker}
          className={cn(
            "h-9 w-[140px] rounded-lg border border-border bg-card pl-8 pr-3 text-xs font-medium text-muted-foreground",
            "transition-colors hover:bg-accent hover:text-foreground",
            "focus:outline-none focus:ring-2 focus:ring-ring",
            "[color-scheme:dark]"
          )}
        />
      </div>
    </div>
  );
}
