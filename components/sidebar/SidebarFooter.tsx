"use client";

import { useTheme } from "@/hooks/useTheme";

type Theme = "light" | "dark" | "system";

const THEME_CYCLE: Theme[] = ["light", "dark", "system"];

const THEME_ICONS: Record<Theme, string> = {
  light: "☀️",
  dark: "🌙",
  system: "💻",
};

const THEME_LABELS: Record<Theme, string> = {
  light: "라이트",
  dark: "다크",
  system: "시스템",
};

export function SidebarFooter() {
  const { theme, setTheme } = useTheme();

  const handleCycle = () => {
    const index = THEME_CYCLE.indexOf(theme);
    setTheme(THEME_CYCLE[(index + 1) % THEME_CYCLE.length]);
  };

  return (
    <div className="shrink-0 border-t border-clay-lavender/20 px-1.5 py-2 dark:border-[var(--border)]">
      <button
        type="button"
        onClick={handleCycle}
        className="inline-flex w-full items-center gap-2 rounded-[var(--radius-md)] px-3 py-2 text-sm text-clay-body transition-colors hover:bg-clay-surface-soft/80 dark:text-[var(--text-primary)] dark:hover:bg-[var(--surface)]"
        aria-label={`테마: ${THEME_LABELS[theme]}`}
      >
        <span className="text-base leading-none" aria-hidden="true">
          {THEME_ICONS[theme]}
        </span>
        <span className="text-sm leading-tight">{THEME_LABELS[theme]}</span>
      </button>
    </div>
  );
}
