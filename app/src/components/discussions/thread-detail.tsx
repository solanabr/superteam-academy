"use client";

import Link from "next/link";
import { ArrowLeft, Eye, Loader2, Lock, Pin } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn, formatRelativeDate } from "@/lib/utils";
import { MarkdownContent } from "@/components/course/markdown-content";
import { VoteButtons } from "./vote-buttons";
import { CommentTree } from "./comment-tree";
import { CommentComposer } from "./comment-composer";
import type { ThreadDetail as ThreadDetailType, VoteValue } from "@/types";

const CATEGORY_STYLES: Record<string, string> = {
  Help: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  "Show & Tell": "bg-blue-500/15 text-blue-400 border-blue-500/30",
  Ideas: "bg-green-500/15 text-green-400 border-green-500/30",
  General: "bg-purple-500/15 text-purple-400 border-purple-500/30",
};

interface ThreadDetailProps {
  thread: ThreadDetailType;
  isLoading: boolean;
  currentUserId?: string | null;
  onVoteThread: (value: VoteValue) => void;
  onVoteComment: (commentId: string, value: 1 | -1) => void;
  onAddComment: (body: string, parentId?: string) => void;
  onEditComment: (commentId: string, body: string) => void;
  onDeleteComment: (commentId: string) => void;
}

export function ThreadDetailView({
  thread,
  isLoading,
  currentUserId,
  onVoteThread,
  onVoteComment,
  onAddComment,
  onEditComment,
  onDeleteComment,
}: ThreadDetailProps) {
  const t = useTranslations("discussions");

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/discussions"
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("backToDiscussions")}
      </Link>

      {/* Thread body */}
      <div className="glass rounded-2xl p-6">
        <div className="mb-3 flex flex-wrap items-center gap-2">
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
            <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              <Pin className="h-3 w-3" /> Pinned
            </span>
          )}
          {thread.isLocked && (
            <span className="flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-400">
              <Lock className="h-3 w-3" /> Locked
            </span>
          )}
        </div>

        <h1 className="mb-4 font-heading text-2xl font-bold leading-snug">{thread.title}</h1>

        {thread.body && (
          <div className="mb-5">
            <MarkdownContent content={thread.body} />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-4 border-t border-border pt-4 text-xs text-muted-foreground">
          <span>{thread.author.displayName}</span>
          <span className="flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" />
            {thread.viewCount}
          </span>
          <span>{formatRelativeDate(thread.createdAt)}</span>

          <div className="ml-auto">
            <VoteButtons
              score={thread.voteScore}
              userVote={thread.userVote}
              onVote={(v) => onVoteThread(v)}
            />
          </div>
        </div>
      </div>

      {/* Comments */}
      <div>
        <h2 className="mb-3 font-semibold">
          {t("commentsCount", { count: thread.commentCount })}
        </h2>

        {!thread.isLocked && (
          <div className="mb-6">
            <CommentComposer
              onSubmit={(body) => onAddComment(body)}
              placeholder={t("commentPlaceholder")}
            />
          </div>
        )}

        {thread.isLocked && (
          <p className="mb-4 flex items-center gap-2 rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
            <Lock className="h-4 w-4" />
            {t("threadLocked")}
          </p>
        )}

        <CommentTree
          comments={thread.comments}
          currentUserId={currentUserId}
          onReply={(parentId, body) => onAddComment(body, parentId)}
          onEdit={onEditComment}
          onDelete={onDeleteComment}
          onVote={onVoteComment}
        />

        {thread.comments.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {t("noComments")}
          </p>
        )}
      </div>
    </div>
  );
}
