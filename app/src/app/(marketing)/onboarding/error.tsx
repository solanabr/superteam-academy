"use client";

import { GraduationCap } from "lucide-react";
import { RouteError } from "@/components/ui/route-error";

export default function OnboardingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteError
      error={error}
      reset={reset}
      icon={GraduationCap}
      titleKey="routes.onboarding.title"
      descriptionKey="routes.onboarding.description"
      backHref="/courses"
      backLabelKey="goToCourses"
    />
  );
}
