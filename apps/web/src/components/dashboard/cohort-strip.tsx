"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { ArrowRight } from "@phosphor-icons/react";
import type { CohortLeague } from "@superteam-lms/types";
import { scrollBehavior } from "@/lib/reduced-motion";
import { GlyphChip } from "@/components/gamification/glyph-chip";
import { CohortRow } from "@/components/leaderboard/cohort-row";

interface CohortStripProps {
  /** Server-derived "you ±3" league window, or null when unassigned. */
  league: CohortLeague | null;
}

/** Localized league tier name (1-based), clamped to the four seeded tiers. */
function tierName(t: (k: string) => string, tier: number): string {
  const clamped = Math.min(Math.max(tier, 1), 4);
  return t(`leagueTier${clamped}`);
}

/**
 * Dashboard "you ±3" league strip (LX-B9b). An additive slot rendering the
 * viewer's nearby-rank window (server-derived over snapshot scores by
 * `loadCohortStrip`, #1096) that deep links into the leaderboard's League tab.
 * Renders nothing until there is a cohort with at least one neighbor — a solo
 * strip is not a league, and (per LX-B13) nothing about it should read as a
 * hero rank metric.
 */
export function CohortStrip({ league }: CohortStripProps) {
  const t = useTranslations("gamification");
  const locale = useLocale();
  const listRef = useRef<HTMLDivElement>(null);

  /**
   * Bring the viewer's own row into the strip's window on mount.
   *
   * The window is "you ±3", but the list is capped and scrolls, so a viewer
   * near the bottom of their cohort opened the dashboard to a strip parked at
   * the top — it looked like the league "starts at 8" and their own row was
   * below the fold (owner, 21-08).
   *
   * Scrolls the CONTAINER, never the page: `scrollIntoView` would walk up the
   * ancestor chain and yank the whole dashboard on load.
   */
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;

    const me = list.querySelector<HTMLElement>(".lb-row.me");
    if (!me) return;

    const max = list.scrollHeight - list.clientHeight;
    if (max <= 0) return; // Everything already fits; nothing to bring into view.

    // Rect deltas rather than offsetTop: each row may sit inside a <Link>
    // wrapper, so the offsetParent chain is not the scroll container.
    const delta =
      me.getBoundingClientRect().top - list.getBoundingClientRect().top;
    const centered =
      list.scrollTop + delta - (list.clientHeight - me.offsetHeight) / 2;
    const top = Math.max(0, Math.min(centered, max));

    if (typeof list.scrollTo === "function") {
      list.scrollTo({ top, behavior: scrollBehavior() });
    } else {
      list.scrollTop = top;
    }
  }, [league]);

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
            {/* A league is a cohort of people, so it takes the community mark.
                The assigned state expresses league identity through the tier
                NAME alone and carries no colour of its own, so nothing here
                argued for a fill other than the community one. */}
            <GlyphChip glyph="◍" cat="community" size={24} />
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
        <div ref={listRef} className="lb-list lb-list-compact lb-list-mini">
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
