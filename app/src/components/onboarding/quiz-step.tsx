"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export interface QuizOption {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

interface QuizStepProps {
  title: string;
  subtitle: string;
  options: QuizOption[];
  selected: string[];
  multiSelect?: boolean;
  onSelect: (id: string) => void;
}

export function QuizStep({
  title,
  subtitle,
  options,
  selected,
  multiSelect = false,
  onSelect,
}: QuizStepProps) {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 text-center">
        <h2 className="font-heading text-2xl font-bold sm:text-3xl">{title}</h2>
        <p className="mt-2 text-muted-foreground">{subtitle}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((option) => {
          const isSelected = selected.includes(option.id);
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(option.id)}
              className={cn(
                "group relative flex flex-col items-start gap-3 rounded-xl border-2 p-4 text-left transition-all duration-200",
                "hover:shadow-md hover:-translate-y-0.5",
                isSelected
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border bg-card hover:border-primary/40"
              )}
            >
              {/* Check indicator for multi-select */}
              {multiSelect && (
                <div
                  className={cn(
                    "absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-md border-2 transition-all",
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground/30"
                  )}
                >
                  {isSelected && <Check className="h-3 w-3" />}
                </div>
              )}

              {/* Radio indicator for single-select */}
              {!multiSelect && (
                <div
                  className={cn(
                    "absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all",
                    isSelected
                      ? "border-primary"
                      : "border-muted-foreground/30"
                  )}
                >
                  {isSelected && (
                    <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                  )}
                </div>
              )}

              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
                  isSelected
                    ? "bg-primary/15 text-primary"
                    : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                )}
              >
                <option.icon className="h-5 w-5" />
              </div>

              <div className="pr-6">
                <div className="font-semibold">{option.label}</div>
                <div className="mt-0.5 text-sm text-muted-foreground">
                  {option.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
