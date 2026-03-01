"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Link } from "@/i18n/routing";
import {
  ArrowLeft,
  ThumbsUp,
  MessageSquare,
  Clock,
  HelpCircle,
  MessagesSquare,
  FileText,
  ArrowUpDown,
} from "lucide-react";
import { COURSE_CARDS } from "@/lib/mock-data";
import type { PostType, PostLiker } from "@/services/interfaces";

interface Post {
  id: string;
  author: string;
  authorUsername: string | null;
  authorAvatarUrl: string | null;
  title: string;
  content: string;
  courseId: string | null;
  type: PostType;
  tags: string[];
  upvotes: number;
  replies: number;
  liked: boolean;
  createdAt: string;
}

const TYPE_CONFIG: Record<PostType, { color: string; icon: typeof FileText }> = {
  question: { color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400", icon: HelpCircle },
  discussion: { color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", icon: MessagesSquare },
  post: { color: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300", icon: FileText },
};

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function LikersPopover({ postId, upvotes, liked, onLike, t, size = "md" }: {
  postId: string;
  upvotes: number;
  liked: boolean;
  onLike: (id: string) => void;
  t: ReturnType<typeof useTranslations>;
  size?: "sm" | "md";
}) {
  const [likers, setLikers] = useState<PostLiker[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  async function fetchLikers() {
    if (upvotes === 0) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/community/${postId}/likers`);
      if (res.ok) setLikers(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  }

  const btnSize = size === "sm" ? "h-7 w-7" : "h-8 w-8";
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  const textSize = size === "sm" ? "text-xs" : "text-sm";

  return (
    <div className="flex flex-col items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        className={`${btnSize} ${liked ? "text-primary" : ""}`}
        onClick={() => onLike(postId)}
      >
        <ThumbsUp className={`${iconSize} ${liked ? "fill-current" : ""}`} />
      </Button>
      <Popover open={open} onOpenChange={(v) => { setOpen(v); if (v) fetchLikers(); }}>
        <PopoverTrigger asChild>
          <button className={`${textSize} font-medium hover:underline cursor-pointer`}>
            {upvotes}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-3" align="start">
          <p className="text-xs font-medium mb-2">{t("likedBy")}</p>
          {upvotes === 0 ? (
            <p className="text-xs text-muted-foreground">{t("noLikesYet")}</p>
          ) : loading ? (
            <div className="space-y-2">
              {Array.from({ length: Math.min(3, upvotes) }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-3 w-20" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {likers.map((liker) => (
                <div key={liker.userId} className="flex items-center gap-2">
                  <Avatar size="sm">
                    {liker.avatarUrl && <AvatarImage src={liker.avatarUrl} alt={liker.displayName} />}
                    <AvatarFallback>{getInitials(liker.displayName)}</AvatarFallback>
                  </Avatar>
                  <span className="text-xs truncate">
                    {liker.displayName}
                    {liker.username && <span className="text-muted-foreground"> @{liker.username}</span>}
                  </span>
                </div>
              ))}
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default function PostDetailPage() {
  const t = useTranslations("community");
  const { data: session } = useSession();
  const params = useParams();
  const postId = params.id as string;

  const [post, setPost] = useState<Post | null>(null);
  const [replies, setReplies] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replySortNewest, setReplySortNewest] = useState(false);

  async function fetchPost() {
    try {
      const res = await fetch(`/api/community/${postId}`);
      if (res.ok) {
        const data = await res.json();
        setPost(data.post);
        setReplies(data.replies ?? []);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }

  useEffect(() => {
    fetchPost();
  }, [postId]);

  const sortedReplies = replySortNewest ? [...replies].reverse() : replies;

  async function handleLike(id: string) {
    if (!session?.user) return;
    const res = await fetch(`/api/community/${id}/like`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      if (id === post?.id) {
        setPost((p) => p ? { ...p, liked: data.liked, upvotes: data.upvotes } : p);
      } else {
        setReplies((prev) =>
          prev.map((r) =>
            r.id === id ? { ...r, liked: data.liked, upvotes: data.upvotes } : r,
          ),
        );
      }
    }
  }

  async function handleReply() {
    if (!replyContent.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/community/${postId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyContent }),
      });
      if (res.ok) {
        setReplyContent("");
        fetchPost();
      }
    } catch { /* ignore */ }
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <p className="text-muted-foreground">Post not found.</p>
      </div>
    );
  }

  const typeConf = TYPE_CONFIG[post.type];
  const TypeIcon = typeConf.icon;
  const courseName = post.courseId
    ? COURSE_CARDS.find((c) => c.slug === post.courseId)?.title ?? post.courseId
    : null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link href="/community">
        <Button variant="ghost" size="sm" className="gap-1 mb-6">
          <ArrowLeft className="h-4 w-4" />
          {t("backToForum")}
        </Button>
      </Link>

      {/* Main post */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <LikersPopover
              postId={post.id}
              upvotes={post.upvotes}
              liked={post.liked}
              onLike={handleLike}
              t={t}
            />
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge variant="secondary" className={`text-[10px] gap-1 ${typeConf.color}`}>
                  <TypeIcon className="h-3 w-3" />
                  {t(post.type)}
                </Badge>
                {courseName && (
                  <Badge variant="outline" className="text-[10px]">{courseName}</Badge>
                )}
              </div>
              <h1 className="text-xl font-bold">{post.title}</h1>
              <p className="mt-3 text-muted-foreground whitespace-pre-wrap">{post.content}</p>
              {post.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {post.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-[10px] font-normal">{tag}</Badge>
                  ))}
                </div>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Avatar size="sm">
                    {post.authorAvatarUrl && <AvatarImage src={post.authorAvatarUrl} alt={post.author} />}
                    <AvatarFallback>{getInitials(post.author)}</AvatarFallback>
                  </Avatar>
                  {post.author}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(post.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Replies header */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          {t("replies")} ({replies.length})
        </h2>
        {replies.length > 1 && (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-xs"
            onClick={() => setReplySortNewest(!replySortNewest)}
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
            {replySortNewest ? t("newest") : t("oldest")}
          </Button>
        )}
      </div>

      {replies.length === 0 ? (
        <p className="text-sm text-muted-foreground mb-8">{t("noRepliesYet")}</p>
      ) : (
        <div className="space-y-4 mb-8">
          {sortedReplies.map((reply) => (
            <Card key={reply.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <LikersPopover
                    postId={reply.id}
                    upvotes={reply.upvotes}
                    liked={reply.liked}
                    onLike={handleLike}
                    t={t}
                    size="sm"
                  />
                  <div className="flex-1">
                    <p className="text-sm whitespace-pre-wrap">{reply.content}</p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Avatar size="sm">
                          {reply.authorAvatarUrl && <AvatarImage src={reply.authorAvatarUrl} alt={reply.author} />}
                          <AvatarFallback>{getInitials(reply.author)}</AvatarFallback>
                        </Avatar>
                        {reply.author}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(reply.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Reply form */}
      {session?.user ? (
        <Card>
          <CardContent className="p-4 space-y-3">
            <Textarea
              placeholder={t("writeReply")}
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              rows={3}
            />
            <Button onClick={handleReply} disabled={submitting || !replyContent.trim()}>
              {submitting ? "..." : t("reply")}
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
