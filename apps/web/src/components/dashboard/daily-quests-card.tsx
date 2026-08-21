"use client";

import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { Lightning, CheckCircle } from "@phosphor-icons/react";
import * as Tooltip from "@radix-ui/react-tooltip";
import type { DailyQuest } from "@superteam-lms/types";
import { questHref } from "@/lib/gamification/quest-links";
import { cn } from "@/lib/utils";
import { GlyphChip } from "@/components/gamification/glyph-chip";
import type { PatchCategory } from "@/components/gamification/patch-look";

/* ---------------------------------------------------------------
   QUEST GLYPH MAP — content icon string → chip glyph + category.

   Keyed on the icon string the quest doc carries (not the quest type) so
   adding a quest doc still needs no code change, exactly as the Phosphor map
   it replaces did. Glyph choices are the owner's, approved 21-08.
--------------------------------------------------------------- */
interface QuestGlyph {
  glyph: string;
  cat: PatchCategory;
}

const QUEST_GLYPHS: Record<string, QuestGlyph> = {
  Code: { glyph: "</>", cat: "craft" }, // challenge
  BookOpen: { glyph: "▸", cat: "course" }, // a lesson
  Scroll: { glyph: "⬡", cat: "endurance" }, // a module
  Lightning: { glyph: "×3", cat: "course" }, // three lessons
  Trophy: { glyph: "∞", cat: "community" }, // login streak
};

const FALLBACK_GLYPH: QuestGlyph = { glyph: "•", cat: "course" };

/** A completed quest keeps its category but flips the glyph to a check. */
export function questGlyph(iconName: string, completed: boolean): QuestGlyph {
  const base = QUEST_GLYPHS[iconName] ?? FALLBACK_GLYPH;
  return completed ? { ...base, glyph: "✓" } : base;
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
 * and the per-type deep-links (#572) are unchanged; only the leading icon
 * changed, from a Phosphor glyph in a tinted box to a 28px GlyphChip.
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
    <section aria-label={tDash("dailyQuests")}>
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="font-display text-lg font-black tracking-[-0.25px]">
          {tDash("dailyQuests")}
        </h2>
        <span className="dash-quests-reset">
          {tDash("resetsIn", { hours: getHoursUntilReset(questsResetTime) })}
        </span>
      </div>
      <div className="rounded-xl border border-border bg-card p-4 shadow-card">
        {/* The rail shows the whole set — no drag-scroll viewport like the old
          panel slot needed; the list is three-ish rows tall. */}
        <Tooltip.Provider delayDuration={150} skipDelayDuration={150}>
          <div className="dq-list-capped flex flex-col gap-[5px]">
            {quests.map((quest) => {
              const chip = questGlyph(quest.icon, quest.completed);
              const href = questHref(quest.type, locale);
              const inner = (
                <>
                  <GlyphChip glyph={chip.glyph} cat={chip.cat} size={28} />
                  <div className="dq-info">
                    <span className="dq-name">{quest.name}</span>
                  </div>
                  <div className="dq-reward">
                    <Lightning size={12} weight="fill" />+{quest.xpReward}{" "}
                    {t("xp")}
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
              const row = href ? (
                <Link href={href} className={className}>
                  {inner}
                </Link>
              ) : (
                <div className={className}>{inner}</div>
              );
              return (
                <Tooltip.Root key={quest.id}>
                  <Tooltip.Trigger asChild>{row}</Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content
                      className="heatmap-tooltip"
                      sideOffset={6}
                      side="top"
                      collisionPadding={12}
                    >
                      <span className="ach-tip">{quest.description}</span>
                      <Tooltip.Arrow className="fill-[var(--card)]" />
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              );
            })}
          </div>
        </Tooltip.Provider>
      </div>
    </section>
  );
}
