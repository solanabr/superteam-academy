"use client";

import { RouteError } from "@/components/ui/route-error";
import { Trophy } from "lucide-react";

export default function LeaderboardError({
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
      icon={Trophy}
      titleKey="routes.leaderboard.title"
      descriptionKey="routes.leaderboard.description"
      backHref="/dashboard"
      backLabelKey="goToDashboard"
    />
  );
}
