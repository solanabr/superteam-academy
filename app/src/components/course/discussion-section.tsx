"use client";

import { useState, useMemo, useCallback } from "react";
import { MessageCircle, Reply, ChevronDown, ChevronUp, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  type Comment,
  type DiscussionSectionProps,
  generateId,
  getUserName,
  formatCommentDate,
  loadComments,
  saveComments,
  countComments,
} from "./discussion-utils";

export type { DiscussionSectionProps } from "./discussion-utils";

/** Avatar initials circle. */
function CommentAvatar({
  name,
  isUser,
  small,
}: {
  name: string;
  isUser?: boolean;
  small?: boolean;
}) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-bold text-white",
        small ? "h-7 w-7 text-xs" : "h-9 w-9 text-sm",
        isUser
          ? "bg-gradient-to-br from-st-green to-brazil-teal"
          : "bg-gradient-to-br from-muted-foreground/60 to-muted-foreground/40"
      )}
    >
      {initials}
    </div>
  );
}

/** Inline reply form. */
function ReplyForm({
  onSubmit,
  onCancel,
  placeholder,
}: {
  onSubmit: (content: string) => void;
  onCancel: () => void;
  placeholder: string;
}) {
  const t = useTranslations("courses.detail.discussion");
  const [content, setContent] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = content.trim();
    if (trimmed.length < 3) return;
    onSubmit(trimmed);
    setContent("");
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
      <input
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        maxLength={500}
        className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-st-green focus:outline-none focus:ring-1 focus:ring-st-green"
        autoFocus
      />
      <button
        type="submit"
        disabled={content.trim().length < 3}
        className="inline-flex items-center gap-1.5 rounded-lg bg-st-green px-3 py-2 text-sm font-medium text-white transition-all hover:bg-st-green-dark active:scale-[0.97] disabled:opacity-40"
      >
        <Send className="h-3.5 w-3.5" />
        {t("reply")}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
      >
        {t("cancelReply")}
      </button>
    </form>
  );
}

/** A single comment with its nested replies. */
function CommentItem({
  comment,
  depth,
  onReply,
}: {
  comment: Comment;
  depth: number;
  onReply: (parentId: string, content: string) => void;
}) {
  const t = useTranslations("courses.detail.discussion");
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const hasReplies = comment.replies.length > 0;
  const maxDepth = 2;

  function handleReply(content: string) {
    onReply(comment.id, content);
    setShowReplyForm(false);
  }

  return (
    <div className={cn(depth > 0 && "ml-6 border-l border-border/50 pl-4")}>
      <div className="group py-3">
        <div className="flex items-start gap-3">
          <CommentAvatar
            name={comment.author}
            isUser={comment.isUser}
            small={depth > 0}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">{comment.author}</span>
              {comment.isUser && (
                <span className="rounded-full bg-st-green/10 px-2 py-0.5 text-xs font-medium text-st-green">
                  {t("you")}
                </span>
              )}
              <span className="text-xs text-muted-foreground">
                {formatCommentDate(comment.createdAt)}
              </span>
            </div>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {comment.content}
            </p>
            <div className="mt-1.5 flex items-center gap-3">
              {depth < maxDepth && (
                <button
                  type="button"
                  onClick={() => setShowReplyForm(!showReplyForm)}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Reply className="h-3 w-3" />
                  {t("reply")}
                </button>
              )}
              {hasReplies && (
                <button
                  type="button"
                  onClick={() => setCollapsed(!collapsed)}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  {collapsed ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronUp className="h-3 w-3" />
                  )}
                  {t("repliesCount", { count: comment.replies.length })}
                </button>
              )}
            </div>

            {showReplyForm && (
              <ReplyForm
                onSubmit={handleReply}
                onCancel={() => setShowReplyForm(false)}
                placeholder={t("replyPlaceholder", { name: comment.author })}
              />
            )}
          </div>
        </div>
      </div>

      {hasReplies && !collapsed && (
        <div>
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              onReply={onReply}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** Community discussion section with threaded comments. */
export function DiscussionSection({ courseSlug }: DiscussionSectionProps) {
  const t = useTranslations("courses.detail.discussion");
  const [comments, setComments] = useState<Comment[]>(() =>
    loadComments(courseSlug)
  );
  const [newComment, setNewComment] = useState("");

  const totalCount = useMemo(() => countComments(comments), [comments]);

  const handleNewComment = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = newComment.trim();
      if (trimmed.length < 3) return;

      const comment: Comment = {
        id: generateId(),
        author: getUserName(),
        content: trimmed,
        createdAt: new Date().toISOString(),
        isUser: true,
        replies: [],
      };
      const updated = [comment, ...comments];
      setComments(updated);
      saveComments(courseSlug, updated);
      setNewComment("");
    },
    [newComment, comments, courseSlug]
  );

  const handleReply = useCallback(
    (parentId: string, content: string) => {
      const reply: Comment = {
        id: generateId(),
        author: getUserName(),
        content,
        createdAt: new Date().toISOString(),
        isUser: true,
        replies: [],
      };

      /** Recursively insert a reply into the matching thread. */
      function insertReply(list: Comment[]): Comment[] {
        return list.map((c) => {
          if (c.id === parentId) {
            return { ...c, replies: [...c.replies, reply] };
          }
          if (c.replies.length > 0) {
            return { ...c, replies: insertReply(c.replies) };
          }
          return c;
        });
      }

      const updated = insertReply(comments);
      setComments(updated);
      saveComments(courseSlug, updated);
    },
    [comments, courseSlug]
  );

  return (
    <div className="mt-10">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-muted-foreground" />
        <h2 className="font-heading text-xl font-bold">{t("title")}</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("commentsCount", { count: totalCount })}
      </p>

      {/* New Comment Form */}
      <form onSubmit={handleNewComment} className="mt-6">
        <div className="flex gap-3">
          <CommentAvatar name={getUserName()} isUser />
          <div className="flex-1">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={t("placeholder")}
              rows={3}
              maxLength={1000}
              className="w-full resize-none rounded-xl border border-border bg-card px-4 py-3 text-sm placeholder:text-muted-foreground focus:border-st-green focus:outline-none focus:ring-1 focus:ring-st-green"
            />
            <div className="mt-2 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {newComment.length}/1000
              </p>
              <button
                type="submit"
                disabled={newComment.trim().length < 3}
                className="inline-flex items-center gap-1.5 rounded-lg bg-st-green px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-st-green-dark hover:shadow-md active:scale-[0.97] disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
                {t("post")}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Comment Thread */}
      <div className="mt-6 divide-y divide-border/50">
        {comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            depth={0}
            onReply={handleReply}
          />
        ))}
      </div>

      {comments.length === 0 && (
        <div className="mt-8 text-center">
          <MessageCircle className="mx-auto h-10 w-10 text-muted-foreground/30" />
          <p className="mt-2 text-sm text-muted-foreground">{t("empty")}</p>
          <p className="text-xs text-muted-foreground">{t("emptyHint")}</p>
        </div>
      )}
    </div>
  );
}
