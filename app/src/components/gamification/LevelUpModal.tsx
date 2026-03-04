"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Sparkles, Star, ChevronRight } from "lucide-react";
import { getLevel } from "@/lib/utils";
import { useProgressStore } from "@/stores/progress-store";
import confetti from "canvas-confetti";

interface LevelUpModalProps {
  open: boolean;
  onClose: () => void;
  oldLevel: number;
  newLevel: number;
}

export function LevelUpModal({
  open,
  onClose,
  oldLevel,
  newLevel,
}: LevelUpModalProps) {
  const t = useTranslations("gamification");
  const tc = useTranslations("common");

  useEffect(() => {
    if (!open) return;

    // Trigger confetti
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#9945FF", "#14F195", "#FFE000"]
    });

    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [open, onClose]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="overflow-hidden border-primary/30 bg-gradient-to-br from-primary/10 via-background to-secondary/10 sm:max-w-md" closeLabel={tc("close")}>
        <DialogHeader className="items-center text-center">
          <div className="level-up-sparkles mb-4 flex justify-center gap-2">
            <Sparkles className="h-6 w-6 animate-pulse text-yellow-400" aria-hidden="true" />
            <Star className="h-8 w-8 animate-bounce text-primary" aria-hidden="true" />
            <Sparkles className="h-6 w-6 animate-pulse text-yellow-400" aria-hidden="true" />
          </div>
          <DialogTitle className="text-2xl font-bold">{t("levelUp.title")}</DialogTitle>
          <DialogDescription className="sr-only">
            {t("levelUp.description", { oldLevel, newLevel })}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-center gap-4 py-6">
          <div className="level-up-old flex h-20 w-20 flex-col items-center justify-center rounded-2xl border border-muted bg-muted/50">
            <span className="text-xs text-muted-foreground">{t("levelUp.level")}</span>
            <span className="text-3xl font-bold text-muted-foreground">
              {oldLevel}
            </span>
          </div>

          <ChevronRight className="h-8 w-8 text-primary animate-pulse" aria-hidden="true" />

          <div className="level-up-new flex h-20 w-20 flex-col items-center justify-center rounded-2xl border border-primary/50 bg-primary/10 shadow-[0_0_30px_hsl(262_83%_58%/0.3)]">
            <span className="text-xs text-primary">{t("levelUp.level")}</span>
            <span className="text-3xl font-bold text-primary">{newLevel}</span>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          {t("levelUp.keepGoing", { nextLevel: newLevel + 1 })}
        </p>
      </DialogContent>
    </Dialog>
  );
}

export function useLevelUp() {
  const xp = useProgressStore((s) => s.xp);
  const prevXpRef = useRef(xp);
  const [levelUp, setLevelUp] = useState<{
    oldLevel: number;
    newLevel: number;
  } | null>(null);

  const close = useCallback(() => setLevelUp(null), []);

  useEffect(() => {
    const prevXp = prevXpRef.current;
    prevXpRef.current = xp;

    if (prevXp === xp) return;

    const oldLevel = getLevel(prevXp);
    const newLevel = getLevel(xp);

    if (newLevel > oldLevel) {
      setLevelUp({ oldLevel, newLevel });
    }
  }, [xp]);

  return {
    levelUpOpen: levelUp !== null,
    oldLevel: levelUp?.oldLevel ?? 0,
    newLevel: levelUp?.newLevel ?? 0,
    closeLevelUp: close,
  };
}
