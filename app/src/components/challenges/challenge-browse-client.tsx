"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Search, Loader2, X, Clock, Zap, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { cn } from "@/lib/utils";
import type { DailyChallenge } from "@/lib/daily-challenges";

// ── Color maps ───────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<DailyChallenge["category"], string> = {
  rust: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  anchor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  solana: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  tokens: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  defi: "bg-green-500/10 text-green-400 border-green-500/20",
};

const CATEGORY_ACCENT: Record<DailyChallenge["category"], string> = {
  rust: "border-orange-500/30 bg-orange-500/5",
  anchor: "border-purple-500/30 bg-purple-500/5",
  solana: "border-blue-500/30 bg-blue-500/5",
  tokens: "border-yellow-500/30 bg-yellow-500/5",
  defi: "border-green-500/30 bg-green-500/5",
};

const CATEGORY_TEXT: Record<DailyChallenge["category"], string> = {
  rust: "text-orange-400",
  anchor: "text-purple-400",
  solana: "text-blue-400",
  tokens: "text-yellow-400",
  defi: "text-green-400",
};

const DIFFICULTY_COLORS: Record<DailyChallenge["difficulty"], string> = {
  beginner: "text-emerald-400",
  intermediate: "text-yellow-400",
  advanced: "text-red-400",
};

const DIFFICULTY_LABELS: Record<DailyChallenge["difficulty"], string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

const CATEGORY_LABELS: Record<DailyChallenge["category"], string> = {
  solana: "Solana",
  defi: "DeFi",
  tokens: "NFT & Tokens",
  anchor: "Anchor",
  rust: "Rust",
};

type Sort = "default" | "xp" | "difficulty";

// ── Filter pill ──────────────────────────────────────────────────────────────

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

// ── Props ────────────────────────────────────────────────────────────────────

interface ChallengeBrowseClientProps {
  challenges: DailyChallenge[];
  labels: {
    browseTitle: string;
    browseSubtitle: string;
    searchChallenges: string;
    filters: string;
    nChallenges: string;
    category: string;
    difficulty: string;
    language: string;
    sortBy: string;
    sortDefault: string;
    sortXpHigh: string;
    sortDifficulty: string;
    xpReward: string;
    estTime: string;
    backToChallenges: string;
  };
}

// ── Component ────────────────────────────────────────────────────────────────

export function ChallengeBrowseClient({
  challenges,
  labels,
}: ChallengeBrowseClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [debouncedSearch, isSearchPending] = useDebounce(search, 300);

  const selectedCategory = searchParams.get("category") || "all";
  const selectedDifficulty = searchParams.get("difficulty") || "all";
  const selectedLanguage = searchParams.get("language") || "all";
  const sort = (searchParams.get("sort") as Sort) || "default";

  // Sync debounced search to URL
  useEffect(() => {
    const currentQ = searchParams.get("q") || "";
    if (debouncedSearch !== currentQ) {
      const params = new URLSearchParams(searchParams.toString());
      if (debouncedSearch) params.set("q", debouncedSearch);
      else params.delete("q");
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }
  }, [debouncedSearch, searchParams, router, pathname]);

  // ⌘K focuses search
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        document.getElementById("challenge-search")?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "" || value === "all")
          params.delete(key);
        else params.set(key, value);
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [searchParams, router, pathname],
  );

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of challenges) {
      counts[c.category] = (counts[c.category] || 0) + 1;
    }
    return counts;
  }, [challenges]);

  // Filtered + sorted challenges
  const filtered = useMemo(() => {
    let result = challenges.filter((c) => {
      const q = debouncedSearch.toLowerCase();
      const matchesSearch =
        !debouncedSearch ||
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.tags.some((tag) => tag.toLowerCase().includes(q));

      const matchesCategory =
        selectedCategory === "all" || c.category === selectedCategory;
      const matchesDifficulty =
        selectedDifficulty === "all" || c.difficulty === selectedDifficulty;
      const matchesLanguage =
        selectedLanguage === "all" || c.language === selectedLanguage;

      return (
        matchesSearch && matchesCategory && matchesDifficulty && matchesLanguage
      );
    });

    if (sort === "xp") {
      result = [...result].sort((a, b) => b.xpReward - a.xpReward);
    } else if (sort === "difficulty") {
      const order = { beginner: 0, intermediate: 1, advanced: 2 };
      result = [...result].sort(
        (a, b) => order[a.difficulty] - order[b.difficulty],
      );
    }

    return result;
  }, [
    challenges,
    debouncedSearch,
    selectedCategory,
    selectedDifficulty,
    selectedLanguage,
    sort,
  ]);

  const hasActiveFilters =
    selectedCategory !== "all" ||
    selectedDifficulty !== "all" ||
    selectedLanguage !== "all" ||
    !!search;

  const categories: DailyChallenge["category"][] = [
    "solana",
    "defi",
    "tokens",
    "anchor",
    "rust",
  ];
  const difficulties: DailyChallenge["difficulty"][] = [
    "beginner",
    "intermediate",
    "advanced",
  ];
  const languages: DailyChallenge["language"][] = ["rust", "typescript"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/challenges"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-border transition-colors hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{labels.browseTitle}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {labels.browseSubtitle}
          </p>
        </div>
      </div>

      {/* Category stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() =>
              updateParams({ category: selectedCategory === cat ? null : cat })
            }
            className={cn(
              "rounded-xl border p-4 text-center transition-all hover:scale-[1.02]",
              selectedCategory === cat
                ? "ring-2 ring-primary " + CATEGORY_ACCENT[cat]
                : "border-border bg-card hover:border-foreground/20",
            )}
          >
            <div className={cn("text-2xl font-bold", CATEGORY_TEXT[cat])}>
              {categoryCounts[cat] || 0}
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              {CATEGORY_LABELS[cat]}
            </div>
          </button>
        ))}
      </div>

      {/* Search bar */}
      <div className="relative">
        {isSearchPending ? (
          <Loader2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-primary" />
        ) : (
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        )}
        <input
          id="challenge-search"
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={labels.searchChallenges}
          className="h-11 w-full rounded-xl border border-border bg-card pl-10 pr-16 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        {search ? (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        ) : (
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:flex">
            ⌘ K
          </kbd>
        )}
      </div>

      {/* Sidebar + Grid */}
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        {/* Left sidebar filters */}
        <aside className="w-full shrink-0 lg:w-52">
          <div className="sticky top-24 space-y-6">
            {/* Result count */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{labels.filters}</span>
              <Badge variant="secondary" className="text-xs">
                {filtered.length} Challenges
              </Badge>
            </div>

            {/* Category */}
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {labels.category}
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {categories.map((cat) => (
                  <FilterPill
                    key={cat}
                    active={selectedCategory === cat}
                    onClick={() =>
                      updateParams({
                        category: selectedCategory === cat ? null : cat,
                      })
                    }
                  >
                    {CATEGORY_LABELS[cat]}
                  </FilterPill>
                ))}
              </div>
            </div>

            {/* Difficulty */}
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {labels.difficulty}
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {difficulties.map((d) => (
                  <FilterPill
                    key={d}
                    active={selectedDifficulty === d}
                    onClick={() =>
                      updateParams({
                        difficulty: selectedDifficulty === d ? null : d,
                      })
                    }
                  >
                    {DIFFICULTY_LABELS[d]}
                  </FilterPill>
                ))}
              </div>
            </div>

            {/* Language */}
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {labels.language}
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {languages.map((l) => (
                  <FilterPill
                    key={l}
                    active={selectedLanguage === l}
                    onClick={() =>
                      updateParams({
                        language: selectedLanguage === l ? null : l,
                      })
                    }
                  >
                    {l === "rust" ? "Rust" : "TypeScript"}
                  </FilterPill>
                ))}
              </div>
            </div>

            {/* Sort */}
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {labels.sortBy}
              </h3>
              <select
                value={sort}
                onChange={(e) =>
                  updateParams({
                    sort: e.target.value === "default" ? null : e.target.value,
                  })
                }
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="default">{labels.sortDefault}</option>
                <option value="xp">{labels.sortXpHigh}</option>
                <option value="difficulty">{labels.sortDifficulty}</option>
              </select>
            </div>

            {/* Clear filters */}
            {hasActiveFilters && (
              <button
                onClick={() => {
                  setSearch("");
                  updateParams({
                    category: null,
                    difficulty: null,
                    language: null,
                    sort: null,
                    q: null,
                  });
                }}
                className="flex w-full items-center justify-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-destructive/50 hover:text-destructive"
              >
                <X className="h-3 w-3" />
                Clear Filters
              </button>
            )}
          </div>
        </aside>

        {/* Challenge grid */}
        <div className="flex-1 min-w-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
              <Search className="mb-3 h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                No challenges match your filters.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((challenge) => (
                <ChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  labels={labels}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Challenge Card ───────────────────────────────────────────────────────────

function ChallengeCard({
  challenge,
  labels,
}: {
  challenge: DailyChallenge;
  labels: { xpReward: string; estTime: string };
}) {
  return (
    <Link
      href={`/challenges/today`}
      className="group relative flex flex-col rounded-xl border border-border bg-card p-4 transition-all hover:border-foreground/20 hover:shadow-lg hover:shadow-black/5"
    >
      {/* Top badges row */}
      <div className="mb-3 flex items-center gap-1.5">
        <Badge
          variant="outline"
          className={cn("text-[10px]", CATEGORY_COLORS[challenge.category])}
        >
          {CATEGORY_LABELS[challenge.category]}
        </Badge>
        <Badge variant="outline" className="text-[10px]">
          <span className={DIFFICULTY_COLORS[challenge.difficulty]}>
            {DIFFICULTY_LABELS[challenge.difficulty]}
          </span>
        </Badge>
        <span className="ml-auto rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono uppercase text-muted-foreground">
          {challenge.language}
        </span>
      </div>

      {/* Title + description */}
      <h3 className="mb-1 font-semibold leading-tight group-hover:text-primary transition-colors">
        {challenge.title}
      </h3>
      <p className="mb-3 line-clamp-2 text-xs text-muted-foreground leading-relaxed">
        {challenge.description}
      </p>

      {/* Footer: XP + time */}
      <div className="mt-auto flex items-center gap-3 pt-2 border-t border-border/50">
        <span className="flex items-center gap-1 text-xs font-semibold text-yellow-400">
          <Zap className="h-3 w-3" />+{challenge.xpReward} {labels.xpReward}
        </span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />~{challenge.estimatedMinutes}m
        </span>
      </div>
    </Link>
  );
}
