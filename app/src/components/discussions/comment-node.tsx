"use client";

import { useState } from "react";
import { Reply, Trash2, Pencil, ChevronDown, ChevronUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { formatRelativeDate } from "@/lib/utils";
import { VoteButtons } from "./vote-buttons";
import { CommentComposer } from "./comment-composer";
import type { CommentNode as CommentNodeType, VoteValue } from "@/types";

interface CommentNodeProps {
  comment: CommentNodeType;
  children?: React.ReactNode;
  childCount: number;
  currentUserId?: string | null;
  onReply: (parentId: string, body: string) => void;
  onEdit: (commentId: string, body: string) => void;
  onDelete: (commentId: string) => void;
  onVote: (commentId: string, value: 1 | -1) => void;
}

export function CommentNodeComponent({
  comment,
  children,
  childCount,
  currentUserId,
  onReply,
  onEdit,
  onDelete,
  onVote,
}: CommentNodeProps) {
  const t = useTranslations("discussions");
  const [showReply, setShowReply] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState(comment.body);
  const [collapsed, setCollapsed] = useState(false);

  const isOwner = currentUserId === comment.author.id;
  const initials = comment.author.displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  function handleReply(body: string) {
    onReply(comment.id, body);
    setShowReply(false);
  }

  function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = editBody.trim();
    if (trimmed.length < 3) return;
    onEdit(comment.id, trimmed);
    setEditing(false);
  }

  const indent = comment.depth > 0 && comment.depth <= 5;

  return (
    <div className={cn(indent && "ml-6 border-l border-border/50 pl-4")}>
      <div className="group py-3">
        <div className="flex items-start gap-3">
          {!comment.isDeleted && (
            <VoteButtons
              score={comment.voteScore}
              userVote={comment.userVote}
              onVote={(v) => onVote(comment.id, v)}
              compact
            />
          )}
          <div
            className={cn(
              "flex shrink-0 items-center justify-center rounded-full font-bold text-white",
              comment.isDeleted
                ? "h-7 w-7 bg-muted-foreground/30 text-xs"
                : "h-7 w-7 bg-gradient-to-br from-muted-foreground/60 to-muted-foreground/40 text-xs",
            )}
          >
            {comment.isDeleted ? "?" : initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">
                {comment.isDeleted ? "[deleted]" : comment.author.displayName}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatRelativeDate(comment.createdAt)}
              </span>
            </div>

            {editing ? (
              <form onSubmit={handleEdit} className="mt-2">
                <textarea
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  rows={3}
                  className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-st-green focus:outline-none focus:ring-1 focus:ring-st-green"
                />
                <div className="mt-1 flex gap-2">
                  <button
                    type="submit"
                    disabled={editBody.trim().length < 3}
                    className="rounded-lg bg-st-green px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40"
                  >
                    {t("save")}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEditing(false); setEditBody(comment.body); }}
                    className="rounded-lg px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                  >
                    {t("cancel")}
                  </button>
                </div>
              </form>
            ) : (
              <p className={cn(
                "mt-1 text-sm leading-relaxed whitespace-pre-line",
                comment.isDeleted ? "italic text-muted-foreground" : "text-muted-foreground",
              )}>
                {comment.body}
              </p>
            )}

            {!comment.isDeleted && !editing && (
              <div className="mt-1.5 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowReply(!showReply)}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Reply className="h-3 w-3" />
                  {t("reply")}
                </button>
                {isOwner && (
                  <>
                    <button
                      type="button"
                      onClick={() => setEditing(true)}
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <Pencil className="h-3 w-3" />
                      {t("edit")}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(comment.id)}
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-red-400"
                    >
                      <Trash2 className="h-3 w-3" />
                      {t("delete")}
                    </button>
                  </>
                )}
                {childCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setCollapsed(!collapsed)}
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {collapsed ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
                    {collapsed
                      ? t("showReplies", { count: childCount })
                      : t("hideReplies", { count: childCount })}
                  </button>
                )}
              </div>
            )}

            {showReply && (
              <CommentComposer
                onSubmit={handleReply}
                onCancel={() => setShowReply(false)}
                placeholder={t("replyToPlaceholder", { name: comment.author.displayName })}
                autoFocus
                compact
              />
            )}
          </div>
        </div>
      </div>

      {!collapsed && children}

      {comment.depth >= 5 && childCount > 0 && collapsed && (
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="ml-6 text-xs text-primary hover:underline"
        >
          {t("continueThread")} →
        </button>
      )}
    </div>
  );
}
