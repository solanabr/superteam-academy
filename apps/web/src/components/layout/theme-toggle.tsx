"use client";

import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { Sun, Moon } from "@phosphor-icons/react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const tA11y = useTranslations("a11y");

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-md border-[2.5px] border-border bg-card text-text-2 transition-colors hover:bg-subtle hover:text-text"
      aria-label={tA11y("toggleTheme")}
    >
      {isDark ? (
        <Sun size={16} weight="bold" />
      ) : (
        <Moon size={16} weight="bold" />
      )}
    </button>
  );
}
