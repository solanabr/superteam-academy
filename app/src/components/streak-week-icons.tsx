"use client";

import { Flame } from "lucide-react";

const DAY_LABELS = ["D", "S", "T", "Q", "Q", "S", "S"]; // Dom a Sáb

type Props = {
  /** Para cada dia da semana (0=Dom .. 6=Sab), true se o usuário estudou/fez desafio */
  activeDays?: boolean[];
  /** Número de dias de sequência (ex.: 3) */
  streak?: number;
};

export function StreakWeekIcons({ activeDays, streak = 0 }: Props) {
  const days =
    activeDays ??
    (() => {
      const a: boolean[] = Array(7).fill(false);
      const today = new Date().getDay();
      for (let i = 0; i < streak && i <= today; i++) {
        const idx = (today - i + 7) % 7;
        a[idx] = true;
      }
      return a;
    })();

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center justify-center gap-1.5">
        {DAY_LABELS.map((label, i) => (
          <div
            key={i}
            className="flex flex-col items-center gap-0.5"
            title={days[i] ? "Ativo" : "Inativo"}
          >
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors ${
                days[i]
                  ? "border-amber-500 bg-amber-500/20 text-amber-600 dark:border-[hsl(var(--brand-logo-green))] dark:bg-[hsl(var(--brand-logo-green))]/20 dark:text-[hsl(var(--brand-logo-green))]"
                  : "border-muted bg-muted/30 text-muted-foreground"
              }`}
            >
              <Flame className="h-4 w-4" strokeWidth={2.5} />
            </div>
            <span className="text-[10px] font-medium text-muted-foreground">
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
