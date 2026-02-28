"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 font-mono">
      <p className="text-[#FF4444] text-sm">Something went wrong</p>
      <button onClick={reset} className="text-[#14F195] text-xs hover:underline">
        Try again
      </button>
    </div>
  );
}
