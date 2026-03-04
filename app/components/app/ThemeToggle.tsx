"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ThemeToggle({
  showLabel,
  className,
}: { showLabel?: boolean; className?: string } = {}) {
  const { setTheme, resolvedTheme } = useTheme();

  const toggle = () => {
    const next = resolvedTheme === "dark" ? "light" : "dark";
    setTheme(next);
  };

  const isLight = resolvedTheme === "light";
  const label = isLight ? "Light" : "Dark";

  if (showLabel) {
    const modeLabel = isLight ? "Light mode" : "Dark mode";
    return (
      <Button
        variant="ghost"
        onClick={toggle}
        aria-label={`${modeLabel}. Switch to ${isLight ? "dark" : "light"} mode.`}
        className={cn(
          "w-full justify-start gap-3 py-2 px-3 rounded-lg font-game text-xl hover:bg-accent hover:text-yellow-400",
          className
        )}
      >
        {isLight ? (
          <Sun className="size-5 shrink-0" aria-hidden />
        ) : (
          <Moon className="size-5 shrink-0" aria-hidden />
        )}
        <span>Switch to {isLight ? "dark" : "light"} mode</span>
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={toggle}
      aria-label={`Theme: ${resolvedTheme ?? "dark"}. Click to toggle.`}
      className={className}
    >
      {isLight ? (
        <Sun className="size-4" />
      ) : (
        <Moon className="size-4" />
      )}
    </Button>
  );
}
