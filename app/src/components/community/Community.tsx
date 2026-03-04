"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Seed data ────────────────────────────────────────────────────────────────

type Category = "general" | "help" | "showntell" | "resources";

interface Thread {
  id: string;
  title: string;
  author: string; // truncated wallet or name
  date: string;
  replies: number;
  category: Category;
  tags: string[];
  preview: string;
  pinned?: boolean;
}

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
  },
];

// ── Category config ───────────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<Category, typeof MessageSquare> = {
  general: TrendingUp,
  help: HelpCircle,
  showntell: Lightbulb,
  resources: BookMarked,
};

// ── Subcomponents ─────────────────────────────────────────────────────────────

function ThreadCard({ thread }: { thread: Thread }) {
  const t = useTranslations("community");
  const Icon = CATEGORY_ICONS[thread.category];

  return (
    <Card className="card-hover group border-border/50 transition-all duration-200 hover:border-primary/30 hover:shadow-lg hover:scale-[1.01]">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {/* Category icon */}
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/10 to-secondary/5">
            <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
          </div>

          <div className="min-w-0 flex-1">
            {/* Header row */}
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                {thread.pinned && (
                  <Badge variant="secondary" className="shrink-0 text-xs">
                    {t("pinned")}
                  </Badge>
                )}
                <h3 className="font-semibold leading-snug group-hover:text-primary transition-colors">
                  {thread.title}
                </h3>
              </div>
              <Badge variant="outline" className="shrink-0 text-xs capitalize">
                {t(`categories.${thread.category}`)}
              </Badge>
            </div>

            {/* Preview */}
            <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
              {thread.preview}
            </p>

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
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function Community() {
  const t = useTranslations("community");
  const { data: session } = useSession();

  const [activeCategory, setActiveCategory] = useState<Category | "all">("all");
  const [search, setSearch] = useState("");

  const categories: Array<{ key: Category | "all"; icon: typeof MessageSquare }> = [
    { key: "all", icon: MessageSquare },
    { key: "general", icon: TrendingUp },
    { key: "help", icon: HelpCircle },
    { key: "showntell", icon: Lightbulb },
    { key: "resources", icon: BookMarked },
  ];

  const filteredThreads = useMemo(() => {
    return SEED_THREADS.filter((thread) => {
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
  }, [activeCategory, search]);

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
            <Button className="shrink-0 gap-2">
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t("newThread")}
            </Button>
          ) : (
            <Link href="/auth/signin">
              <Button variant="outline" className="shrink-0 gap-2">
                <Plus className="h-4 w-4" aria-hidden="true" />
                {t("signInToPost")}
              </Button>
            </Link>
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
        <div className="flex flex-col items-center justify-center py-16 text-center" aria-live="polite">
          <div className="rounded-full bg-muted p-6 mb-4">
            <MessageSquare className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
          </div>
          <h3 className="text-lg font-semibold mb-2">{t("noThreads")}</h3>
          <p className="text-muted-foreground max-w-md mb-6">{t("noThreadsDescription")}</p>
          {session && (
            <Button className="gap-2">
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t("newThread")}
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3" role="list" aria-label={t("threadList")}>
          {filteredThreads.map((thread) => (
            <div key={thread.id} role="listitem">
              <ThreadCard thread={thread} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
