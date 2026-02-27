"use client";

import { ThreadCard } from "./thread-card";
import type { Thread } from "@/lib/supabase/types";

interface ThreadListProps {
  threads: Thread[];
  wallet: string | null;
}

export function ThreadList({ threads, wallet }: ThreadListProps) {
  if (threads.length === 0) {
    return (
      <div className="rounded-[2px] border border-[var(--c-border-subtle)] bg-[var(--c-bg-card)] p-12 text-center">
        <p className="font-mono text-xs uppercase tracking-wider text-[var(--c-text-muted)]">
          No threads found
        </p>
        <p className="mt-2 text-sm text-[var(--c-text-2)]">
          Be the first to start a discussion.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {threads.map((thread) => (
        <ThreadCard key={thread.id} thread={thread} wallet={wallet} />
      ))}
    </div>
  );
}
