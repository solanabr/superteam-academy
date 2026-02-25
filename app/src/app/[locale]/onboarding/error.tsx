"use client";

import { useEffect } from "react";
import { PageError } from "@/components/ui/page-error";

export default function OnboardingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Onboarding error:", error);
  }, [error]);

  return <PageError section="onboarding" reset={reset} />;
}
