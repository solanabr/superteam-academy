"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useAPIQuery } from "@/lib/api/useAPI";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ChallengeItem = {
  id: string;
  title: string;
  difficulty: string;
  xp_reward?: number;
  created_at?: string;
};

const difficulty_variant: Record<string, string> = {
  easy: "bg-green-100 text-green-900 border-green-300 dark:bg-green-950 dark:text-green-200 dark:border-green-800",
  medium: "bg-yellow-100 text-yellow-900 border-yellow-300 dark:bg-yellow-950 dark:text-yellow-200 dark:border-yellow-800",
  hard: "bg-orange-100 text-orange-900 border-orange-300 dark:bg-orange-950 dark:text-orange-200 dark:border-orange-800",
  hell: "bg-red-100 text-red-900 border-red-300 dark:bg-red-950 dark:text-red-200 dark:border-red-800",
};

type WebChallengesSectionProps = {
  /** When set, only show this many challenges (e.g. 6 for landing preview). Omit for full catalog. */
  maxItems?: number;
};

export default function WebChallengesSection({ maxItems }: WebChallengesSectionProps = {}): ReactNode {
  const t = useTranslations("challenges");
  const t_common = useTranslations("common");
  const [search, set_search] = useState("");

  const { data, isPending, error } = useAPIQuery<{ challenges: ChallengeItem[] }>({
    queryKey: ["challenges"],
    path: "/api/challenges",
  });
  const challenges = data?.challenges ?? [];

  const visible = useMemo(() => {
    let list = Array.isArray(challenges) ? challenges : [];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((c) => c.title?.toLowerCase().includes(q));
    }
    list = [...list].sort((a, b) => {
      const a_date = a.created_at ? new Date(a.created_at).getTime() : 0;
      const b_date = b.created_at ? new Date(b.created_at).getTime() : 0;
      return b_date - a_date;
    });
    return typeof maxItems === "number" ? list.slice(0, maxItems) : list;
  }, [challenges, search, maxItems]);

  return (
    <div className="container mx-auto space-y-6 px-4 py-12 md:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">{t("title")}</h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            {t("titleColumn")}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            placeholder={t_common("search")}
            value={search}
            onChange={(e) => set_search(e.target.value)}
            className="w-full max-w-xs rounded-none border-2 border-border"
          />
          <Link href="/leaderboard">
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-none border-2 border-border px-4 py-2 text-xs font-mono uppercase tracking-wide sm:w-auto"
            >
              Leaderboard
            </Button>
          </Link>
        </div>
      </div>

      {isPending && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-none border-2 border-border bg-muted/50"
              aria-hidden
            />
          ))}
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive">{error.message}</p>
      )}

      {!isPending && !error && visible.length === 0 && (
        <p className="mt-4 text-sm text-muted-foreground">{t("noChallenges")}</p>
      )}

      {!isPending && visible.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((challenge) => (
            <article
              key={challenge.id}
              className="flex h-full flex-col rounded-none border-2 border-border bg-card p-4 shadow-[3px_3px_0_0_hsl(var(--foreground)/0.12)]"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <h2 className="line-clamp-2 text-sm font-semibold text-foreground">
                  {challenge.title}
                </h2>
                <span
                  className={cn(
                    "ml-2 whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-mono font-semibold uppercase",
                    difficulty_variant[challenge.difficulty] ?? "bg-muted text-foreground border-border",
                  )}
                >
                  {t(challenge.difficulty as "easy" | "medium" | "hard" | "hell")}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {t("xpReward")}: <span className="font-semibold">{challenge.xp_reward ?? 0}</span>
              </p>
              {challenge.created_at && (
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {t("createdAt")}:{" "}
                  {new Date(challenge.created_at).toLocaleDateString()}
                </p>
              )}
              <div className="mt-4">
                <Link href={`/challenges/${challenge.id}`}>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full rounded-none border-2 border-border text-xs font-mono uppercase tracking-wide"
                  >
                    {t("startChallenge")}
                  </Button>
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}

      {typeof maxItems === "number" && (
        <div className="pt-4">
          <Link href="/challenges">
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-none border-2 border-border px-4 py-2 text-xs font-mono uppercase tracking-wide sm:w-auto"
            >
              {t("viewAll")}
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

