"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link } from "@/i18n/routing";
import {
  MessageSquare,
  Search,
  Tag,
  Clock,
  User,
  Plus,
  TrendingUp,
  HelpCircle,
  Lightbulb,
  BookMarked,
  ChevronDown,
  ChevronUp,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

type Category = "general" | "help" | "showntell" | "resources";

interface Thread {
  id: string;
  title: string;
  author: string;
  date: string;
  replies: number;
  category: Category;
  tags: string[];
  preview: string;
  content?: string;
  pinned?: boolean;
}

interface Reply {
  id: string;
  author: string;
  date: string;
  content: string;
}

// ── Seed data ────────────────────────────────────────────────────────────────

const SEED_THREADS: Thread[] = [
  {
    id: "1",
    title: "What's the difference between Token-2022 and SPL Token?",
    author: "8xPq...3Yzk",
    date: "2026-02-28",
    replies: 14,
    category: "help",
    tags: ["token-2022", "spl-token", "beginner"],
    preview:
      "I keep seeing Token-2022 mentioned in the lessons but I'm not sure how it differs from the classic SPL Token program. Can someone break it down?",
    content:
      "I keep seeing Token-2022 mentioned in the lessons but I'm not sure how it differs from the classic SPL Token program. Can someone break it down?\n\nI've read the Solana docs page on Token-2022 but it's still a bit confusing. Specifically:\n- Is Token-2022 a completely separate program?\n- Are existing SPL tokens compatible?\n- What extensions are most commonly used in practice?\n\nAny clear explanation would be really appreciated!",
  },
  {
    id: "2",
    title: "Anchor vs Native — which should I learn first?",
    author: "4mNr...7Bvw",
    date: "2026-02-27",
    replies: 22,
    category: "general",
    tags: ["anchor", "native", "roadmap"],
    preview:
      "Starting my Solana journey and debating whether to go straight to Anchor or first understand native programs. Opinions welcome!",
    content:
      "Starting my Solana journey and debating whether to go straight to Anchor or first understand native programs. Opinions welcome!\n\nMy background: I have about 2 years of Rust experience and 3 years with TypeScript. I'm not a complete beginner to blockchain but Solana is new to me.\n\nFrom what I understand, Anchor abstracts a lot of the boilerplate but you lose some understanding of what's happening under the hood. On the other hand, going native first could be a steep learning curve.\n\nWhat did you do and what would you recommend?",
    pinned: true,
  },
  {
    id: "3",
    title: "Shipped: my first soulbound credential NFT dApp",
    author: "2kTj...9Alp",
    date: "2026-02-26",
    replies: 31,
    category: "showntell",
    tags: ["nft", "metaplex-core", "project"],
    preview:
      "After 3 months on this platform I built a credential issuance dApp using Metaplex Core. Sharing the repo and a quick demo video.",
    content:
      "After 3 months on this platform I built a credential issuance dApp using Metaplex Core. Sharing the repo and a quick demo video.\n\nThe dApp lets institutions issue soulbound credential NFTs to students. Key features:\n- Metaplex Core NFTs with PermanentFreezeDelegate (truly soulbound)\n- Admin dashboard for issuing credentials\n- Public verification page (no wallet needed to verify)\n- Off-chain metadata stored on Arweave\n\nGitHub: github.com/example/credential-dapp (placeholder)\n\nFeedback very welcome! Especially interested in hearing if there are security concerns with the current approach.",
  },
  {
    id: "4",
    title: "Best resources for learning Solana account model",
    author: "6cFy...1Mnq",
    date: "2026-02-25",
    replies: 9,
    category: "resources",
    tags: ["accounts", "pda", "learning"],
    preview:
      "Compiled a list of docs, videos, and repos that really helped me grok the Solana account model. Hope this saves someone a few hours.",
    content:
      "Compiled a list of docs, videos, and repos that really helped me grok the Solana account model. Hope this saves someone a few hours.\n\n**Official Docs**\n- Solana Cookbook — account model section\n- Solana Docs — accounts & programs\n\n**Videos**\n- Jarry Xiao's account model deep-dive (YouTube)\n- Solana Bootcamp Day 1 (Rareskills)\n\n**Code Examples**\n- solana-program-library — read actual SPL source\n- coral-xyz/anchor examples — accounts.rs files are gold\n\n**PDAs specifically**\n- The Anchor book PDA chapter\n- paulx.dev blog posts (older but still excellent)\n\nHope this helps!",
  },
  {
    id: "5",
    title: "How does the XP soulbound mechanism prevent transfers?",
    author: "3hWe...5Rkx",
    date: "2026-02-24",
    replies: 7,
    category: "help",
    tags: ["xp", "token-2022", "soulbound"],
    preview:
      "I understand Token-2022 has a NonTransferable extension but I'm unsure how it interacts with the PermanentDelegate extension used here.",
    content:
      "I understand Token-2022 has a NonTransferable extension but I'm unsure how it interacts with the PermanentDelegate extension used here.\n\nFrom reading the platform spec, XP tokens use both NonTransferable AND PermanentDelegate. I get that NonTransferable prevents user-initiated transfers, but:\n\n1. Can the PermanentDelegate still move tokens even if NonTransferable is set?\n2. Is PermanentDelegate used here for burning (slashing XP)?\n3. What prevents a malicious program from using the delegate to drain someone's XP?\n\nI want to understand the security model before trusting this with real reputation.",
  },
  {
    id: "6",
    title: "PDA derivation cheat-sheet for this platform's program",
    author: "9sLa...2Opw",
    date: "2026-02-22",
    replies: 5,
    category: "resources",
    tags: ["pda", "anchor", "reference"],
    preview:
      "Wrote up a quick reference table of every PDA seed used by the on-chain program. Might save you some debugging time.",
    content:
      "Wrote up a quick reference table of every PDA seed used by the on-chain program. Might save you some debugging time.\n\n| Account | Seeds |\n|---------|-------|\n| Config | [\"config\"] |\n| CourseAccount | [\"course\", authority] |\n| EnrollmentAccount | [\"enrollment\", learner, course] |\n| LessonAccount | [\"lesson\", course, index_bytes] |\n| AchievementAccount | [\"achievement\", config, index_bytes] |\n| LearnerAchievement | [\"learner_achievement\", learner, achievement] |\n\nAll PDAs use the program ID as implicit seed. Bumps are stored in the accounts themselves — don't recalculate on every call.\n\nTip: if you're getting `ConstraintSeeds` errors, double-check you're passing the bump from the stored account, not re-deriving it.",
  },
  {
    id: "7",
    title: "Weekly study group — who's in for next Sunday?",
    author: "5nKb...8Gqt",
    date: "2026-02-20",
    replies: 18,
    category: "general",
    tags: ["community", "study-group"],
    preview:
      "We had 12 people last time and it was great. Let's do it again this Sunday at 15:00 UTC on the Superteam Discord.",
    content:
      "We had 12 people last time and it was great. Let's do it again this Sunday at 15:00 UTC on the Superteam Discord.\n\nLast session topics:\n- Anchor account validation patterns\n- PDA derivation debugging\n- Token-2022 extension overview\n\nProposed topics for this Sunday:\n- CPI (cross-program invocation) hands-on\n- Building a simple escrow with Anchor\n- Q&A on anything from the curriculum\n\nDrop a reply if you're coming so I can gauge numbers. See you there!",
  },
  {
    id: "8",
    title: "Show & Tell: on-chain quiz dApp with XP rewards",
    author: "1vZp...4Duh",
    date: "2026-02-18",
    replies: 26,
    category: "showntell",
    tags: ["project", "quiz", "xp", "anchor"],
    preview:
      "Built a quiz dApp that awards XP tokens on-chain for correct answers. Full code walkthrough in the thread.",
    content:
      "Built a quiz dApp that awards XP tokens on-chain for correct answers. Full code walkthrough in the thread.\n\nArchitecture overview:\n- Anchor program stores questions as PDAs (question_account seeds: [\"question\", quiz_id, index])\n- Backend signer validates answers off-chain, then signs a transaction to award XP\n- Frontend built with Next.js + wallet-adapter\n- XP awards happen via CPI to the academy program's award_xp instruction\n\nThe tricky part was preventing replay attacks — solved it with a nonce stored in the enrollment account.\n\nFull walkthrough: github.com/example/quiz-dapp (placeholder)\n\nOpen to PRs and feedback on the security model especially.",
  },
];

// ── localStorage keys ─────────────────────────────────────────────────────────

const LS_THREADS_KEY = "community-threads";
const lsRepliesKey = (threadId: string) => `community-replies-${threadId}`;

// ── useCommunityThreads hook ──────────────────────────────────────────────────

function useCommunityThreads() {
  const [userThreads, setUserThreads] = useState<Thread[]>(() => {
    try {
      const raw = localStorage.getItem(LS_THREADS_KEY);
      if (raw) return JSON.parse(raw) as Thread[];
    } catch {
      // ignore corrupt storage
    }
    return [];
  });

  const addThread = useCallback((thread: Thread) => {
    setUserThreads((prev) => {
      const next = [thread, ...prev];
      try {
        localStorage.setItem(LS_THREADS_KEY, JSON.stringify(next));
      } catch {
        // ignore quota errors
      }
      return next;
    });
  }, []);

  // Seed threads first (pinned ones stay at top after sort), then user threads
  const allThreads = useMemo(
    () => [...userThreads, ...SEED_THREADS],
    [userThreads]
  );

  return { allThreads, addThread };
}

// ── useThreadReplies hook ─────────────────────────────────────────────────────

function useThreadReplies(threadId: string) {
  const [replies, setReplies] = useState<Reply[]>(() => {
    try {
      const raw = localStorage.getItem(lsRepliesKey(threadId));
      if (raw) return JSON.parse(raw) as Reply[];
    } catch {
      // ignore
    }
    return [];
  });

  const addReply = useCallback(
    (reply: Reply) => {
      setReplies((prev) => {
        const next = [...prev, reply];
        try {
          localStorage.setItem(lsRepliesKey(threadId), JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
    },
    [threadId]
  );

  return { replies, addReply };
}

// ── Category config ───────────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<Category, typeof MessageSquare> = {
  general: TrendingUp,
  help: HelpCircle,
  showntell: Lightbulb,
  resources: BookMarked,
};

// ── ReplySection ──────────────────────────────────────────────────────────────

function ReplySection({
  threadId,
  session,
}: {
  threadId: string;
  session: ReturnType<typeof useSession>["data"];
}) {
  const { replies, addReply } = useThreadReplies(threadId);
  const [replyText, setReplyText] = useState("");

  const handleSubmit = () => {
    const trimmed = replyText.trim();
    if (!trimmed || !session) return;
    const reply: Reply = {
      id: `reply-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      author:
        session.user?.name ??
        (session.user?.email ? session.user.email.slice(0, 8) + "..." : "Anonymous"),
      date: new Date().toISOString().slice(0, 10),
      content: trimmed,
    };
    addReply(reply);
    setReplyText("");
  };

  return (
    <div className="mt-4 border-t border-border/40 pt-4 space-y-4">
      {/* Existing replies */}
      {replies.length > 0 && (
        <div className="space-y-3">
          {replies.map((reply) => (
            <div
              key={reply.id}
              className="rounded-lg bg-muted/30 px-4 py-3 text-sm"
            >
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1.5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1 min-w-0">
                  <User className="h-3 w-3 shrink-0" aria-hidden="true" />
                  <span className="font-mono truncate">{reply.author}</span>
                </span>
                <span className="flex items-center gap-1 shrink-0">
                  <Clock className="h-3 w-3" aria-hidden="true" />
                  {reply.date}
                </span>
              </div>
              <p className="whitespace-pre-wrap text-foreground/90">
                {reply.content}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Reply form */}
      {session ? (
        <div className="flex flex-col gap-2">
          <Textarea
            placeholder="Write a reply..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            rows={3}
            className="resize-none text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSubmit();
            }}
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!replyText.trim()}
              className="gap-2"
            >
              <Send className="h-3.5 w-3.5" aria-hidden="true" />
              Reply
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          <Link
            href="/auth/signin"
            className="text-primary underline underline-offset-2 hover:no-underline"
          >
            Sign in
          </Link>{" "}
          to reply.
        </p>
      )}
    </div>
  );
}

// ── ThreadCard ────────────────────────────────────────────────────────────────

function ThreadCard({
  thread,
  expanded,
  onToggle,
  session,
}: {
  thread: Thread;
  expanded: boolean;
  onToggle: () => void;
  session: ReturnType<typeof useSession>["data"];
}) {
  const t = useTranslations("community");
  const Icon = CATEGORY_ICONS[thread.category];

  return (
    <Card
      className={cn(
        "border-border/50 transition-all duration-200",
        expanded
          ? "border-primary/40 shadow-lg"
          : "card-hover hover:border-primary/30 hover:shadow-lg hover:scale-[1.01]"
      )}
    >
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start gap-3 sm:gap-4">
          {/* Category icon */}
          <div className="mt-0.5 hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/10 to-secondary/5">
            <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
          </div>

          <div className="min-w-0 flex-1">
            {/* Header row */}
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {thread.pinned && (
                  <Badge variant="secondary" className="shrink-0 text-xs">
                    {t("pinned")}
                  </Badge>
                )}
                <button
                  onClick={onToggle}
                  className="font-semibold leading-snug text-left hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded min-w-0"
                >
                  <span className="line-clamp-2">{thread.title}</span>
                </button>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="outline" className="text-xs capitalize hidden sm:inline-flex">
                  {t(`categories.${thread.category}`)}
                </Badge>
                <button
                  onClick={onToggle}
                  aria-label={expanded ? "Collapse thread" : "Expand thread"}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {expanded ? (
                    <ChevronUp className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            {/* Preview (collapsed) or full content (expanded) */}
            {expanded ? (
              <p className="mt-2 text-sm text-foreground/90 whitespace-pre-wrap">
                {thread.content ?? thread.preview}
              </p>
            ) : (
              <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
                {thread.preview}
              </p>
            )}

            {/* Tags */}
            {thread.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {thread.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-2 py-0.5 text-xs text-muted-foreground"
                  >
                    <Tag className="h-3 w-3" aria-hidden="true" />
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Meta */}
            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="font-mono">{thread.author}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                {thread.date}
              </span>
              <span className="flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
                {t("replies", { count: thread.replies })}
              </span>
            </div>

            {/* Reply section (only when expanded) */}
            {expanded && (
              <ReplySection threadId={thread.id} session={session} />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── NewThreadDialog ────────────────────────────────────────────────────────────

interface NewThreadDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (thread: Thread) => void;
  session: ReturnType<typeof useSession>["data"];
}

function NewThreadDialog({
  open,
  onClose,
  onSubmit,
  session,
}: NewThreadDialogProps) {
  const t = useTranslations("community");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Category>("general");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setTitle("");
    setCategory("general");
    setContent("");
    setTags("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = () => {
    if (!session || !title.trim() || !content.trim()) return;
    setSubmitting(true);

    const author =
      session.user?.name ??
      (session.user?.email ? session.user.email.slice(0, 8) + "..." : "Anonymous");

    const parsedTags = tags
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    const thread: Thread = {
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: title.trim(),
      author,
      date: new Date().toISOString().slice(0, 10),
      replies: 0,
      category,
      tags: parsedTags,
      preview: content.trim().slice(0, 200),
      content: content.trim(),
    };

    onSubmit(thread);
    setSubmitting(false);
    reset();
    onClose();
  };

  const canSubmit = !!session && title.trim().length > 0 && content.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Start a New Thread</DialogTitle>
        </DialogHeader>

        {!session ? (
          <div className="py-6 text-center space-y-3">
            <p className="text-muted-foreground">
              {t("signInToPostDesc")}
            </p>
            <Link href="/auth/signin" onClick={handleClose}>
              <Button>{t("signInToPost")}</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="thread-title">
                Title
              </label>
              <Input
                id="thread-title"
                placeholder="What's your question or topic?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
              />
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="thread-category">
                Category
              </label>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as Category)}
              >
                <SelectTrigger id="thread-category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General Discussion</SelectItem>
                  <SelectItem value="help">Help &amp; Support</SelectItem>
                  <SelectItem value="showntell">Show &amp; Tell</SelectItem>
                  <SelectItem value="resources">Resources</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Content */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="thread-content">
                Content
              </label>
              <Textarea
                id="thread-content"
                placeholder="Share details, code snippets, questions, or links..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                className="resize-none"
              />
            </div>

            {/* Tags */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="thread-tags">
                Tags{" "}
                <span className="text-muted-foreground font-normal">
                  (comma separated)
                </span>
              </label>
              <Input
                id="thread-tags"
                placeholder="anchor, pda, token-2022"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>
          </div>
        )}

        {session && (
          <DialogFooter>
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
              className="gap-2"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Post Thread
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function Community() {
  const t = useTranslations("community");
  const { data: session } = useSession();
  const { allThreads, addThread } = useCommunityThreads();

  const [activeCategory, setActiveCategory] = useState<Category | "all">("all");
  const [search, setSearch] = useState("");
  const [expandedThreadId, setExpandedThreadId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const categories: Array<{ key: Category | "all"; icon: typeof MessageSquare }> = [
    { key: "all", icon: MessageSquare },
    { key: "general", icon: TrendingUp },
    { key: "help", icon: HelpCircle },
    { key: "showntell", icon: Lightbulb },
    { key: "resources", icon: BookMarked },
  ];

  const filteredThreads = useMemo(() => {
    return allThreads.filter((thread) => {
      const matchCategory =
        activeCategory === "all" || thread.category === activeCategory;
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        thread.title.toLowerCase().includes(q) ||
        thread.preview.toLowerCase().includes(q) ||
        thread.tags.some((tag) => tag.toLowerCase().includes(q));
      return matchCategory && matchSearch;
    });
  }, [allThreads, activeCategory, search]);

  const handleToggleThread = (id: string) => {
    setExpandedThreadId((prev) => (prev === id ? null : id));
  };

  const handleNewThread = () => {
    setDialogOpen(true);
  };

  const handleThreadSubmit = (thread: Thread) => {
    addThread(thread);
    setExpandedThreadId(thread.id);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Page header */}
      <div className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t("title")}</h1>
            <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
          </div>

          {/* New thread button */}
          {session ? (
            <Button
              className="shrink-0 gap-2"
              onClick={handleNewThread}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t("newThread")}
            </Button>
          ) : (
            <Button
              variant="outline"
              className="shrink-0 gap-2"
              onClick={handleNewThread}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t("signInToPost")}
            </Button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          placeholder={t("searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
          aria-label={t("searchPlaceholder")}
        />
      </div>

      {/* Category tabs */}
      <div
        className="mb-6 flex flex-wrap gap-2"
        role="tablist"
        aria-label={t("filterByCategory")}
      >
        {categories.map(({ key, icon: Icon }) => (
          <button
            key={key}
            role="tab"
            aria-selected={activeCategory === key}
            onClick={() => setActiveCategory(key)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
              activeCategory === key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border/60 bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
            )}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            {key === "all" ? t("allCategories") : t(`categories.${key}`)}
          </button>
        ))}
      </div>

      {/* Thread count */}
      <p className="mb-4 text-sm text-muted-foreground">
        {t("threadCount", { count: filteredThreads.length })}
      </p>

      {/* Threads list */}
      {filteredThreads.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-16 text-center"
          aria-live="polite"
        >
          <div className="rounded-full bg-muted p-6 mb-4">
            <MessageSquare className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
          </div>
          <h3 className="text-lg font-semibold mb-2">{t("noThreads")}</h3>
          <p className="text-muted-foreground max-w-md mb-6">
            {t("noThreadsDescription")}
          </p>
          {session && (
            <Button className="gap-2" onClick={handleNewThread}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t("newThread")}
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3" role="list" aria-label={t("threadList")}>
          {filteredThreads.map((thread) => (
            <div key={thread.id} role="listitem">
              <ThreadCard
                thread={thread}
                expanded={expandedThreadId === thread.id}
                onToggle={() => handleToggleThread(thread.id)}
                session={session}
              />
            </div>
          ))}
        </div>
      )}

      {/* New Thread Dialog */}
      <NewThreadDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleThreadSubmit}
        session={session}
      />
    </div>
  );
}
