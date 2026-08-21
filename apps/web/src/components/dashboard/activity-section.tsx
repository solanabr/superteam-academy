"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  CaretLeft,
  CaretRight,
  Lightning,
  ArrowSquareOut,
} from "@phosphor-icons/react";
import type { ActivityItem } from "@/lib/dashboard/types";
import { GlyphChip } from "@/components/gamification/glyph-chip";
import type { PatchCategory } from "@/components/gamification/patch-look";

/* ---------------------------------------------------------------
   ACTIVITY CHIP MAP — activity type → glyph + patch category.

   Same 24px chip as the quest rows, so the dashboard has ONE icon object
   rather than a per-card treatment. Colour therefore comes from the standard
   `data-cat` fills; the two types that had bespoke tints moved to their
   nearest standard fill — certificate from purple to `onchain` (the Solana
   gradient, which is what a credential actually is), and community from sky
   to `community` orange, which xp_other shares.
--------------------------------------------------------------- */
interface ActivityChip {
  glyph: string;
  cat: PatchCategory;
}

const ACTIVITY_CHIPS: Record<string, ActivityChip> = {
  lesson: { glyph: "+", cat: "course" },
  challenge: { glyph: "</>", cat: "craft" },
  course_complete: { glyph: "★", cat: "course" },
  achievement: { glyph: "◎", cat: "reward" },
  certificate: { glyph: "⬡", cat: "onchain" },
  enrollment: { glyph: "▸", cat: "start" },
  community: { glyph: "◍", cat: "community" },
  xp_other: { glyph: "⚡", cat: "community" },
};

const FALLBACK_CHIP = ACTIVITY_CHIPS.xp_other!;

export function activityChip(type: string): ActivityChip {
  return ACTIVITY_CHIPS[type] ?? FALLBACK_CHIP;
}

const SOLANA_CLUSTER = process.env.NEXT_PUBLIC_SOLANA_NETWORK ?? "devnet";
function explorerTxUrl(sig: string): string {
  return SOLANA_CLUSTER === "mainnet-beta"
    ? `https://explorer.solana.com/tx/${sig}`
    : `https://explorer.solana.com/tx/${sig}?cluster=${SOLANA_CLUSTER}`;
}

interface ActivitySectionProps {
  /** Merged multi-source activity feed, sorted by time descending. */
  recentActivity: ActivityItem[];
}

/**
 * "Activity" dashboard section — paginated multi-source feed (lessons,
 * challenges, achievements, certificates, enrollments, community, XP) with
 * explorer deep links for on-chain items.
 *
 * Rework 21-08: the feed adopts the dashboard's row-card system (a bordered
 * card per row, no zebra striping) and the same 24px GlyphChip the quest rows
 * use. Two earlier passes — bare gutter marks, then a tint-washed tile — both
 * read as a treatment invented for this one card; the owner wanted the icon
 * object the rest of the dashboard already had. A fixed-size chip also answers
 * the "first row looks smaller" report: the Phosphor boxes it replaces sized
 * themselves around whichever glyph they held.
 */
export function ActivitySection({ recentActivity }: ActivitySectionProps) {
  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common");
  const tTime = useTranslations("timeAgo");
  const locale = useLocale();
  const [activityPage, setActivityPage] = useState(0);
  const ACTIVITY_PAGE_SIZE = 8;

  // Reset to page 1 when the activity list changes (e.g., after quest completion)
  const activityCount = recentActivity.length;
  useEffect(() => {
    setActivityPage(0);
  }, [activityCount]);

  const totalActivityPages = Math.ceil(activityCount / ACTIVITY_PAGE_SIZE);

  // Group paginated activity items by date for history-style browsing
  const activityPageItems = recentActivity.slice(
    activityPage * ACTIVITY_PAGE_SIZE,
    (activityPage + 1) * ACTIVITY_PAGE_SIZE
  );
  const todayDateStr = new Date().toISOString().split("T")[0]!;
  const yesterdayDateStr = new Date(Date.now() - 86400000)
    .toISOString()
    .split("T")[0]!;
  const activityDateGroups: {
    date: string;
    label: string;
    items: typeof activityPageItems;
  }[] = [];
  let lastGroupDate = "";
  for (const item of activityPageItems) {
    const dateStr = item.time.split("T")[0]!;
    if (dateStr !== lastGroupDate) {
      lastGroupDate = dateStr;
      let label: string;
      if (dateStr === todayDateStr) label = tTime("today");
      else if (dateStr === yesterdayDateStr) label = tTime("yesterday");
      else {
        const d = new Date(dateStr + "T00:00:00");
        label = d.toLocaleDateString(locale, {
          month: "short",
          day: "numeric",
        });
      }
      activityDateGroups.push({ date: dateStr, label, items: [] });
    }
    activityDateGroups[activityDateGroups.length - 1]!.items.push(item);
  }

  const formatTimeAgo = (isoDate: string): string => {
    const diffMs = Date.now() - new Date(isoDate).getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return tTime("justNow");
    if (diffHours < 24) return tTime("hours", { count: diffHours });
    return tTime("days", { count: Math.floor(diffHours / 24) });
  };

  return (
    <section className="act-section">
      <div className="act-section-head">
        <h2 className="act-section-title">{t("recentActivity")}</h2>
        {recentActivity.length > 0 && (
          <span className="act-section-count">{recentActivity.length}</span>
        )}
      </div>

      {recentActivity.length > 0 ? (
        <div className="act-panel">
          <div className="act-panel-amb" aria-hidden="true" />
          <div className="act-feed">
            {activityPageItems.map((activity) => {
              const chip = activityChip(activity.type);

              const inner = (
                <>
                  <div className="act-left">
                    <GlyphChip glyph={chip.glyph} cat={chip.cat} size={24} />
                    <span className="act-text">{activity.action}</span>
                  </div>
                  <div className="act-right">
                    {activity.xp > 0 && (
                      <span className="act-xp">+{activity.xp} XP</span>
                    )}
                    <span className="act-time">
                      {formatTimeAgo(activity.time)}
                    </span>
                    {activity.txSignature && (
                      <ArrowSquareOut
                        size={14}
                        className="act-tx"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                </>
              );

              return activity.txSignature ? (
                <a
                  key={`${activity.type}-${activity.time}`}
                  href={explorerTxUrl(activity.txSignature)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="act-row"
                >
                  {inner}
                </a>
              ) : (
                <div
                  key={`${activity.type}-${activity.time}`}
                  className="act-row"
                >
                  {inner}
                </div>
              );
            })}
          </div>
          {totalActivityPages > 1 && (
            <div className="act-pager">
              <button
                onClick={() => setActivityPage((p) => Math.max(0, p - 1))}
                disabled={activityPage === 0}
                className="act-pager-btn"
                aria-label={tCommon("previous")}
              >
                <CaretLeft size={12} weight="bold" />
              </button>
              <span className="act-pager-label">
                {activityPage + 1}/{totalActivityPages}
              </span>
              <button
                onClick={() =>
                  setActivityPage((p) =>
                    Math.min(totalActivityPages - 1, p + 1)
                  )
                }
                disabled={activityPage >= totalActivityPages - 1}
                className="act-pager-btn"
                aria-label={tCommon("next")}
              >
                <CaretRight size={12} weight="bold" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="act-empty">
          <Lightning
            size={40}
            weight="duotone"
            className="text-text-3"
            aria-hidden="true"
          />
          <p className="text-text-3">{t("noRecentActivity")}</p>
        </div>
      )}
    </section>
  );
}
