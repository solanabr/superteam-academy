"use client";

import type { ReactNode } from "react";

export function AdminLeaderboardSkeleton(): ReactNode {
  return (
    <div className="space-y-4">
      <div className="h-6 w-56 border border-border bg-muted" />
      <div className="grid gap-4 border border-border p-4 md:grid-cols-2">
        <div className="h-16 border border-border bg-muted" />
        <div className="h-16 border border-border bg-muted" />
      </div>
      <div className="h-9 w-40 border border-border bg-muted" />
    </div>
  );
}
