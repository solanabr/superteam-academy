"use client";

import { useState, useEffect, useRef, useCallback, useMemo, startTransition } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { Search, BookOpen, FileText, Code, Layout } from "lucide-react";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { cn } from "@/lib/utils";

interface SearchItem {
  title: string;
  category: "page" | "course" | "lesson" | "challenge";
  href: string;
  keywords: string[];
}

const SEARCH_INDEX: SearchItem[] = [
  // Pages
  { title: "Dashboard", category: "page", href: "/dashboard", keywords: ["home", "overview", "progress", "xp", "level"] },
  { title: "Courses", category: "page", href: "/courses", keywords: ["browse", "catalog", "learn", "enroll"] },
  { title: "Leaderboard", category: "page", href: "/leaderboard", keywords: ["ranking", "top", "xp", "score"] },
  { title: "Community", category: "page", href: "/community", keywords: ["forum", "discussion", "threads", "help"] },
  { title: "Profile", category: "page", href: "/profile", keywords: ["account", "bio", "credentials", "badges"] },
  { title: "Settings", category: "page", href: "/settings", keywords: ["preferences", "language", "theme", "notifications"] },
  { title: "Certificates", category: "page", href: "/profile", keywords: ["nft", "credential", "soulbound", "achievement"] },

  // Courses
  {
    title: "Solana Fundamentals",
    category: "course",
    href: "/courses",
    keywords: ["solana", "basics", "accounts", "transactions", "programs", "beginner"],
  },
  {
    title: "Anchor Development",
    category: "course",
    href: "/courses",
    keywords: ["anchor", "framework", "idl", "rust", "intermediate", "program"],
  },

  // Lessons
  {
    title: "Introduction to Solana",
    category: "lesson",
    href: "/courses",
    keywords: ["solana", "intro", "blockchain", "web3", "basics"],
  },
  {
    title: "Accounts and Programs",
    category: "lesson",
    href: "/courses",
    keywords: ["accounts", "programs", "pda", "on-chain", "data"],
  },
  {
    title: "Transactions and Instructions",
    category: "lesson",
    href: "/courses",
    keywords: ["transactions", "instructions", "signing", "fees"],
  },
  {
    title: "Token-2022 and NFTs",
    category: "lesson",
    href: "/courses",
    keywords: ["token", "nft", "mint", "metadata", "soulbound"],
  },
  {
    title: "Writing Your First Anchor Program",
    category: "lesson",
    href: "/courses",
    keywords: ["anchor", "program", "rust", "first", "hello world"],
  },
  {
    title: "PDAs and Cross-Program Invocations",
    category: "lesson",
    href: "/courses",
    keywords: ["pda", "cpi", "program", "address", "derived"],
  },

  // Challenges
  {
    title: "Hello World on Solana",
    category: "challenge",
    href: "/courses",
    keywords: ["hello", "world", "beginner", "first", "program"],
  },
  {
    title: "Build a Token Counter",
    category: "challenge",
    href: "/courses",
    keywords: ["token", "counter", "state", "account", "beginner"],
  },
  {
    title: "Implement a Voting Program",
    category: "challenge",
    href: "/courses",
    keywords: ["vote", "voting", "governance", "intermediate"],
  },
  {
    title: "Create a Soulbound NFT",
    category: "challenge",
    href: "/courses",
    keywords: ["nft", "soulbound", "metaplex", "credential", "advanced"],
  },
];

const CATEGORY_ICONS: Record<SearchItem["category"], React.ComponentType<{ className?: string }>> = {
  page: Layout,
  course: BookOpen,
  lesson: FileText,
  challenge: Code,
};

function fuzzyMatch(query: string, item: SearchItem): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  return (
    item.title.toLowerCase().includes(q) ||
    item.keywords.some((k) => k.toLowerCase().includes(q)) ||
    item.category.toLowerCase().includes(q)
  );
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const t = useTranslations("search");
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    if (!query.trim()) return SEARCH_INDEX;
    return SEARCH_INDEX.filter((item) => fuzzyMatch(query, item));
  }, [query]);

  // Group results by category
  const grouped = useMemo(() => {
    const groups: Record<string, SearchItem[]> = {};
    for (const item of results) {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category]!.push(item);
    }
    return groups;
  }, [results]);

  // Flat ordered list for keyboard navigation
  const flat = useMemo(() => results, [results]);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      startTransition(() => {
        setQuery("");
        setActiveIndex(0);
      });
      // Focus input after animation frame
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // Keep activeIndex in bounds when results change
  useEffect(() => {
    startTransition(() => {
      setActiveIndex(0);
    });
  }, [query]);

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-active="true"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const navigate = useCallback(
    (item: SearchItem) => {
      onOpenChange(false);
      router.push(item.href);
    },
    [router, onOpenChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, flat.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const item = flat[activeIndex];
        if (item) navigate(item);
      }
    },
    [flat, activeIndex, navigate]
  );

  const categoryLabel: Record<SearchItem["category"], string> = {
    page: t("pages"),
    course: t("courses"),
    lesson: t("lessons"),
    challenge: t("challenges"),
  };

  const CATEGORY_ORDER: SearchItem["category"][] = ["page", "course", "lesson", "challenge"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl gap-0 overflow-hidden p-0 top-[20%] translate-y-0"
        closeLabel="Close search"
        aria-label="Command palette"
      >
        {/* Visually hidden title for accessibility */}
        <DialogTitle className="sr-only">Search</DialogTitle>

        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <input
            ref={inputRef}
            role="combobox"
            aria-expanded={true}
            aria-autocomplete="list"
            aria-controls="command-palette-list"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            placeholder={t("placeholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <kbd className="hidden sm:inline-flex h-5 items-center rounded border border-border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div
          id="command-palette-list"
          role="listbox"
          ref={listRef}
          className="max-h-[60vh] overflow-y-auto overscroll-contain py-2"
        >
          {results.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">{t("noResults")}</p>
          ) : (
            CATEGORY_ORDER.map((cat) => {
              const items = grouped[cat];
              if (!items?.length) return null;
              return (
                <div key={cat}>
                  <div className="px-3 py-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {categoryLabel[cat]}
                    </span>
                  </div>
                  {items.map((item) => {
                    const Icon = CATEGORY_ICONS[item.category];
                    const idx = flat.indexOf(item);
                    const isActive = idx === activeIndex;
                    return (
                      <button
                        key={`${item.category}-${item.title}`}
                        role="option"
                        aria-selected={isActive}
                        data-active={isActive}
                        className={cn(
                          "flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors",
                          isActive
                            ? "bg-accent text-accent-foreground"
                            : "text-foreground hover:bg-accent/50 hover:text-accent-foreground"
                        )}
                        onMouseEnter={() => setActiveIndex(idx)}
                        onClick={() => navigate(item)}
                      >
                        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                        <span className="flex-1 truncate">{item.title}</span>
                        <span className="hidden sm:block rounded-full border border-border/60 bg-muted/60 px-1.5 py-0.5 text-[10px] text-muted-foreground capitalize">
                          {categoryLabel[cat]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Drop this in the layout to register Cmd+K and render the palette globally.
 */
export function GlobalCommandPalette() {
  const [open, setOpen] = useState(false);

  const shortcuts = useMemo(
    () => [
      {
        key: "k",
        ctrl: true,
        description: "Open search",
        handler: () => setOpen(true),
        // Allow firing even when typing so Cmd+K in an input opens the palette
        skipWhenTyping: false,
      },
    ],
    []
  );

  useKeyboardShortcuts(shortcuts);

  return <CommandPalette open={open} onOpenChange={setOpen} />;
}
