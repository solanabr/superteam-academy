"use client";

import { useEffect } from "react";
import { PageError } from "@/components/ui/page-error";

export default function CoursesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Courses error:", error);
  }, [error]);

  return <PageError section="courses" reset={reset} />;
}
