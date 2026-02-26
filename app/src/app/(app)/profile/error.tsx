"use client";

import { RouteError } from "@/components/ui/route-error";
import { User } from "lucide-react";

export default function ProfileError({
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
      titleKey="routes.profile.title"
      descriptionKey="routes.profile.description"
      backHref="/dashboard"
      backLabelKey="goToDashboard"
    />
  );
}
