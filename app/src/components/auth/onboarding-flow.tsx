"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { ArrowRight, Code2, Coins, Shield, Palette, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const TRACKS = [
  { id: 1, label: "Core Solana", icon: Code2, desc: "Programs, accounts, transactions" },
  { id: 2, label: "DeFi", icon: Coins, desc: "AMMs, lending, yield" },
  { id: 3, label: "NFTs & Gaming", icon: Palette, desc: "Collections, marketplaces, games" },
  { id: 4, label: "Infrastructure", icon: Rocket, desc: "RPCs, indexers, tooling" },
  { id: 5, label: "Security", icon: Shield, desc: "Auditing, exploits, best practices" },
];

const LEVELS = [
  { id: "beginner", label: "Beginner", desc: "New to Solana" },
  { id: "intermediate", label: "Intermediate", desc: "Built a few dApps" },
  { id: "advanced", label: "Advanced", desc: "Deployed to mainnet" },
];

interface OnboardingFlowProps {
  open: boolean;
  onClose: () => void;
}

export function OnboardingFlow({ open, onClose }: OnboardingFlowProps) {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [selectedTrack, setSelectedTrack] = useState<number | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);

  const handleFinish = () => {
    onClose();
    if (selectedTrack) {
      router.push(`/${locale}/courses?track=${selectedTrack}`);
    } else {
      router.push(`/${locale}/courses`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {step === 0 ? t("welcomeTitle") : t("pickTrack")}
          </DialogTitle>
          <DialogDescription>
            {step === 0 ? t("skillAssessment") : t("trackRecommendation")}
          </DialogDescription>
        </DialogHeader>

        {step === 0 && (
          <div className="space-y-3 py-4">
            <p className="text-sm text-muted-foreground mb-4">
              {t("experienceLevel")}
            </p>
            {LEVELS.map((level) => (
              <button
                key={level.id}
                onClick={() => setSelectedLevel(level.id)}
                className={cn(
                  "flex items-center w-full px-4 py-3 rounded-lg border text-left transition-colors",
                  selectedLevel === level.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-accent"
                )}
              >
                <div>
                  <p className="font-medium text-sm">{level.label}</p>
                  <p className="text-xs text-muted-foreground">{level.desc}</p>
                </div>
              </button>
            ))}
            <Button
              onClick={() => setStep(1)}
              disabled={!selectedLevel}
              className="w-full mt-4"
            >
              {t("next")}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3 py-4">
            {TRACKS.map((track) => (
              <button
                key={track.id}
                onClick={() => setSelectedTrack(track.id)}
                className={cn(
                  "flex items-center gap-3 w-full px-4 py-3 rounded-lg border text-left transition-colors",
                  selectedTrack === track.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-accent"
                )}
              >
                <track.icon className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="font-medium text-sm">{track.label}</p>
                  <p className="text-xs text-muted-foreground">{track.desc}</p>
                </div>
              </button>
            ))}
            <Button
              onClick={handleFinish}
              className="w-full mt-4 bg-gradient-to-r from-superteam-purple to-superteam-green hover:opacity-90"
            >
              {t("startLearning")}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
