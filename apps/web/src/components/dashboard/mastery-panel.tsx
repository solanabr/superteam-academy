"use client";

import { useTranslations } from "next-intl";
import type { MasterySkill } from "@/lib/gamification/mastery";
import { Card, CardContent } from "@/components/ui/card";

interface MasteryPanelProps {
  /** Per-skill progress derived from completed lessons × their skill tags. */
  skills: MasterySkill[];
}

/**
 * "Skill mastery" dashboard slot (LX-B16). Per-skill progress bars derived from
 * the learner's completed lessons and each lesson's skill tags. Renders nothing
 * until the learner has practiced at least one tagged skill.
 */
export function MasteryPanel({ skills }: MasteryPanelProps) {
  const t = useTranslations("mastery");

  if (skills.length === 0) return null;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-[24px] font-extrabold">
          {t("title")}
        </h2>
        <p className="mt-1 text-sm text-text-3">{t("caption")}</p>
      </div>
      <Card className="shadow-[var(--shadow)]">
        <CardContent className="flex flex-col gap-4 p-6">
          {skills.map((skill) => (
            <div key={skill.slug} className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-semibold">{skill.label}</span>
                <span className="text-xs tabular-nums text-text-3">
                  {t("lessonsRatio", {
                    completed: skill.completed,
                    total: skill.total,
                  })}
                </span>
              </div>
              <div
                className="bg-surface-3 h-2 overflow-hidden rounded-full"
                role="progressbar"
                aria-valuenow={skill.progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={t("progressLabel", {
                  skill: skill.label,
                  completed: skill.completed,
                  total: skill.total,
                })}
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-solana-purple to-solana-green transition-[width]"
                  style={{ width: `${skill.progress}%` }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
