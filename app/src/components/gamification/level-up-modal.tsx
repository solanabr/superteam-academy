"use client";

import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LevelBadge } from "./level-badge";

interface LevelUpModalProps {
  open: boolean;
  onClose: () => void;
  newLevel: number;
}

export function LevelUpModal({ open, onClose, newLevel }: LevelUpModalProps) {
  const t = useTranslations("gamification");

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md text-center">
        <DialogHeader>
          <DialogTitle className="text-2xl">{t("levelUp")}</DialogTitle>
          <DialogDescription>{t("levelUpDescription")}</DialogDescription>
        </DialogHeader>

        <div className="py-8 flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-superteam-purple/30 rounded-full blur-xl animate-pulse" />
            <LevelBadge level={newLevel} size="lg" />
          </div>
          <p className="text-lg font-bold">
            {t("reachedLevel")} {newLevel}
          </p>
        </div>

        <Button onClick={onClose} className="w-full">
          {t("continue")}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
