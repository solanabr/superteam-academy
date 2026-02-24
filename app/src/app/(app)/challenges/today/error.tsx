"use client";

import { RouteError } from "@/components/ui/route-error";
import { Zap } from "lucide-react";

export default function ChallengeTodayError({
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
      icon={Zap}
      titleKey="routes.challenges.title"
      descriptionKey="routes.challenges.description"
      backHref="/challenges"
      backLabelKey="challenges.backToChallenges"
    />
  );
}
