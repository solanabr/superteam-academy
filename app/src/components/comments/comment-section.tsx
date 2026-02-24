"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/components/providers/auth-provider";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MessageSquare,
  ThumbsUp,
  Reply,
  Trash2,
  Send,
  Loader2,
} from "lucide-react";
import type { Comment } from "@/types";

interface CommentSectionProps {
  courseId: string;
  lessonIndex: number;
  comments: Comment[];
  loading: boolean;
  onPost: (content: string, parentId?: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  onMarkHelpful: (commentId: string) => Promise<void>;
}

function timeAgo(timestamp: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(timestamp).getTime()) / 1000,
  );
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;
  const months = Math.floor(days / 30);
  return `${months}mo`;
}

function CommentItem({
  comment,
  currentUserId,
  onReply,
  onDelete,
  onMarkHelpful,
  depth = 0,
}: {
  comment: Comment;
  currentUserId: string | undefined;
  onReply: (commentId: string, authorName: string) => void;
  onDelete: (commentId: string) => Promise<void>;
  onMarkHelpful: (commentId: string) => Promise<void>;
  depth?: number;
}) {
  const t = useTranslations("comments");
  const [deleting, setDeleting] = useState(false);
  const [marking, setMarking] = useState(false);
  const isOwn = currentUserId === comment.userId;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(comment.id);
    } finally {
      setDeleting(false);
    }
  };

  const handleHelpful = async () => {
    if (isOwn || marking) return;
    setMarking(true);
    try {
      await onMarkHelpful(comment.id);
    } finally {
      setMarking(false);
    }
  };

  const initials = comment.author.displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={`flex gap-3 ${depth > 0 ? "ml-8 pt-3" : "pt-4"}`}
    >
      <Avatar size="sm">
        {comment.author.avatarUrl ? (
          <AvatarImage src={comment.author.avatarUrl} alt={comment.author.displayName} />
        ) : null}
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">
            {comment.author.displayName}
          </span>
          <span className="text-xs text-muted-foreground">
            @{comment.author.username}
          </span>
          <span className="text-xs text-muted-foreground">
            {t("ago", { time: timeAgo(comment.createdAt) })}
          </span>
          {comment.isHelpful && (
            <span className="inline-flex items-center gap-1 text-xs text-emerald-500 font-medium">
              <ThumbsUp className="h-3 w-3" />
              {t("markedHelpful")}
            </span>
          )}
        </div>

        <p className="text-sm text-foreground/90 mt-1 whitespace-pre-wrap break-words">
          {comment.content}
        </p>

        <div className="flex items-center gap-3 mt-2">
          {currentUserId && !isOwn && (
            <button
              onClick={handleHelpful}
              disabled={marking}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-emerald-500 transition-colors disabled:opacity-50"
            >
              {marking ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <ThumbsUp className="h-3 w-3" />
              )}
              {t("helpful")}
              {comment.helpfulCount > 0 && (
                <span className="text-xs">({comment.helpfulCount})</span>
              )}
            </button>
          )}

          {currentUserId && depth === 0 && (
            <button
              onClick={() =>
                onReply(comment.id, comment.author.displayName)
              }
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Reply className="h-3 w-3" />
              {t("reply")}
            </button>
          )}

          {isOwn && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
            >
              {deleting ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Trash2 className="h-3 w-3" />
              )}
              {t("delete")}
            </button>
          )}
        </div>

        {/* Replies */}
        {comment.replies.length > 0 && (
          <div className="border-l border-border/50">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                currentUserId={currentUserId}
                onReply={onReply}
                onDelete={onDelete}
                onMarkHelpful={onMarkHelpful}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function CommentSection({
  comments,
  loading,
  onPost,
  onDelete,
  onMarkHelpful,
}: CommentSectionProps) {
  const t = useTranslations("comments");
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [replyTo, setReplyTo] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [posting, setPosting] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!content.trim() || posting) return;
    setPosting(true);
    try {
      await onPost(content.trim(), replyTo?.id);
      setContent("");
      setReplyTo(null);
    } finally {
      setPosting(false);
    }
  }, [content, posting, onPost, replyTo]);

  const handleReply = useCallback((commentId: string, authorName: string) => {
    setReplyTo({ id: commentId, name: authorName });
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSubmit();
      }
      if (e.key === "Escape" && replyTo) {
        setReplyTo(null);
      }
    },
    [handleSubmit, replyTo],
  );

  if (loading) {
    return (
      <div className="space-y-4 mt-10">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  return (
    <div className="mt-10 border-t pt-8">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="h-5 w-5 text-muted-foreground" />
        <h3 className="text-lg font-semibold">{t("title")}</h3>
        {comments.length > 0 && (
          <span className="text-sm text-muted-foreground">
            ({comments.reduce((acc, c) => acc + 1 + c.replies.length, 0)})
          </span>
        )}
      </div>

      {/* Comment input */}
      {user ? (
        <div className="mb-6">
          {replyTo && (
            <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
              <Reply className="h-3.5 w-3.5" />
              <span>{t("replyTo", { name: replyTo.name })}</span>
              <button
                onClick={() => setReplyTo(null)}
                className="text-xs hover:text-foreground"
              >
                ✕
              </button>
            </div>
          )}
          <div className="relative">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                replyTo ? t("replyPlaceholder") : t("placeholder")
              }
              maxLength={2000}
              rows={3}
              className="w-full resize-none rounded-lg border border-border bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent pr-20"
            />
            <div className="absolute bottom-3 right-3 flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {t("charLimit", { count: content.length })}
              </span>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={!content.trim() || posting}
                className="h-7 px-3 gap-1"
              >
                {posting ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Send className="h-3 w-3" />
                )}
                {t("submit")}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-6 rounded-lg border border-dashed border-border p-6 text-center">
          <p className="text-sm text-muted-foreground">
            {t("signInToComment")}
          </p>
        </div>
      )}

      {/* Comments list */}
      {comments.length === 0 ? (
        <div className="text-center py-8">
          <MessageSquare className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">{t("noComments")}</p>
        </div>
      ) : (
        <div className="divide-y divide-border/50">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={user?.id}
              onReply={handleReply}
              onDelete={onDelete}
              onMarkHelpful={onMarkHelpful}
            />
          ))}
        </div>
      )}
    </div>
  );
}
