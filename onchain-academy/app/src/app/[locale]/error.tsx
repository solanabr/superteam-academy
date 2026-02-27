"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { PageError } from "@/components/ui/page-error";

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
    console.error("App error:", error);
  }, [error]);

  return <PageError reset={reset} showGoHome />;
}
