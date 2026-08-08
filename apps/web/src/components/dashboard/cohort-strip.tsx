"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { UsersThree, ArrowRight } from "@phosphor-icons/react";
import type { CohortLeague } from "@superteam-lms/types";
import { CohortRow } from "@/components/leaderboard/cohort-row";

interface CohortStripProps {
  /** Authenticated user id, or null before auth resolves. */
  userId: string | null;
}

/** Localized league tier name (1-based), clamped to the four seeded tiers. */
function tierName(t: (k: string) => string, tier: number): string {
  const clamped = Math.min(Math.max(tier, 1), 4);
  return t(`leagueTier${clamped}`);
}

/**
 * Dashboard "you ±3" league strip (LX-B9b). An additive slot that fetches the
 * viewer's nearby-rank window (server-derived over snapshot scores) and deep
 * links into the leaderboard's League tab. Renders nothing until there is a
 * cohort with at least one neighbor — a solo strip is not a league, and (per
 * LX-B13) nothing about it should read as a hero rank metric.
 */
export function CohortStrip({ userId }: CohortStripProps) {
  const t = useTranslations("gamification");
  const locale = useLocale();
  const [league, setLeague] = useState<CohortLeague | null>(null);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/leaderboard/cohort?window=strip");
        if (!res.ok) return;
        const { league: data } = (await res.json()) as {
          league: CohortLeague | null;
        };
        if (active) setLeague(data);
      } catch {
        // Non-critical dashboard surface — stay hidden on failure.
      }
    })();
    return () => {
      active = false;
    };
  }, [userId]);

  // Hidden until the viewer has been assigned a weekly cohort at all.
  if (!league) return null;

  // Solo cohort — quiet waiting state (LX-B13: never a hero rank metric).
  if (league.entries.length < 2) {
    return (
      <section aria-label={t("cohortStripAria")}>
        <h2 className="mb-4 font-display text-lg font-black tracking-[-0.25px]">
          {t("cohortStripTitle")}
        </h2>
        <div className="rounded-xl border border-border bg-card p-4 shadow-card">
          <div className="flex items-center gap-3">
            <span
              className="bg-primary-dim flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-primary"
              aria-hidden="true"
            >
              <UsersThree size={18} weight="fill" />
            </span>
            <p className="text-[13px] font-semibold text-text-2">
              {tierName(t, league.tier)}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section aria-label={t("cohortStripAria")}>
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="font-display text-lg font-black tracking-[-0.25px]">
          {t("cohortStripTitle")}
        </h2>
        <Link
          href={`/${locale}/leaderboard`}
          className="flex shrink-0 items-center gap-1.5 font-display text-sm font-extrabold text-primary transition-transform duration-200 hover:translate-x-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <span className="hidden sm:inline">{t("cohortViewAll")}</span>
          <ArrowRight size={15} weight="bold" aria-hidden="true" />
        </Link>
      </div>
      <div className="rounded-xl border border-border bg-card p-4 shadow-card">
        <p className="mb-2.5 truncate text-[13px] font-semibold text-text-2">
          {tierName(t, league.tier)}
        </p>
        <div className="lb-list lb-list-compact lb-list-mini">
          {league.entries.map((entry, i) => (
            <CohortRow
              key={entry.rank}
              entry={entry}
              style={{ "--i": i } as React.CSSProperties}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
