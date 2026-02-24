"use client";

import { RouteError } from "@/components/ui/route-error";
import { Code } from "lucide-react";

export default function LessonError({
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
      icon={Code}
      titleKey="routes.lesson.title"
      descriptionKey="routes.lesson.description"
      backHref="/courses"
      backLabelKey="goToCourses"
    />
  );
}
