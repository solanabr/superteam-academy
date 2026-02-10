"use client";

import { SunDim, Moon } from "@phosphor-icons/react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const tA11y = useTranslations("a11y");

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border-[2.5px] border-border bg-card text-text-2 transition-colors hover:bg-subtle hover:text-text"
      aria-label={tA11y("toggleTheme")}
    >
      <SunDim
        size={18}
        weight="bold"
        className="rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
      />
      <Moon
        size={18}
        weight="bold"
        className="absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
      />
    </button>
  );
}
