"use client";

import { SOLANA_NETWORK } from "@/lib/constants";

interface TransactionErrorProps {
  error: string;
  signature?: string;
  onRetry?: () => void;
}

function explorerTxUrl(signature: string): string {
  const base = "https://explorer.solana.com/tx";
  const cluster =
    SOLANA_NETWORK === "devnet" ? "?cluster=devnet" : "";
  return `${base}/${signature}${cluster}`;
}

export function TransactionError({
  error,
  signature,
  onRetry,
}: TransactionErrorProps) {
  return (
    <div
      style={{
        border: "1px solid var(--overlay-border)",
        borderRadius: "4px",
        padding: "16px",
        backgroundColor: "var(--c-bg-card)",
        fontFamily: "'Space Grotesk', sans-serif",
      }}
    >
      <p
        style={{
          fontSize: "10px",
          textTransform: "uppercase",
          letterSpacing: "2px",
          color: "var(--destructive)",
          marginBottom: "8px",
          fontWeight: 500,
        }}
      >
        Transaction Failed
      </p>

      <p
        style={{
          color: "var(--c-text)",
          fontSize: "14px",
          lineHeight: 1.5,
          marginBottom: signature || onRetry ? "12px" : 0,
          wordBreak: "break-word",
        }}
      >
        {error}
      </p>

      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {signature && (
          <a
            href={explorerTxUrl(signature)}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: "12px",
              color: "var(--nd-highlight-blue, #6693F7)",
              textDecoration: "underline",
              textUnderlineOffset: "3px",
            }}
          >
            View on Explorer
          </a>
        )}

        {onRetry && (
          <button
            onClick={onRetry}
            style={{
              fontSize: "10px",
              textTransform: "uppercase",
              letterSpacing: "2px",
              fontWeight: 500,
              color: "var(--c-bg)",
              backgroundColor: "var(--nd-highlight-green, #55E9AB)",
              border: "none",
              borderRadius: "2px",
              padding: "6px 14px",
              cursor: "pointer",
              fontFamily: "'Space Grotesk', sans-serif",
              transition: "opacity 150ms",
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.opacity = "0.85";
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.opacity = "1";
            }}
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
