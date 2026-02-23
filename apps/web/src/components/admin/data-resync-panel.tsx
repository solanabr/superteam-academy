"use client";

import { useState } from "react";

interface ResyncResult {
  synced: boolean;
  wallet: string;
  xp: number;
  enrollments: number;
  lessonsCompleted: number;
  coursesCompleted: number;
  achievements: number;
  certificates: number;
}

interface DataResyncPanelProps {
  adminToken: string;
}

export function DataResyncPanel({ adminToken }: DataResyncPanelProps) {
  const [walletAddress, setWalletAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleResync() {
    const trimmed = walletAddress.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/admin/resync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ walletAddress: trimmed }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(
          (body as { error?: string }).error ?? `Request failed (${res.status})`
        );
        return;
      }

      setResult((await res.json()) as ResyncResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-3">
        Rebuild a user&apos;s Supabase data from on-chain state: XP balance
        (Token-2022 ATA), enrollments &amp; lesson progress (Enrollment PDAs +
        bitmap), achievements &amp; certificates (Helius DAS API). Use after
        webhook failures or for migration.
      </p>

      <div className="flex gap-2">
        <input
          type="text"
          value={walletAddress}
          onChange={(e) => setWalletAddress(e.target.value)}
          placeholder="Wallet address (base58)"
          className="flex-1 rounded-md border border-border bg-subtle px-3 py-2 text-sm text-text placeholder:text-text-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <button
          onClick={() => void handleResync()}
          disabled={loading || !walletAddress.trim()}
          className="rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-text shadow-push-sm transition-all hover:bg-subtle active:translate-y-[2px] active:shadow-push-active disabled:pointer-events-none disabled:opacity-50"
        >
          {loading ? "Syncing..." : "Resync"}
        </button>
      </div>

      {error && (
        <div className="rounded-md border border-danger bg-danger-light p-3 text-sm text-danger">
          {error}
        </div>
      )}

      {result && (
        <div className="rounded-md border border-success bg-success-light p-3 text-sm">
          <div className="mb-1 font-medium text-success">
            Resync complete for{" "}
            <span className="font-mono text-xs">
              {result.wallet.slice(0, 4)}...{result.wallet.slice(-4)}
            </span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-text-2">
            <span>
              XP:{" "}
              <span className="font-display font-bold text-text">
                {result.xp.toLocaleString()}
              </span>
            </span>
            <span>
              Enrollments:{" "}
              <span className="font-display font-bold text-text">
                {result.enrollments}
              </span>
            </span>
            <span>
              Lessons:{" "}
              <span className="font-display font-bold text-text">
                {result.lessonsCompleted}
              </span>
            </span>
            <span>
              Courses completed:{" "}
              <span className="font-display font-bold text-text">
                {result.coursesCompleted}
              </span>
            </span>
            <span>
              Achievements:{" "}
              <span className="font-display font-bold text-text">
                {result.achievements}
              </span>
            </span>
            <span>
              Certificates:{" "}
              <span className="font-display font-bold text-text">
                {result.certificates}
              </span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
