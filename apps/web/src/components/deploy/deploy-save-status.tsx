"use client";

import { forwardRef } from "react";
import { useTranslations } from "next-intl";
import type { SaveStatus } from "@/lib/deploy/save-deployment";
import { Button } from "@/components/ui/button";

interface DeploySaveStatusProps {
  /** "idle" = no save attempted yet (renders nothing). */
  status: SaveStatus | "idle";
  onRetry: () => void;
}

/**
 * Surfaces whether a successful on-chain deploy was RECORDED on the server —
 * the source of truth the capstone credential gate reads (#622). An unrecorded
 * deploy must never look silently "done": retryable/rejected states are alerts
 * that take focus and offer a retry.
 */
export const DeploySaveStatus = forwardRef<
  HTMLDivElement,
  DeploySaveStatusProps
>(function DeploySaveStatus({ status, onRetry }, ref) {
  const t = useTranslations("deploy.save");

  if (status === "idle") return null;

  if (status === "saving" || status === "retrying") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex items-center gap-2 text-xs text-muted-foreground"
      >
        <div
          className="h-3 w-3 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent"
          aria-hidden="true"
        />
        {status === "retrying" ? t("retrying") : t("recording")}
      </div>
    );
  }

  if (status === "saved") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex items-center gap-2 text-xs font-medium text-success"
      >
        <svg
          className="h-3.5 w-3.5 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.5 12.75l6 6 9-13.5"
          />
        </svg>
        {t("recorded")}
      </div>
    );
  }

  // retryable | rejected — un-recorded deploy. Alert + focusable retry surface.
  const isRejected = status === "rejected";
  return (
    <div
      ref={ref}
      role="alert"
      tabIndex={-1}
      className="space-y-2 rounded-md border border-yellow-500/40 bg-yellow-500/10 p-3 outline-none focus-visible:ring-2 focus-visible:ring-yellow-500"
    >
      <p className="flex items-center gap-2 text-sm font-semibold text-yellow-600 dark:text-yellow-500">
        <svg
          className="h-4 w-4 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
          />
        </svg>
        {isRejected ? t("rejectedTitle") : t("notRecordedTitle")}
      </p>
      <p className="text-xs text-muted-foreground">
        {isRejected ? t("rejectedBody") : t("notRecordedBody")}
      </p>
      <Button size="sm" variant="outline" onClick={onRetry}>
        {t("retry")}
      </Button>
    </div>
  );
});
