"use client";

import { ThemeProvider as NextThemeProvider } from "next-themes";
import { useUserStore } from "@/lib/store/user-store";
import { useEffect } from "react";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useUserStore((state) => state.theme);

  useEffect(() => {
    // keep store in sync when system mode is selected and changed by browser
  }, [theme]);

  return (
    <NextThemeProvider attribute="class" defaultTheme="dark" forcedTheme={undefined}>
      {children}
    </NextThemeProvider>
  );
}
