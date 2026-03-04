"use client";

import { OnboardingQuiz } from "@/components/onboarding/OnboardingQuiz";

/**
 * Thin client wrapper so the onboarding page.tsx (server component) can
 * import it without bundling the quiz into the RSC payload.
 */
export function OnboardingQuizPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-start justify-center py-8">
      <OnboardingQuiz />
    </div>
  );
}
