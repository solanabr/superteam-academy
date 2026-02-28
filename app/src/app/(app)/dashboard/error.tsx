"use client";

import { RouteError } from "@/components/ui/route-error";
import { LayoutDashboard } from "lucide-react";

export default function DashboardError({
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
      icon={LayoutDashboard}
      titleKey="routes.dashboard.title"
      descriptionKey="routes.dashboard.description"
      backHref="/courses"
      backLabelKey="goToCourses"
    />
  );
}
