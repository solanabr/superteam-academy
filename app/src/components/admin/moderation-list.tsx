"use client";

import { useState, useEffect, useCallback } from "react";
import { Trash2, RefreshCw, Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import type { Thread } from "@/lib/supabase/types";

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + "..." : str;
}

function truncateWallet(wallet: string): string {
  if (wallet.length <= 12) return wallet;
  return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`;
}

const CATEGORY_COLORS: Record<string, string> = {
  general: "#888",
  help: "#03E1FF",
  showcase: "#00FFA3",
  feedback: "#AB9FF2",
};

export function ModerationList() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  const configured = isSupabaseConfigured();

  const fetchThreads = useCallback(async () => {
    if (!configured) return;
    setLoading(true);
    try {
      const res = await fetch("/api/community/threads?limit=20&sort=recent");
      if (res.ok) {
        const data = await res.json();
        setThreads(data.threads ?? data ?? []);
      }
    } catch {
      // ignore
    }
    setLoading(false);
  }, [configured]);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  const handleRemove = async (id: string) => {
    setRemoving(id);
    try {
      const res = await fetch(`/api/community/threads/${id}/moderate`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        setThreads((prev) => prev.filter((t) => t.id !== id));
      }
    } catch {
      // ignore
    }
    setRemoving(null);
  };

  if (!configured) {
    return (
      <div className="text-center py-8">
        <MessageSquare className="h-8 w-8 text-[var(--c-text-2)]/30 mx-auto mb-3" />
        <p className="text-sm text-[var(--c-text-2)]">
          Community features require Supabase configuration
        </p>
      </div>
    );
  }

  if (loading && threads.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-[var(--c-text-2)]" />
      </div>
    );
  }

  if (threads.length === 0) {
    return (
      <div className="text-center py-8">
        <MessageSquare className="h-8 w-8 text-[var(--c-text-2)]/30 mx-auto mb-3" />
        <p className="text-sm text-[var(--c-text-2)]">
          No community threads yet
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-[var(--c-text-2)]">
          {threads.length} thread{threads.length !== 1 ? "s" : ""}
        </p>
        <Button
          size="sm"
          variant="ghost"
          onClick={fetchThreads}
          disabled={loading}
          className="gap-1.5"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
          />
        </Button>
      </div>
      <div className="border border-[var(--c-border-subtle)] rounded-[2px] divide-y divide-[var(--c-border-subtle)]">
        {threads.map((thread) => (
          <div
            key={thread.id}
            className="flex items-center justify-between px-4 py-3 hover:bg-[var(--c-bg-elevated)]/30 transition-colors"
          >
            <div className="flex-1 min-w-0 mr-3">
              <p className="text-sm text-[var(--c-text)] truncate">
                {truncate(thread.title, 60)}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-mono text-[10px] text-[var(--c-text-2)]">
                  {truncateWallet(thread.author_wallet)}
                </span>
                <span className="text-[10px] text-[var(--c-text-dim)]">
                  {new Date(thread.created_at).toLocaleDateString()}
                </span>
                <span
                  className="text-[10px] font-mono uppercase"
                  style={{
                    color: CATEGORY_COLORS[thread.category] ?? "#888",
                  }}
                >
                  {thread.category}
                </span>
              </div>
            </div>
            <button
              onClick={() => handleRemove(thread.id)}
              disabled={removing === thread.id}
              className="p-1.5 rounded hover:bg-[#EF4444]/10 text-[var(--c-text-2)] hover:text-[#EF4444] transition-colors shrink-0 disabled:opacity-50"
              aria-label="Remove thread"
            >
              {removing === thread.id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
