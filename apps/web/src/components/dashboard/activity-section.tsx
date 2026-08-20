"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  BookOpen,
  CaretLeft,
  CaretRight,
  ChatCircle,
  Lightning,
  Medal,
  Scroll,
  GraduationCap,
  ArrowSquareOut,
} from "@phosphor-icons/react";
import type { ActivityItem } from "@/lib/dashboard/types";

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
              const iconMap = {
                lesson: Lightning,
                challenge: Lightning,
                course_complete: GraduationCap,
                achievement: Medal,
                certificate: Scroll,
                enrollment: BookOpen,
                community: ChatCircle,
                xp_other: Lightning,
              };
              const ActivityIcon = iconMap[activity.type] ?? Lightning;

              const inner = (
                <>
                  <div className="act-left">
                    <div className={`act-icon ${activity.type}`}>
                      <ActivityIcon
                        size={16}
                        weight="duotone"
                        aria-hidden="true"
                      />
                    </div>
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
