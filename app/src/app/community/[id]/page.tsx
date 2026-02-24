"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { PlatformLayout } from "@/components/layout";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  MessageSquare,
  BookOpen,
  Loader2,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface Author {
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

interface ForumPost {
  id: string;
  userId: string;
  courseId: string | null;
  lessonIndex: number | null;
  title: string | null;
  content: string;
  isHelpful: boolean;
  createdAt: string;
  replyCount: number;
  courseName: string | null;
  courseSlug: string | null;
  lessonTitle: string | null;
  author: Author;
}

interface Reply {
  id: string;
  userId: string;
  content: string;
  isHelpful: boolean;
  createdAt: string;
  author: Author;
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

function formatDate(timestamp: string): string {
  return new Date(timestamp).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TopicPage() {
  const { id } = useParams<{ id: string }>();
  const t = useTranslations("forum");
  const { isAuthenticated } = useAuth();

  const [post, setPost] = useState<ForumPost | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState("");
  const [posting, setPosting] = useState(false);

  const fetchPost = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/forum/${id}`);
      if (!res.ok) {
        toast.error(t("postNotFound"));
        return;
      }
      const data = await res.json();
      setPost(data.post);
      setReplies(data.replies ?? []);
    } catch {
      toast.error(t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  const handleReply = async () => {
    if (!replyContent.trim()) return;

    setPosting(true);
    try {
      const res = await fetch(`/api/forum/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyContent.trim() }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? t("replyError"));
      }

      setReplyContent("");
      toast.success(t("replySuccess"));
      await fetchPost();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("replyError"),
      );
    } finally {
      setPosting(false);
    }
  };

  return (
    <PlatformLayout>
      <div className="container mx-auto px-4 py-8 lg:py-12 max-w-3xl">
        {/* Back button */}
        <Link
          href="/community"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("backToCommunity")}
        </Link>

        {loading ? (
          <div className="space-y-4">
            <div className="rounded-lg border bg-card p-6">
              <div className="flex items-start gap-3">
                <Skeleton className="size-10 rounded-full" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            </div>
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="rounded-lg border bg-card p-4 ml-6">
                <div className="flex items-start gap-3">
                  <Skeleton className="size-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : !post ? (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">{t("postNotFound")}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Original post */}
            <div className="rounded-lg border bg-card p-6">
              <div className="flex items-start gap-3">
                <Avatar className="size-10 mt-0.5">
                  {post.author.avatarUrl ? (
                    <AvatarImage
                      src={post.author.avatarUrl}
                      alt={post.author.displayName}
                    />
                  ) : null}
                  <AvatarFallback className="text-xs">
                    {post.author.displayName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium">
                      {post.author.displayName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      @{post.author.username}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      · {formatDate(post.createdAt)}
                    </span>
                  </div>

                  {post.title && (
                    <h1 className="text-xl font-bold mb-3">{post.title}</h1>
                  )}

                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {post.content}
                  </p>

                  <div className="flex items-center gap-3 mt-4 pt-3 border-t">
                    {post.courseId && post.courseName && (
                      <Link
                        href={`/courses/${post.courseSlug}/lessons/${post.lessonIndex ?? 0}`}
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <BookOpen className="h-3 w-3" />
                        {post.courseName}{post.lessonTitle ? ` · ${post.lessonTitle}` : ""}
                      </Link>
                    )}
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MessageSquare className="h-3 w-3" />
                      {replies.length} {t("replies")}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Replies */}
            {replies.length > 0 && (
              <div className="space-y-3 ml-6">
                {replies.map((reply) => (
                  <div
                    key={reply.id}
                    className="rounded-lg border bg-card p-4"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="size-8 mt-0.5">
                        {reply.author.avatarUrl ? (
                          <AvatarImage
                            src={reply.author.avatarUrl}
                            alt={reply.author.displayName}
                          />
                        ) : null}
                        <AvatarFallback className="text-xs">
                          {reply.author.displayName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">
                            {reply.author.displayName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            @{reply.author.username}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            · {timeAgo(reply.createdAt)}
                          </span>
                        </div>

                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {reply.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Reply input */}
            {isAuthenticated ? (
              <div className="rounded-lg border bg-card p-4 mt-6">
                <textarea
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                  placeholder={t("replyPlaceholder")}
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  maxLength={2000}
                />
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-muted-foreground">
                    {replyContent.length}/2000
                  </p>
                  <Button
                    onClick={handleReply}
                    disabled={posting || !replyContent.trim()}
                    size="sm"
                    className="gap-2"
                  >
                    {posting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    {t("replyButton")}
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                {t("signInToPost")}
              </p>
            )}
          </div>
        )}
      </div>
    </PlatformLayout>
  );
}
