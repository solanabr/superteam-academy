"use client";

import { RouteError } from "@/components/ui/route-error";
import { Shield } from "lucide-react";

export default function AdminError({
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
      icon={Shield}
      titleKey="routes.admin.title"
      descriptionKey="routes.admin.description"
      backHref="/dashboard"
      backLabelKey="goToDashboard"
    />
  );
}
