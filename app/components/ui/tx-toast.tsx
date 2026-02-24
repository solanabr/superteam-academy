"use client";

import type { TxState } from "@/hooks/use-transaction";
import { solscanTxUrl } from "@/lib/format";

const ICONS: Record<TxState, string> = {
  idle: "",
  signing: "✍️",
  confirming: "⏳",
  confirmed: "✅",
  error: "❌",
};

export function TxToastContent({
  state,
  message,
  signature,
}: {
  state: TxState;
  message: string;
  signature?: string | null;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-lg">{ICONS[state]}</span>
      <div className="flex flex-col">
        <span className="text-sm font-medium text-content">{message}</span>
        {signature && (state === "confirming" || state === "confirmed") && (
          <a
            href={solscanTxUrl(signature)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-solana-cyan hover:underline"
          >
            View on Solscan
          </a>
        )}
      </div>
    </div>
  );
}
