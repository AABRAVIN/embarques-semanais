import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

export type ThemeId =
  | "dark-premium"
  | "light-clean"
  | "blue-corporate"
  | "logistics-red"
  | "glass-midnight";

export interface ThemeDefinition {
  id: ThemeId;
  label: string;
  description: string;
  icon: string;
}

export const THEMES: ThemeDefinition[] = [
  {
    id: "dark-premium",
    label: "Dark Premium",
    description: "Preto profundo · Vermelho · Glow",
    icon: "🌑",
  },
  {
    id: "light-clean",
    label: "Light Clean",
    description: "Claro elegante · Corporativo",
    icon: "☀️",
  },
  {
    id: "blue-corporate",
    label: "Blue Corporate",
    description: "Azul petróleo · Empresarial",
    icon: "🔵",
  },
  {
    id: "logistics-red",
    label: "Logistics Red",
    description: "Vinho escuro · Tons quentes · Cargo",
    icon: "🚛",
  },
  {
    id: "glass-midnight",
    label: "Glass Midnight",
    description: "Glassmorphism · Blur · Premium",
    icon: "💎",
  },
];

export interface ThemeContextType {
  theme: ThemeId;
  themeDef: ThemeDefinition;
  setTheme: (theme: ThemeId) => void;
}

const STORAGE_KEY = "translima-theme";

function getInitialTheme(): ThemeId {
  if (typeof window === "undefined") return "dark-premium";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (
    stored === "dark-premium" ||
    stored === "light-clean" ||
    stored === "blue-corporate" ||
    stored === "logistics-red" ||
    stored === "glass-midnight"
  ) {
    return stored;
  }
  return "dark-premium";
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(getInitialTheme);

  function setTheme(t: ThemeId) {
    setThemeState(t);
  }

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    const allThemes: ThemeId[] = [
      "dark-premium",
      "light-clean",
      "blue-corporate",
      "logistics-red",
      "glass-midnight",
    ];
    root.classList.remove(...allThemes.map((t) => `theme-${t}`));
    root.classList.add(`theme-${theme}`);
  }, [theme]);

  const themeDef = THEMES.find((t) => t.id === theme) ?? THEMES[0];

  return (
    <ThemeContext.Provider value={{ theme, themeDef, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
