"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { PlatformLayout } from "@/components/layout";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  MessageSquare,
  Plus,
  BookOpen,
  Loader2,
  Send,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

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
  author: {
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
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

function PostCard({ post, t }: { post: ForumPost; t: (key: string) => string }) {
  return (
    <Link href={`/community/${post.id}`} className="block rounded-lg border bg-card p-4 hover:bg-accent/50 transition-colors cursor-pointer">
      <div className="flex items-start gap-3">
        <Avatar className="size-9 mt-0.5">
          {post.author.avatarUrl ? (
            <AvatarImage src={post.author.avatarUrl} alt={post.author.displayName} />
          ) : null}
          <AvatarFallback className="text-xs">
            {post.author.displayName.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium truncate">
              {post.author.displayName}
            </span>
            <span className="text-xs text-muted-foreground">
              @{post.author.username}
            </span>
            <span className="text-xs text-muted-foreground">
              · {timeAgo(post.createdAt)}
            </span>
          </div>

          {post.title && (
            <h3 className="font-semibold text-base mb-1">{post.title}</h3>
          )}

          <p className="text-sm text-muted-foreground line-clamp-3">
            {post.content}
          </p>

          <div className="flex items-center gap-3 mt-2">
            {post.courseId && post.courseName && (
              <Link
                href={`/courses/${post.courseSlug}/lessons/${post.lessonIndex ?? 0}`}
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                <BookOpen className="h-3 w-3" />
                {post.courseName}{post.lessonTitle ? ` · ${post.lessonTitle}` : ""}
              </Link>
            )}
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <MessageSquare className="h-3 w-3" />
              {post.replyCount} {t("replies")}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function CommunityPage() {
  const t = useTranslations("forum");
  const { isAuthenticated } = useAuth();

  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "forum" | "lesson">("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [posting, setPosting] = useState(false);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/forum?type=${filter}&limit=50`);
      const data = await res.json();
      setPosts(data.posts ?? []);
    } catch {
      toast.error("Failed to load posts");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleSubmit = async () => {
    if (!newContent.trim()) return;

    setPosting(true);
    try {
      const res = await fetch("/api/forum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim() || null,
          content: newContent.trim(),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to create post");
      }

      setNewTitle("");
      setNewContent("");
      setDialogOpen(false);
      toast.success("Post created!");
      await fetchPosts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create post");
    } finally {
      setPosting(false);
    }
  };

  return (
    <PlatformLayout>
      <div className="container mx-auto px-4 py-8 lg:py-12 max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
            <p className="text-muted-foreground mt-1">{t("subtitle")}</p>
          </div>

          {isAuthenticated ? (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  {t("newPost")}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>{t("newPost")}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div>
                    <Input
                      placeholder={t("titlePlaceholder")}
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      maxLength={200}
                    />
                  </div>
                  <div>
                    <textarea
                      className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                      placeholder={t("postPlaceholder")}
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      maxLength={2000}
                    />
                    <p className="text-xs text-muted-foreground text-right mt-1">
                      {newContent.length}/2000
                    </p>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      onClick={handleSubmit}
                      disabled={posting || !newContent.trim()}
                      className="gap-2"
                    >
                      {posting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      {t("submit")}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          ) : (
            <p className="text-sm text-muted-foreground">{t("signInToPost")}</p>
          )}
        </div>

        {/* Filters */}
        <Tabs
          value={filter}
          onValueChange={(v) => setFilter(v as "all" | "forum" | "lesson")}
          className="mb-6"
        >
          <TabsList>
            <TabsTrigger value="all">{t("allPosts")}</TabsTrigger>
            <TabsTrigger value="forum">{t("forumPosts")}</TabsTrigger>
            <TabsTrigger value="lesson">{t("lessonPosts")}</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Posts */}
        <div className="space-y-3">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-lg border bg-card p-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="size-9 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                </div>
              </div>
            ))
          ) : posts.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">{t("noPostsYet")}</p>
            </div>
          ) : (
            posts.map((post) => (
              <PostCard key={post.id} post={post} t={t} />
            ))
          )}
        </div>
      </div>
    </PlatformLayout>
  );
}
