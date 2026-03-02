"use client";

import { ExternalLink } from "lucide-react";
import { toast } from "sonner";

const EXPLORER_BASE = "https://explorer.solana.com";
const CLUSTER = "devnet";

export function showTransactionToast(
  signature: string,
  message: string = "Transaction confirmed"
) {
  const url = `${EXPLORER_BASE}/tx/${signature}?cluster=${CLUSTER}`;

  toast.success(message, {
    description: (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
      >
        View on Explorer
        <ExternalLink className="h-3 w-3" />
      </a>
    ),
    duration: 8000,
  });
}

export function showTransactionError(error: unknown, fallbackMessage?: string) {
  const message =
    error instanceof Error ? error.message : fallbackMessage || "Transaction failed";
  toast.error(message);
}
