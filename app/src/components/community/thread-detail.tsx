"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { Clock, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VoteButton } from "./vote-button";
import { getCategoryColor } from "./category-filter";
import { cn } from "@/lib/utils";
import type { Thread } from "@/lib/supabase/types";

function shortWallet(wallet: string): string {
  if (wallet.length <= 10) return wallet;
  return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface ThreadDetailProps {
  thread: Thread;
  wallet: string | null;
  isAdmin: boolean;
  onDelete?: () => void;
}

export function ThreadDetail({ thread, wallet, isAdmin, onDelete }: ThreadDetailProps) {
  return (
    <div className="rounded-[2px] border border-[var(--c-border-subtle)] bg-[var(--c-bg-card)]">
      <div className="flex gap-4 p-6">
        <VoteButton
          count={thread.upvotes}
          threadId={thread.id}
          wallet={wallet}
          className="shrink-0"
        />

        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge
              className={cn(
                "border text-[10px]",
                getCategoryColor(thread.category),
              )}
            >
              {thread.category}
            </Badge>
            {thread.is_answered && (
              <Badge className="border border-[#55E9AB]/20 bg-[#55E9AB]/10 text-[#55E9AB] text-[10px]">
                Answered
              </Badge>
            )}
          </div>

          <h1 className="text-xl font-semibold text-[var(--c-text)] mb-2">
            {thread.title}
          </h1>

          <div className="mb-4 flex items-center gap-3 text-[var(--c-text-muted)]">
            <span className="font-mono text-[10px] tracking-wider">
              {shortWallet(thread.author_wallet)}
            </span>
            <span className="flex items-center gap-1 text-[10px]">
              <Clock className="h-3 w-3" />
              {formatDate(thread.created_at)}
            </span>
          </div>

          <div className="prose-academy text-sm text-[var(--c-text-body)] leading-relaxed">
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
              {thread.body}
            </ReactMarkdown>
          </div>

          {isAdmin && onDelete && (
            <div className="mt-6 pt-4 border-t border-[var(--c-border-subtle)]">
              <Button variant="destructive" size="sm" onClick={onDelete} className="gap-1.5">
                <Trash2 className="h-3.5 w-3.5" />
                Remove Thread
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
