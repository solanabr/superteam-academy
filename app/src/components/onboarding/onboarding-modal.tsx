"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence } from "framer-motion";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useAuth } from "@/components/providers/auth-provider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { WelcomeStep } from "./welcome-step";
import { ProfileStep } from "./profile-step";
import { WalletStep } from "./wallet-step";
import { ExploreStep } from "./explore-step";

const TOTAL_STEPS = 4;

interface OnboardingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OnboardingModal({ open, onOpenChange }: OnboardingModalProps) {
  const t = useTranslations("onboarding");
  const { refreshProfile } = useAuth();
  const [step, setStep] = useState(0);
  const { visible: walletModalVisible } = useWalletModal();
  // Lifted from WalletStep so it survives Dialog unmount when wallet modal opens
  const [walletPendingLink, setWalletPendingLink] = useState(false);

  // Hide onboarding dialog while wallet adapter modal is open
  // so Radix focus trap doesn't block wallet selection
  const dialogOpen = open && !walletModalVisible;

  const completeOnboarding = useCallback(async () => {
    // Close dialog immediately for responsiveness
    onOpenChange(false);
    // Then persist in background
    try {
      await fetch("/api/onboarding/complete", { method: "POST" });
      await refreshProfile();
    } catch {
      // Non-blocking
    }
  }, [onOpenChange, refreshProfile]);

  const next = useCallback(() => {
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  }, []);

  const back = useCallback(() => {
    setStep((s) => Math.max(s - 1, 0));
  }, []);

  const handleSkip = useCallback(() => {
    completeOnboarding();
  }, [completeOnboarding]);

  return (
    <Dialog open={dialogOpen} onOpenChange={(v) => { if (!v && !walletModalVisible) handleSkip(); }}>
      <DialogContent
        className="sm:max-w-[400px] p-6 gap-0 overflow-y-auto max-h-[90vh]"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">{t("welcome")}</DialogTitle>
        <DialogDescription className="sr-only">
          {t("welcome")}
        </DialogDescription>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1.5 mb-6">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step
                  ? "w-6 bg-primary"
                  : i < step
                    ? "w-1.5 bg-primary/40"
                    : "w-1.5 bg-muted-foreground/20"
              }`}
            />
          ))}
          <span className="ml-2 text-xs text-muted-foreground">
            {t("step", { current: step + 1, total: TOTAL_STEPS })}
          </span>
        </div>

        {/* Skip link */}
        {step < TOTAL_STEPS - 1 && (
          <button
            type="button"
            onClick={handleSkip}
            className="absolute top-4 right-4 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {t("skip")}
          </button>
        )}

        {/* Step content */}
        <AnimatePresence mode="wait">
          {step === 0 && <WelcomeStep key="welcome" onNext={next} />}
          {step === 1 && <ProfileStep key="profile" onNext={next} onBack={back} />}
          {step === 2 && <WalletStep key="wallet" onNext={next} onBack={back} pendingLink={walletPendingLink} setPendingLink={setWalletPendingLink} />}
          {step === 3 && <ExploreStep key="explore" onComplete={completeOnboarding} />}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
