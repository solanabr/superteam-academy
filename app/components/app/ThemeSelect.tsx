"use client";

import { useTheme } from "next-themes";
import { Moon, Sun, Monitor } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ThemeSelect() {
  const { theme, setTheme } = useTheme();

  const value = theme ?? "dark";
  const labels: Record<string, string> = {
    dark: "Dark",
    light: "Light",
    system: "System",
  };

  return (
    <Select value={value} onValueChange={setTheme}>
      <SelectTrigger className="w-[140px]">
        <SelectValue>{labels[value]}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="dark">
          <Moon className="size-4" /> Dark
        </SelectItem>
        <SelectItem value="light">
          <Sun className="size-4" /> Light
        </SelectItem>
        <SelectItem value="system">
          <Monitor className="size-4" /> System
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
