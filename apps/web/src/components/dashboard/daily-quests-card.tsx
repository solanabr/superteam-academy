"use client";

import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import {
  BookOpen,
  Code,
  Lightning,
  Trophy,
  Scroll,
  CircleDashed,
  CheckCircle,
} from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";
import type { DailyQuest } from "@superteam-lms/types";
import { questHref } from "@/lib/gamification/quest-links";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------
   QUEST ICON MAP — maps content icon strings to Phosphor components
--------------------------------------------------------------- */
const QUEST_ICONS: Record<string, Icon> = {
  BookOpen,
  Code,
  Lightning,
  Trophy,
  Scroll,
};

function getQuestIcon(iconName: string): Icon {
  return QUEST_ICONS[iconName] ?? CircleDashed;
}

function getHoursUntilReset(resetTime: string): number {
  if (!resetTime) return 0;
  const diff = new Date(resetTime).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60)));
}

interface DailyQuestsCardProps {
  quests: DailyQuest[];
  questsResetTime: string;
}

/**
 * Daily Quests as a standalone rail card. Extracted from the identity panel
 * (where it shared the bottom row with the heatmap) so the dashboard's right
 * rail can carry the day's actionable surfaces together. Row anatomy (`dq-*`)
 * and the per-type deep-links (#572) are unchanged.
 */
export function DailyQuestsCard({
  quests,
  questsResetTime,
}: DailyQuestsCardProps) {
  const t = useTranslations("gamification");
  const tDash = useTranslations("dashboard");
  const locale = useLocale();

  if (quests.length === 0) return null;

  return (
    <section
      aria-label={tDash("dailyQuests")}
      className="rounded-xl border border-border bg-card p-4 shadow-card"
    >
      <div className="dash-quests-head mb-3">
        <span className="dash-quests-title">{tDash("dailyQuests")}</span>
        <span className="dash-quests-reset">
          {tDash("resetsIn", { hours: getHoursUntilReset(questsResetTime) })}
        </span>
      </div>

      {/* The rail shows the whole set — no drag-scroll viewport like the old
          panel slot needed; the list is three-ish rows tall. */}
      <div className="flex flex-col gap-2.5">
        {quests.map((quest) => {
          const IconComp = getQuestIcon(quest.icon);
          const href = questHref(quest.type, locale);
          const inner = (
            <>
              <div className="dq-icon">
                <IconComp size={16} weight="duotone" />
              </div>
              <div className="dq-info">
                <span className="dq-name">{quest.name}</span>
                <span className="dq-desc">{quest.description}</span>
              </div>
              <div className="dq-reward">
                <Lightning size={12} weight="fill" />+{quest.xpReward} {t("xp")}
              </div>
              {quest.completed ? (
                <div className="dq-check">
                  <CheckCircle size={18} weight="fill" />
                </div>
              ) : (
                <span className="dq-progress-lbl">
                  {quest.currentValue}/{quest.targetValue}
                </span>
              )}
            </>
          );
          const className = cn(
            "dq",
            quest.completed && "done",
            href && "dq-link"
          );
          return href ? (
            <Link key={quest.id} href={href} className={className}>
              {inner}
            </Link>
          ) : (
            <div key={quest.id} className={className}>
              {inner}
            </div>
          );
        })}
      </div>
    </section>
  );
}
