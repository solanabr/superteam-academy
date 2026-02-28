"use client";

import { RouteError } from "@/components/ui/route-error";
import { User } from "lucide-react";

export default function PublicProfileError({
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
      icon={User}
      titleKey="routes.publicProfile.title"
      descriptionKey="routes.publicProfile.description"
      backHref="/leaderboard"
      backLabelKey="notFound.goHome"
    />
  );
}
