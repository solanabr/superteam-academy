"use client";

import { CheckCircle2, ExternalLink, AlertCircle, Loader2, LockOpen } from "lucide-react";
import { useCloseEnrollment } from "@/lib/hooks/use-close-enrollment";
import type { Course } from "@/types";

const STATE_LABELS: Record<string, string> = {
  building: "Building transaction…",
  signing: "Approve in wallet…",
  confirming: "Confirming on-chain…",
};

export interface CloseEnrollmentButtonProps {
  course: Course;
}

export function CloseEnrollmentButton({ course }: CloseEnrollmentButtonProps) {
  const { closeEnrollment, state, txSignature, error, reset } = useCloseEnrollment();
  const isPending = ["building", "signing", "confirming"].includes(state);

  if (state === "success" && txSignature) {
    return (
      <a
        href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 rounded-lg bg-brazil-green/10 px-3 py-2 text-xs text-brazil-green hover:bg-brazil-green/20"
      >
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">Rent reclaimed</span>
        <ExternalLink className="ml-auto h-3 w-3 shrink-0" />
      </a>
    );
  }

  if (state === "error") {
    return (
      <div className="space-y-2">
        <div className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{error ?? "Transaction failed"}</span>
        </div>
        <button
          onClick={reset}
          className="w-full rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => closeEnrollment(course.slug)}
      disabled={isPending}
      className="flex w-full items-center justify-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-70"
    >
      {isPending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {STATE_LABELS[state] ?? "Processing…"}
        </>
      ) : (
        <>
          <LockOpen className="h-4 w-4" />
          Close enrollment & reclaim rent
        </>
      )}
    </button>
  );
}
