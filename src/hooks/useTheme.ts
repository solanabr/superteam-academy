"use client";

import { create } from "zustand";
import { useEffect } from "react";

type Theme = "dark" | "light" | "system";

interface ThemeStore {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeStore>((set) => ({
  theme: "dark",
  setTheme: (theme) => set({ theme }),
}));

function getResolvedTheme(theme: Theme): "dark" | "light" {
  if (theme === "system") {
    if (typeof window === "undefined") return "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return theme;
}

export function useTheme() {
  const { theme, setTheme } = useThemeStore();
  const resolved = typeof window !== "undefined" ? getResolvedTheme(theme) : "dark";

  return { theme, setTheme, resolved };
}

/**
 * ThemeSync — mount once in layout to apply data-theme attribute to <html>
 * and sync with localStorage.
 */
export function ThemeSync() {
  const { theme } = useThemeStore();

  useEffect(() => {
    // Read from localStorage on mount
    const stored = localStorage.getItem("academy:theme") as Theme | null;
    if (stored && ["dark", "light", "system"].includes(stored)) {
      useThemeStore.getState().setTheme(stored);
    }
  }, []);

  useEffect(() => {
    const resolved = getResolvedTheme(theme);
    document.documentElement.setAttribute("data-theme", resolved);
    localStorage.setItem("academy:theme", theme);
  }, [theme]);

  // Listen for system preference changes when in "system" mode
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const resolved = mq.matches ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", resolved);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  return null;
}
