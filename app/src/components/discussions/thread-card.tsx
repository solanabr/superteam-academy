"use client";

import Link from "next/link";
import { MessageSquare, Eye } from "lucide-react";
import { cn, formatRelativeDate } from "@/lib/utils";
import { VoteButtons } from "./vote-buttons";
import type { ThreadListItem, ThreadCategory } from "@/types";

const CATEGORY_STYLES: Record<string, string> = {
  Help: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  "Show & Tell": "bg-blue-500/15 text-blue-400 border-blue-500/30",
  Ideas: "bg-green-500/15 text-green-400 border-green-500/30",
  General: "bg-purple-500/15 text-purple-400 border-purple-500/30",
};

interface ThreadCardProps {
  thread: ThreadListItem;
  onVote: (threadId: string, value: 1 | -1) => void;
}

export function ThreadCard({ thread, onVote }: ThreadCardProps) {
  return (
    <div className="glass rounded-xl p-4 flex gap-4">
      <VoteButtons
        score={thread.voteScore}
        userVote={thread.userVote}
        onVote={(v) => onVote(thread.id, v)}
      />

      <div className="flex-1 min-w-0">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {thread.category && (
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 text-xs font-medium",
                CATEGORY_STYLES[thread.category] ?? CATEGORY_STYLES.General,
              )}
            >
              {thread.category}
            </span>
          )}
          {thread.tags.map((tag) => (
            <span key={tag} className="text-xs text-muted-foreground">#{tag}</span>
          ))}
          {thread.isPinned && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              Pinned
            </span>
          )}
        </div>

        <Link
          href={`/discussions/${thread.id}`}
          className="mb-1 block font-semibold leading-snug text-foreground hover:text-primary transition-colors line-clamp-2"
        >
          {thread.title}
        </Link>

        <p className="mb-3 text-sm text-muted-foreground line-clamp-2">
          {thread.preview}
        </p>

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span>{thread.author.displayName}</span>
          <Link
            href={`/discussions/${thread.id}`}
            className="flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            {thread.commentCount}
          </Link>
          <span className="flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" />
            {thread.viewCount}
          </span>
          <span className="ml-auto">{formatRelativeDate(thread.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}
