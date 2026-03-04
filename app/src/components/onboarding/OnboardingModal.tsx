"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { GraduationCap, Zap, Award, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "onboarding-completed";

interface Step {
  icon: React.ElementType;
  titleKey: string;
  descriptionKey: string;
  gradient: string;
  iconColor: string;
}

const STEPS: Step[] = [
  {
    icon: GraduationCap,
    titleKey: "step1.title",
    descriptionKey: "step1.description",
    gradient: "from-primary/20 to-primary/5",
    iconColor: "text-primary",
  },
  {
    icon: Zap,
    titleKey: "step2.title",
    descriptionKey: "step2.description",
    gradient: "from-secondary/20 to-secondary/5",
    iconColor: "text-secondary",
  },
  {
    icon: Award,
    titleKey: "step3.title",
    descriptionKey: "step3.description",
    gradient: "from-accent/20 to-accent/5",
    iconColor: "text-accent",
  },
  {
    icon: Users,
    titleKey: "step4.title",
    descriptionKey: "step4.description",
    gradient: "from-primary/20 to-secondary/10",
    iconColor: "text-primary",
  },
];

export function OnboardingModal() {
  const t = useTranslations("onboarding");
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      requestAnimationFrame(() => setOpen(true));
    }
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "true");
    setOpen(false);
  }

  function handleNext() {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      dismiss();
    }
  }

  function handlePrevious() {
    setStep((s) => Math.max(0, s - 1));
  }

  const current = STEPS[step] ?? STEPS[0]!;
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) dismiss(); }}>
      <DialogContent
        className="max-w-md overflow-hidden p-0"
        closeLabel={t("skip")}
      >
        {/* Gradient header */}
        <div className={cn("flex flex-col items-center px-6 pb-6 pt-10 bg-gradient-to-b", current.gradient)}>
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-background/80 backdrop-blur-sm shadow-lg">
            <Icon className={cn("h-10 w-10", current.iconColor)} aria-hidden="true" />
          </div>
          <DialogTitle className="text-center text-xl font-bold">
            {t(current.titleKey)}
          </DialogTitle>
          <DialogDescription className="mt-2 text-center text-sm leading-relaxed text-muted-foreground">
            {t(current.descriptionKey)}
          </DialogDescription>
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-4 px-6 py-5">
          {/* Step dots */}
          <div className="flex items-center justify-center gap-2" role="tablist" aria-label={t("stepIndicator")}>
            {STEPS.map((_, i) => (
              <button
                key={i}
                role="tab"
                aria-selected={i === step}
                aria-label={t("stepN", { n: i + 1 })}
                onClick={() => setStep(i)}
                className={cn(
                  "rounded-full transition-all duration-200",
                  i === step
                    ? "w-6 h-2 bg-primary"
                    : "w-2 h-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                )}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={dismiss}
            >
              {t("skip")}
            </Button>

            <div className="flex items-center gap-2">
              {step > 0 && (
                <Button variant="outline" size="sm" onClick={handlePrevious}>
                  {t("previous")}
                </Button>
              )}
              <Button size="sm" onClick={handleNext}>
                {isLast ? t("getStarted") : t("next")}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
