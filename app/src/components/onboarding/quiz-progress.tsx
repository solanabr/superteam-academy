"use client";

import { cn } from "@/lib/utils";

interface QuizProgressProps {
  currentStep: number;
  totalSteps: number;
  labels: string[];
}

export function QuizProgress({ currentStep, totalSteps, labels }: QuizProgressProps) {
  const percentage = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="w-full">
      {/* Step indicators */}
      <div className="mb-3 flex items-center justify-between">
        {labels.map((label, i) => (
          <div
            key={label}
            className={cn(
              "flex items-center gap-1.5 text-xs font-medium transition-colors",
              i <= currentStep ? "text-primary" : "text-muted-foreground/50"
            )}
          >
            <div
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-all",
                i < currentStep
                  ? "bg-primary text-primary-foreground"
                  : i === currentStep
                    ? "bg-primary/20 text-primary ring-2 ring-primary/40"
                    : "bg-muted text-muted-foreground"
              )}
            >
              {i < currentStep ? "✓" : i + 1}
            </div>
            <span className="hidden sm:inline">{label}</span>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
