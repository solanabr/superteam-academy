"use client";

import { cn } from "@/lib/utils";

const CATEGORIES = [
  { key: "all", label: "All" },
  { key: "general", label: "General" },
  { key: "help", label: "Help" },
  { key: "showcase", label: "Showcase" },
  { key: "feedback", label: "Feedback" },
] as const;

interface CategoryFilterProps {
  value: string;
  onChange: (category: string) => void;
  className?: string;
}

export function CategoryFilter({ value, onChange, className }: CategoryFilterProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1 overflow-x-auto rounded-[2px] border border-[var(--c-border-subtle)] bg-[var(--c-bg-card)] p-1",
        className,
      )}
    >
      {CATEGORIES.map((cat) => (
        <button
          key={cat.key}
          onClick={() => onChange(cat.key)}
          className={cn(
            "whitespace-nowrap rounded-[1px] px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-all duration-150",
            value === cat.key
              ? "bg-[#55E9AB]/10 text-[#55E9AB] border-b border-[#55E9AB]"
              : "text-[var(--c-text-2)] hover:text-[var(--c-text)]",
          )}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}

export function getCategoryColor(category: string): string {
  switch (category) {
    case "help":
      return "text-[#FFC526] bg-[#FFC526]/10 border-[#FFC526]/20";
    case "showcase":
      return "text-[#CA9FF5] bg-[#CA9FF5]/10 border-[#CA9FF5]/20";
    case "feedback":
      return "text-[#6693F7] bg-[#6693F7]/10 border-[#6693F7]/20";
    default:
      return "text-[var(--c-text-2)] bg-[var(--c-border-subtle)] border-[var(--c-border-subtle)]";
  }
}
