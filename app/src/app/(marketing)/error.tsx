"use client";

import { Sparkles } from "lucide-react";
import { RouteError } from "@/components/ui/route-error";

export default function MarketingError({
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
      icon={Sparkles}
      titleKey="routes.landing.title"
      descriptionKey="routes.landing.description"
      backHref="/courses"
      backLabelKey="goToCourses"
    />
  );
}
