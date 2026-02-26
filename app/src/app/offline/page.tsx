"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useOnlineStatus, useOfflineCourses } from "@/hooks/use-offline";

export default function OfflinePage() {
  const isOnline = useOnlineStatus();
  const { courses: savedCourses, loading } = useOfflineCourses();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    import("@/lib/offline-store").then(({ getPendingCompletions }) => {
      getPendingCompletions().then((p) => setPendingCount(p.length));
    });
  }, []);

  if (isOnline) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="text-6xl">🌐</div>
        <h1 className="text-2xl font-bold">You&apos;re online!</h1>
        <p className="text-muted-foreground max-w-md">
          Your connection is back. All pending progress will sync automatically.
        </p>
        {pendingCount > 0 && (
          <p className="text-sm text-amber-500">
            Syncing {pendingCount} pending completion{pendingCount > 1 ? "s" : ""}...
          </p>
        )}
        <Link
          href="/"
          className="mt-4 rounded-lg bg-primary px-6 py-2 text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
        >
          Go Home
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="text-6xl">📡</div>
      <h1 className="text-2xl font-bold">You&apos;re offline</h1>
      <p className="text-muted-foreground max-w-md">
        No internet connection. Your progress is saved locally and will sync
        when you&apos;re back online.
      </p>

      {!loading && savedCourses.length > 0 && (
        <div className="w-full max-w-sm space-y-3">
          <p className="text-sm font-medium">Saved for offline:</p>
          <div className="space-y-2">
            {savedCourses.map((c) => (
              <a
                key={c.slug}
                href={`/courses/${c.slug}`}
                className="flex items-center justify-between rounded-lg border bg-card p-3 text-left hover:bg-muted/50 transition-colors"
              >
                <span className="text-sm font-medium truncate">{c.title}</span>
                <span className="text-xs text-muted-foreground shrink-0 ml-2">
                  {new Date(c.savedAt).toLocaleDateString()}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {!loading && savedCourses.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No courses saved for offline. Save courses from the course detail page
          while online.
        </p>
      )}

      {pendingCount > 0 && (
        <p className="text-sm text-amber-500">
          {pendingCount} lesson completion{pendingCount > 1 ? "s" : ""} queued
          — will sync when online.
        </p>
      )}

      <button
        onClick={() => window.location.reload()}
        className="mt-2 rounded-lg bg-primary px-6 py-2 text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
      >
        Retry Connection
      </button>
    </div>
  );
}
