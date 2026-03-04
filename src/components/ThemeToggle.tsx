"use client";

import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

const MODES = [
  { value: "dark" as const, icon: Moon, label: "Dark" },
  { value: "light" as const, icon: Sun, label: "Light" },
  { value: "system" as const, icon: Monitor, label: "System" },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  // Cycle: dark → light → system → dark
  function cycle() {
    const idx = MODES.findIndex((m) => m.value === theme);
    const next = MODES[(idx + 1) % MODES.length];
    setTheme(next.value);
  }

  const current = MODES.find((m) => m.value === theme) ?? MODES[0];
  const Icon = current.icon;

  return (
    <button
      onClick={cycle}
      className="inline-flex items-center justify-center rounded-lg p-2 text-sm transition-colors duration-150 min-h-[36px] min-w-[36px]"
      style={{
        color: "var(--text-secondary)",
        background: "transparent",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--bg-elevated)";
        e.currentTarget.style.color = "var(--text-primary)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.color = "var(--text-secondary)";
      }}
      aria-label={`Theme: ${current.label}. Click to change.`}
      title={`Theme: ${current.label}`}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}
