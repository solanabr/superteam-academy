"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { MessageSquare, CheckCircle2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { VoteButton } from "./vote-button";
import { getCategoryColor } from "./category-filter";
import { cn } from "@/lib/utils";
import type { Thread } from "@/lib/supabase/types";

function shortWallet(wallet: string): string {
  if (wallet.length <= 10) return wallet;
  return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const seconds = Math.floor((now - then) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

interface ThreadCardProps {
  thread: Thread;
  wallet: string | null;
}

export function ThreadCard({ thread, wallet }: ThreadCardProps) {
  const params = useParams();
  const locale = (params.locale as string) || "en";
  const bodyPreview =
    thread.body.length > 160 ? thread.body.slice(0, 160) + "..." : thread.body;

  return (
    <div className="group flex gap-3 rounded-[2px] border border-[var(--c-border-subtle)] bg-[var(--c-bg-card)] p-4 transition-all duration-150 hover:border-[var(--c-border-prominent)] hover:bg-[var(--c-bg-elevated)]/50">
      <VoteButton
        count={thread.upvotes}
        threadId={thread.id}
        wallet={wallet}
        className="shrink-0"
      />

      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex flex-wrap items-center gap-2">
          <Badge
            className={cn(
              "border text-[10px]",
              getCategoryColor(thread.category),
            )}
          >
            {thread.category}
          </Badge>
          {thread.is_answered && (
            <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-[#55E9AB]">
              <CheckCircle2 className="h-3 w-3" />
              Answered
            </span>
          )}
        </div>

        <Link
          href={`/${locale}/community/${thread.id}`}
          className="block text-sm font-medium text-[var(--c-text)] transition-colors group-hover:text-[#55E9AB]"
        >
          {thread.title}
        </Link>

        <p className="mt-1 text-xs text-[var(--c-text-2)] line-clamp-2">
          {bodyPreview}
        </p>

        <div className="mt-2.5 flex items-center gap-3 text-[var(--c-text-muted)]">
          <span className="font-mono text-[10px]">
            {shortWallet(thread.author_wallet)}
          </span>
          <span className="flex items-center gap-1 text-[10px]">
            <Clock className="h-3 w-3" />
            {timeAgo(thread.created_at)}
          </span>
          <span className="flex items-center gap-1 text-[10px]">
            <MessageSquare className="h-3 w-3" />
            {thread.reply_count}
          </span>
        </div>
      </div>
    </div>
  );
}
