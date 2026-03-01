"use client";

import { Button } from "@/components/ui/button";
import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-xl rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
      <h2 className="text-xl font-semibold text-destructive">Something went wrong</h2>
      <p className="mt-2 text-sm text-muted-foreground">Try reloading this view.</p>
      <Button className="mt-4" onClick={reset}>
        Retry
      </Button>
    </div>
  );
}
