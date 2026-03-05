"use client";

import { useState, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { MessageSquare, ChevronDown, ChevronUp, ThumbsUp, Send, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Reply {
  id: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  createdAt: number;
  upvotes: number;
}

interface Discussion {
  id: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  type: "question" | "discussion";
  createdAt: number;
  upvotes: number;
  replies: Reply[];
}

type SortKey = "latest" | "top" | "unanswered";
type FilterKey = "all" | "questions" | "discussions";

// ── Helpers ───────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "#14F195", "#9945FF", "#00C2FF", "#C9903A",
  "#F1147A", "#1AAFFF", "#FF6B35", "#7CFC00",
];

function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length] as string;
}

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function lsKey(courseSlug: string, lessonSlug: string): string {
  return `lesson_discussions_${courseSlug}_${lessonSlug}`;
}

// ── localStorage hook ─────────────────────────────────────────────────────────

function useDiscussions(courseSlug: string, lessonSlug: string) {
  const key = lsKey(courseSlug, lessonSlug);

  const [discussions, setDiscussions] = useState<Discussion[]>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw) as Discussion[];
    } catch {
      // ignore corrupt storage
    }
    return [];
  });

  const save = useCallback(
    (next: Discussion[]) => {
      setDiscussions(next);
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // ignore quota errors
      }
    },
    [key]
  );

  const addDiscussion = useCallback(
    (d: Discussion) => {
      setDiscussions((prev) => {
        const next = [d, ...prev];
        try {
          localStorage.setItem(key, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
    },
    [key]
  );

  const upvoteDiscussion = useCallback(
    (id: string) => {
      setDiscussions((prev) => {
        const next = prev.map((d) =>
          d.id === id ? { ...d, upvotes: d.upvotes + 1 } : d
        );
        try {
          localStorage.setItem(key, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
    },
    [key]
  );

  const addReply = useCallback(
    (discussionId: string, reply: Reply) => {
      setDiscussions((prev) => {
        const next = prev.map((d) =>
          d.id === discussionId
            ? { ...d, replies: [...d.replies, reply] }
            : d
        );
        try {
          localStorage.setItem(key, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
    },
    [key]
  );

  const upvoteReply = useCallback(
    (discussionId: string, replyId: string) => {
      setDiscussions((prev) => {
        const next = prev.map((d) =>
          d.id === discussionId
            ? {
                ...d,
                replies: d.replies.map((r) =>
                  r.id === replyId ? { ...r, upvotes: r.upvotes + 1 } : r
                ),
              }
            : d
        );
        try {
          localStorage.setItem(key, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
    },
    [key]
  );

  return { discussions, addDiscussion, upvoteDiscussion, addReply, upvoteReply, save };
}

// ── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({ name, color, size = "md" }: { name: string; color: string; size?: "sm" | "md" }) {
  const sizeClass = size === "sm" ? "h-7 w-7 text-xs" : "h-9 w-9 text-sm";
  return (
    <div
      className={cn(
        "shrink-0 rounded-full flex items-center justify-center font-bold text-[#08080C]",
        sizeClass
      )}
      style={{ backgroundColor: color }}
      aria-hidden="true"
    >
      {initials(name)}
    </div>
  );
}

// ── ReplyItem ─────────────────────────────────────────────────────────────────

function ReplyItem({
  reply,
  onUpvote,
}: {
  reply: Reply;
  onUpvote: () => void;
}) {
  const t = useTranslations("discussion");
  const color = reply.authorAvatar ?? avatarColor(reply.authorName);
  return (
    <div className="flex gap-3 py-3">
      <Avatar name={reply.authorName} color={color} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-foreground/90 truncate">
            {reply.authorName}
          </span>
          <span className="text-xs text-muted-foreground shrink-0">
            {relativeTime(reply.createdAt)}
          </span>
        </div>
        <p className="text-sm text-foreground/80 whitespace-pre-wrap break-words">
          {reply.content}
        </p>
        <button
          onClick={onUpvote}
          className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
          aria-label={t("upvote")}
        >
          <ThumbsUp className="h-3 w-3" />
          <span>{reply.upvotes}</span>
        </button>
      </div>
    </div>
  );
}

// ── DiscussionCard ─────────────────────────────────────────────────────────────

function DiscussionCard({
  discussion,
  expanded,
  onToggle,
  onUpvote,
  onAddReply,
  onUpvoteReply,
  session,
}: {
  discussion: Discussion;
  expanded: boolean;
  onToggle: () => void;
  onUpvote: () => void;
  onAddReply: (reply: Reply) => void;
  onUpvoteReply: (replyId: string) => void;
  session: ReturnType<typeof useSession>["data"];
}) {
  const t = useTranslations("discussion");
  const color = discussion.authorAvatar ?? avatarColor(discussion.authorName);
  const [replyText, setReplyText] = useState("");

  const handleReply = () => {
    const trimmed = replyText.trim();
    if (!trimmed || !session) return;
    const authorName =
      session.user?.name ??
      (session.user?.email ? session.user.email.slice(0, 8) + "…" : "Anonymous");
    const reply: Reply = {
      id: `r-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      authorName,
      authorAvatar: avatarColor(authorName),
      content: trimmed,
      createdAt: Date.now(),
      upvotes: 0,
    };
    onAddReply(reply);
    setReplyText("");
  };

  return (
    <div
      className={cn(
        "rounded-xl border bg-[#101018] transition-colors",
        expanded ? "border-primary/40" : "border-border/40 hover:border-border/70"
      )}
    >
      {/* Main post */}
      <div className="p-4">
        <div className="flex gap-3">
          <Avatar name={discussion.authorName} color={color} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-sm font-semibold text-foreground/90 truncate">
                {discussion.authorName}
              </span>
              <Badge
                variant="outline"
                className={cn(
                  "text-xs shrink-0 px-1.5 py-0",
                  discussion.type === "question"
                    ? "border-primary/40 text-primary"
                    : "border-border/60 text-muted-foreground"
                )}
              >
                {discussion.type === "question" ? t("typeQuestion") : t("typeDiscussion")}
              </Badge>
              <span className="text-xs text-muted-foreground shrink-0 ml-auto">
                {relativeTime(discussion.createdAt)}
              </span>
            </div>
            <p className="text-sm text-foreground/80 whitespace-pre-wrap break-words">
              {discussion.content}
            </p>

            {/* Actions row */}
            <div className="mt-3 flex items-center gap-4">
              <button
                onClick={onUpvote}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                aria-label={t("upvote")}
              >
                <ThumbsUp className="h-3.5 w-3.5" />
                <span>{discussion.upvotes}</span>
              </button>
              <button
                onClick={onToggle}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>
                  {discussion.replies.length}{" "}
                  {discussion.replies.length === 1 ? t("reply") : t("replies")}
                </span>
                {expanded ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded: replies + reply form */}
      {expanded && (
        <div className="border-t border-border/40 px-4 pb-4">
          {discussion.replies.length > 0 && (
            <div className="divide-y divide-border/30">
              {discussion.replies.map((reply) => (
                <ReplyItem
                  key={reply.id}
                  reply={reply}
                  onUpvote={() => onUpvoteReply(reply.id)}
                />
              ))}
            </div>
          )}

          {/* Reply form */}
          {session ? (
            <div className="mt-3 flex flex-col gap-2">
              <Textarea
                placeholder={t("replyPlaceholder")}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={2}
                className="resize-none text-sm bg-background/60 border-border/40"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleReply();
                }}
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={handleReply}
                  disabled={!replyText.trim()}
                  className="gap-1.5"
                >
                  <Send className="h-3.5 w-3.5" />
                  {t("reply")}
                </Button>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              <Link
                href="/auth/signin"
                className="text-primary underline underline-offset-2 hover:no-underline"
              >
                {t("signInToAsk")}
              </Link>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface LessonDiscussionProps {
  lessonSlug: string;
  courseSlug: string;
}

export function LessonDiscussion({ lessonSlug, courseSlug }: LessonDiscussionProps) {
  const t = useTranslations("discussion");
  const { data: session } = useSession();
  const { discussions, addDiscussion, upvoteDiscussion, addReply, upvoteReply } =
    useDiscussions(courseSlug, lessonSlug);

  const [sort, setSort] = useState<SortKey>("latest");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newPostText, setNewPostText] = useState("");
  const [newPostType, setNewPostType] = useState<"question" | "discussion">("question");

  const handleSubmit = () => {
    const trimmed = newPostText.trim();
    if (!trimmed || !session) return;
    const authorName =
      session.user?.name ??
      (session.user?.email ? session.user.email.slice(0, 8) + "…" : "Anonymous");
    const d: Discussion = {
      id: `d-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      authorName,
      authorAvatar: avatarColor(authorName),
      content: trimmed,
      type: newPostType,
      createdAt: Date.now(),
      upvotes: 0,
      replies: [],
    };
    addDiscussion(d);
    setNewPostText("");
    setExpandedId(d.id);
  };

  const sorted = useMemo(() => {
    let list = discussions.filter((d) => {
      if (filter === "questions") return d.type === "question";
      if (filter === "discussions") return d.type === "discussion";
      return true;
    });
    if (sort === "latest") list = [...list].sort((a, b) => b.createdAt - a.createdAt);
    if (sort === "top") list = [...list].sort((a, b) => b.upvotes - a.upvotes);
    if (sort === "unanswered") list = list.filter((d) => d.replies.length === 0);
    return list;
  }, [discussions, sort, filter]);

  const SORT_TABS: { key: SortKey; label: string }[] = [
    { key: "latest", label: t("latest") },
    { key: "top", label: t("top") },
    { key: "unanswered", label: t("unanswered") },
  ];

  const FILTER_TABS: { key: FilterKey; label: string }[] = [
    { key: "all", label: t("all") },
    { key: "questions", label: t("questions") },
    { key: "discussions", label: t("discussions") },
  ];

  return (
    <div className="mt-2">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="h-5 w-5 text-primary shrink-0" aria-hidden="true" />
        <h2 className="text-lg font-semibold">{t("title")}</h2>
        {discussions.length > 0 && (
          <Badge variant="outline" className="text-xs border-border/50 text-muted-foreground">
            {discussions.length}
          </Badge>
        )}
      </div>

      {/* New post form or sign-in prompt */}
      {session ? (
        <div className="mb-6 rounded-xl border border-border/40 bg-[#101018] p-4 space-y-3">
          {/* Type selector */}
          <div className="flex gap-2">
            {(["question", "discussion"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setNewPostType(type)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium border transition-colors",
                  newPostType === type
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground"
                )}
              >
                {type === "question" ? t("typeQuestion") : t("typeDiscussion")}
              </button>
            ))}
          </div>
          <Textarea
            placeholder={t("askQuestion")}
            value={newPostText}
            onChange={(e) => setNewPostText(e.target.value)}
            rows={3}
            className="resize-none text-sm bg-background/60 border-border/40"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSubmit();
            }}
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!newPostText.trim()}
              className="gap-1.5"
            >
              <Send className="h-3.5 w-3.5" />
              {t("submit")}
            </Button>
          </div>
        </div>
      ) : (
        <div className="mb-6 rounded-xl border border-border/40 bg-[#101018] p-4 flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">{t("askQuestion")}</p>
          <Link href="/auth/signin">
            <Button variant="outline" size="sm" className="shrink-0 gap-1.5">
              <LogIn className="h-3.5 w-3.5" />
              {t("signInToAsk")}
            </Button>
          </Link>
        </div>
      )}

      {/* Sort + filter controls */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        {/* Sort tabs */}
        <div className="flex gap-1.5" role="tablist" aria-label="Sort discussions">
          {SORT_TABS.map(({ key, label }) => (
            <button
              key={key}
              role="tab"
              aria-selected={sort === key}
              onClick={() => setSort(key)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium border transition-colors",
                sort === key
                  ? "border-primary bg-primary text-[#08080C]"
                  : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1.5" role="tablist" aria-label="Filter discussions">
          {FILTER_TABS.map(({ key, label }) => (
            <button
              key={key}
              role="tab"
              aria-selected={filter === key}
              onClick={() => setFilter(key)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium border transition-colors",
                filter === key
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Discussion list or empty state */}
      {sorted.length === 0 ? (
        <div className="py-12 flex flex-col items-center text-center gap-3">
          <div className="rounded-full bg-muted/30 p-4">
            <MessageSquare className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
          </div>
          <p className="text-sm text-muted-foreground max-w-xs">{t("noQuestions")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((d) => (
            <DiscussionCard
              key={d.id}
              discussion={d}
              expanded={expandedId === d.id}
              onToggle={() => setExpandedId((prev) => (prev === d.id ? null : d.id))}
              onUpvote={() => upvoteDiscussion(d.id)}
              onAddReply={(reply) => addReply(d.id, reply)}
              onUpvoteReply={(replyId) => upvoteReply(d.id, replyId)}
              session={session}
            />
          ))}
        </div>
      )}
    </div>
  );
}
