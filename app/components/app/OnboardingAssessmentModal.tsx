"use client";

import {
  AssessmentSection,
  type CourseRecommendation,
} from "@/components/landing/AssessmentSection";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  completeOnboarding,
  DEFAULT_ONBOARDING_COURSE_SLUG,
} from "@/lib/onboarding";
import { X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";
import { createPortal } from "react-dom";

interface OnboardingAssessmentModalProps {
  open: boolean;
  walletAddress: string | null;
  onOpenChange: (open: boolean) => void;
}

export function OnboardingAssessmentModal({
  open,
  walletAddress,
  onOpenChange,
}: OnboardingAssessmentModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!open) {
      setMounted(false);
      return;
    }
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  const completeForWallet = useCallback(
    (recommendedCourseSlug: string) => {
      if (!walletAddress) return;
      completeOnboarding(
        walletAddress,
        recommendedCourseSlug || DEFAULT_ONBOARDING_COURSE_SLUG
      );
    },
    [walletAddress]
  );

  const handleComplete = useCallback(
    (recommendation: CourseRecommendation) => {
      completeForWallet(recommendation.slug);
    },
    [completeForWallet]
  );

  const handleSkip = useCallback(() => {
    completeForWallet(DEFAULT_ONBOARDING_COURSE_SLUG);
    onOpenChange(false);
  }, [completeForWallet, onOpenChange]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-[70] flex items-center justify-center p-4 transition-opacity duration-200",
        mounted ? "opacity-100" : "opacity-0"
      )}
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
        aria-hidden
      />

      <div
        className={cn(
          "relative z-10 flex w-full max-w-4xl flex-col overflow-hidden rounded-2xl border-4 border-border bg-card text-card-foreground shadow-2xl transition-[transform,opacity] duration-200",
          mounted ? "scale-100 opacity-100" : "scale-95 opacity-0"
        )}
      >
        <div className="flex items-start justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="font-game text-3xl">Skill Assessment</h2>
            <p className="mt-1 font-game text-sm text-muted-foreground">
              Tell us your current level so we can recommend the right start.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[75vh] overflow-y-auto px-2 pb-4 sm:px-4">
          <AssessmentSection mode="onboarding" onComplete={handleComplete} />
        </div>

        <div className="flex justify-end border-t border-border px-4 py-3">
          <Button variant="outline" className="font-game" onClick={handleSkip}>
            Skip for now
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
