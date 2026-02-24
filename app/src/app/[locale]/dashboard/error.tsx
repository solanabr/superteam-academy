"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="mb-4 text-2xl font-bold text-[var(--c-text)]">
          Failed to load dashboard
        </h1>
        <p className="mb-6 text-[var(--c-text-2)]">
          Something went wrong while loading your dashboard.
        </p>
        <button
          onClick={reset}
          className="rounded-[2px] border border-[var(--solana-green)] bg-transparent px-6 py-2.5 text-sm font-medium text-[var(--solana-green)] transition-colors hover:bg-[var(--solana-green)] hover:text-black"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
