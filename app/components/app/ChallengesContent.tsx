"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChallenges } from "@/hooks";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Loader2,
  Search,
  Sparkles,
  Target,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useMemo, useState } from "react";

export function ChallengesContent() {
  const t = useTranslations("common");
  const { publicKey } = useWallet();
  const wallet = publicKey?.toBase58();
  const { data, isLoading, error } = useChallenges(wallet);

  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<number | null>(null);

  const challenges = data?.challenges ?? [];
  const day = data?.day ?? "";

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return challenges;
    return challenges.filter((ch) => {
      const inTitle = ch.title.toLowerCase().includes(q);
      const inDesc = (ch.description ?? "").toLowerCase().includes(q);
      return inTitle || inDesc;
    });
  }, [challenges, search]);

  const active = filtered.filter((c) => !c.completed);
  const completed = filtered.filter((c) => c.completed);

  const hasAny = filtered.length > 0;

  const renderSection = (
    items: typeof challenges,
    label: string,
    emptyText: string
  ) => {
    if (!items.length) {
      return (
        <div className="rounded-2xl border-2 border-dashed border-border/60 bg-card/40 p-4 text-center">
          <p className="font-game text-sm text-muted-foreground">{emptyText}</p>
        </div>
      );
    }

    return (
      <ul className="space-y-3">
        {items.map((ch) => {
          const isOpen = openId === ch.id;
          return (
            <li
              key={ch.id}
              className="rounded-2xl border-4 border-border bg-card overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setOpenId((prev) => (prev === ch.id ? null : ch.id))}
                className="w-full flex items-center gap-3 px-4 py-3 sm:px-5 sm:py-4"
              >
                <span className="shrink-0 text-muted-foreground">
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </span>
                <div className="min-w-0 flex-1 text-left">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-game text-lg sm:text-xl truncate">
                      {ch.title}
                    </span>
                    {ch.completed && (
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
                    )}
                    {ch.xpReward > 0 && (
                      <span className="font-game text-xs sm:text-sm text-yellow-400 inline-flex items-center gap-1">
                        <Sparkles className="h-4 w-4" />
                        {ch.xpReward} XP
                      </span>
                    )}
                  </div>
                  {ch.description && (
                    <p className="font-game text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      {ch.description}
                    </p>
                  )}
                </div>
              </button>
              {isOpen && (
                <div className="border-t border-border/70 px-4 py-3 sm:px-5 sm:py-4 space-y-2">
                  {ch.description && (
                    <p className="font-game text-sm text-muted-foreground">
                      {ch.description}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-game text-xs text-muted-foreground flex items-center gap-2">
                      <span>
                        {ch.type === "daily"
                          ? "Daily challenge"
                          : ch.type === "seasonal"
                          ? "Seasonal challenge"
                          : ch.type === "sponsored"
                          ? "Sponsored challenge"
                          : ch.type}
                      </span>
                      {ch.type === "sponsored" && (
                        <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide text-yellow-400 border-yellow-400/60">
                          Sponsored
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {ch.completed && (
                        <span className="font-game text-xs text-green-600 dark:text-green-400">
                          Already completed
                        </span>
                      )}
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="font-game"
                      >
                        <Link href={`/challenges/${ch.slug}`}>Open challenge</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/20 rounded-full px-4 sm:px-5 py-2 mb-4 sm:mb-6">
          <Target className="h-4 w-4 text-yellow-400 shrink-0" />
          <span className="font-game text-base sm:text-lg text-yellow-400">
            {t("challenges")}
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-game mb-2 sm:mb-3 px-2">
          Bite-sized <span className="text-yellow-400">Challenges</span>
        </h1>
        <p className="font-game text-lg sm:text-xl text-muted-foreground mb-2 px-2">
          Complete daily and seasonal challenges to earn XP.
        </p>
        {day && (
          <p className="font-game text-sm text-muted-foreground">
            Today: {day}
          </p>
        )}
      </div>

      {!wallet && (
        <div className="rounded-2xl border-4 border-border bg-card p-6 text-center">
          <p className="font-game text-muted-foreground mb-4">
            Connect your wallet to see challenges.
          </p>
          <Button asChild variant="pixel" className="font-game">
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
        </div>
      )}

      {wallet && (
        <div className="space-y-4">
          <div className="relative max-w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search challenges..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 font-game"
            />
          </div>

          {isLoading && (
            <div className="flex items-center justify-center gap-2 py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="font-game text-muted-foreground">
                Loading challenges…
              </span>
            </div>
          )}

          {error && !isLoading && (
            <div className="rounded-2xl border-4 border-border bg-card p-6 text-center">
              <p className="font-game text-destructive">
                {(error as Error).message}
              </p>
              <Button asChild variant="outline" className="font-game mt-4">
                <Link href="/courses">Browse courses</Link>
              </Button>
            </div>
          )}

          {!isLoading && !error && !hasAny && (
            <div className="rounded-2xl border-4 border-border bg-card p-8 text-center">
              <p className="font-game text-muted-foreground mb-4">
                No challenges for today. Check back later or join a seasonal event.
              </p>
              <Button asChild variant="outline" className="font-game">
                <Link href="/courses">Browse courses</Link>
              </Button>
            </div>
          )}

          {!isLoading && !error && hasAny && (
            <div className="space-y-5">
              <div className="space-y-2">
                <h2 className="font-game text-lg sm:text-xl">
                  Active today
                </h2>
                {renderSection(
                  active,
                  "Active today",
                  "No active challenges. You might have completed them all."
                )}
              </div>

              <div className="space-y-2 text-md">
                <h2 className="font-game text-xl">Completed</h2>
                {renderSection(
                  completed,
                  "Completed",
                  "You haven't completed any challenges yet."
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
