"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const cycle = () => {
    const next =
      theme === "dark" ? "light" : theme === "light" ? "system" : "dark";
    setTheme(next);
  };

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={cycle}
      aria-label={`Theme: ${theme ?? "dark"}. Click to cycle.`}
    >
      {resolvedTheme === "light" ? (
        <Sun className="size-4" />
      ) : (
        <Moon className="size-4" />
      )}
    </Button>
  );
}
