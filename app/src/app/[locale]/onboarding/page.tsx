"use client";

import { Suspense } from "react";
import { OnboardingFlow } from "./onboarding-flow";

export default function OnboardingPage() {
  return (
    <Suspense>
      <OnboardingFlow />
    </Suspense>
  );
}
