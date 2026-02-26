"use client";

import { RouteError } from "@/components/ui/route-error";
import { Settings } from "lucide-react";

export default function SettingsError({
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
      icon={Settings}
      titleKey="routes.settings.title"
      descriptionKey="routes.settings.description"
      backHref="/dashboard"
      backLabelKey="goToDashboard"
    />
  );
}
