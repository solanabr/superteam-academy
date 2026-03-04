"use client";

import type { ReactElement } from "react";
import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/button";

const sentry_test_enabled = "true";

export function SentryTestButton(): ReactElement | null {
  if (!sentry_test_enabled) {
    return null;
  }

  return (
    <div className="mt-4">
      <Button
        type="button"
        variant="outline"
        className="w-full rounded-none border-2 border-destructive text-[10px] font-mono uppercase tracking-wide text-destructive"
        onClick={() => {
          Sentry.captureException(new Error("Sentry test error from Superteam Academy"));
        }}
      >
        Trigger Sentry Test Error
      </Button>
    </div>
  );
}

