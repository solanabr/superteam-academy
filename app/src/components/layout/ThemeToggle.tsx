"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const THEME_ORDER = ["light", "dark", "brasil"] as const;
type Theme = (typeof THEME_ORDER)[number];

function BrasilIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect x="1" y="4" width="14" height="8" rx="1.5" fill="#009B3A" />
      <polygon points="8,5 14,8 8,11 2,8" fill="#FEDF00" />
      <circle cx="8" cy="8" r="2" fill="#002776" />
    </svg>
  );
}

export function ThemeToggle() {
  const t = useTranslations("common");
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMounted(true); }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-9 w-9" disabled>
        <Sun className="h-4 w-4" />
      </Button>
    );
  }

  const currentTheme = (resolvedTheme as Theme) ?? "dark";

  function cycleTheme() {
    const idx = THEME_ORDER.indexOf(currentTheme);
    const next = THEME_ORDER[(idx + 1) % THEME_ORDER.length] as string;
    setTheme(next);
  }

  const ariaLabel =
    currentTheme === "dark"
      ? t("switchToLight")
      : currentTheme === "light"
        ? t("switchToBrasil")
        : t("switchToDark");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={ariaLabel}
          onClick={cycleTheme}
          onContextMenu={(e) => e.preventDefault()}
        >
          {currentTheme === "brasil" ? (
            <BrasilIcon className="h-4 w-4" />
          ) : (
            <>
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" aria-hidden="true" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" aria-hidden="true" />
            </>
          )}
          <span className="sr-only">{t("toggleTheme")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="mr-2 h-4 w-4" />
          {t("theme.light")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          {t("theme.dark")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("brasil")}>
          <BrasilIcon className="mr-2 h-4 w-4" />
          {t("theme.brasil")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
