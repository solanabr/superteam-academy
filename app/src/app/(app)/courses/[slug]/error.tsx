"use client";

import { RouteError } from "@/components/ui/route-error";
import { BookOpen } from "lucide-react";

export default function CourseDetailError({
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
      titleKey="routes.courseDetail.title"
      descriptionKey="routes.courseDetail.description"
      backHref="/courses"
      backLabelKey="goToCourses"
    />
  );
}
