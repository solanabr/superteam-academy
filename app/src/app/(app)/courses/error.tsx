"use client";

import { RouteError } from "@/components/ui/route-error";
import { BookOpen } from "lucide-react";

export default function CoursesError({
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
      icon={BookOpen}
      titleKey="routes.courses.title"
      descriptionKey="routes.courses.description"
      backHref="/"
      backLabelKey="notFound.goHome"
    />
  );
}
