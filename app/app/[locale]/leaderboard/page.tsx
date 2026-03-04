import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { fetchLeaderboard, DUMMY_LEADERBOARD_ENTRIES } from "@/lib/leaderboard";
import { LeaderboardTable } from "@/components/leaderboard/leaderboard-table";
import { Skeleton } from "@/components/ui/skeleton";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("leaderboard");
  return {
    title: `${t("title")} | Superteam Academy`,
    description: t("description"),
  };
}

export default async function LeaderboardPage() {
  const t = await getTranslations("leaderboard");

  return (
    <main className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6">
      <header className="space-y-1">
        <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
          {t("title")}
        </h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          {t("description")}
        </p>
      </header>

      <Suspense fallback={<LeaderboardSkeleton />}>
        <LeaderboardContent formatXp={(xp) => t("xpAmount", { amount: xp })} />
      </Suspense>
    </main>
  );
}

function LeaderboardSkeleton() {
  return (
    <div className="mt-6 space-y-2">
      <Skeleton className="h-10 w-full" />
      {Array.from({ length: 10 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

async function LeaderboardContent({
  formatXp,
}: {
  formatXp: (xp: number) => string;
}) {
  const t = await getTranslations("leaderboard");
  let entries: Awaited<ReturnType<typeof fetchLeaderboard>>;
  let isDemo = false;
  try {
    entries = await fetchLeaderboard();
    if (entries.length === 0) {
      entries = DUMMY_LEADERBOARD_ENTRIES;
      isDemo = true;
    }
  } catch {
    entries = DUMMY_LEADERBOARD_ENTRIES;
    isDemo = true;
  }

  return (
    <div className="mt-6 space-y-2">
      {isDemo && (
        <p className="text-sm text-muted-foreground">{t("demoData")}</p>
      )}
      <div className="rounded-lg border border-border bg-card">
        <LeaderboardTable entries={entries} formatXp={formatXp} />
      </div>
    </div>
  );
}
