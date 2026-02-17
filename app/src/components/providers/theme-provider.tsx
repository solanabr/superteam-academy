"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";

type Theme = "light" | "dark" | "brasil";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "brasil",
  setTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("brasil");
  const isFirstRender = useRef(true);

  // Sync from localStorage after hydration to avoid SSR/client mismatch
  useEffect(() => {
    const stored = localStorage.getItem("theme") as Theme | null;
    if (stored && ["light", "dark", "brasil"].includes(stored)) {
      setThemeState(stored);
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark", "brasil");
    root.classList.add(theme);
    localStorage.setItem("theme", theme);
    document.cookie = `theme=${theme};path=/;max-age=31536000;SameSite=Lax`;

    // Persist to DB (skip initial render — only on user-initiated changes)
    if (isFirstRender.current) {
      isFirstRender.current = false;
    } else {
      fetch("/api/profile/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferredTheme: theme }),
      }).catch(() => {});
    }
  }, [theme]);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
