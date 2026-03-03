"use client";

import Link from "next/link";
import { BookOpen, Zap, Code, Flame, Check, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useGamification } from "@/lib/hooks/use-gamification";
import { EmptyState } from "@/components/ui/empty-state";
import { EmptyQuestsIllustration } from "@/components/icons";

const QUEST_ICONS: Record<string, typeof BookOpen> = {
  lessons: BookOpen,
  xp: Zap,
  challenge: Code,
  streak: Flame,
};

const QUEST_COLORS: Record<string, string> = {
  lessons: "text-brazil-teal",
  xp: "text-xp",
  challenge: "text-brazil-gold",
  streak: "text-streak",
};

export function DailyQuestsCard() {
  const t = useTranslations("gamification");
  const { dailyQuests } = useGamification();

  if (dailyQuests.length === 0) {
    return (
      <section>
        <h2 className="mb-4 text-xl font-bold">{t("dailyQuests.title")}</h2>
        <div className="glass rounded-xl">
          <EmptyState
            illustration={<EmptyQuestsIllustration className="h-full w-full" />}
            title={t("dailyQuests.empty")}
            description={t("dailyQuests.emptyHint")}
            compact
          />
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">{t("dailyQuests.title")}</h2>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {t("dailyQuests.done", {
              completed: dailyQuests.filter((q) => q.completed).length,
              total: dailyQuests.length,
            })}
          </span>
          <Link
            href="/challenges"
            className="flex items-center gap-1 text-sm text-st-green hover:text-st-green-light transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
      <div className="glass rounded-xl divide-y divide-border/50">
        {dailyQuests.map((quest) => {
          const Icon = QUEST_ICONS[quest.type] || Zap;
          const color = QUEST_COLORS[quest.type] || "text-muted-foreground";
          const progressPct =
            quest.target > 0
              ? Math.min((quest.progress / quest.target) * 100, 100)
              : 0;

          return (
            <div key={quest.id} className="flex items-center gap-3 px-4 py-3">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                  quest.completed ? "bg-brazil-green/10" : "bg-muted/50"
                }`}
              >
                {quest.completed ? (
                  <Check className="h-4 w-4 text-brazil-green" />
                ) : (
                  <Icon className={`h-4 w-4 ${color}`} />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p
                    className={`text-sm font-medium ${quest.completed ? "line-through text-muted-foreground" : ""}`}
                  >
                    {quest.title}
                  </p>
                  <span className="text-xs font-medium text-xp">
                    +{quest.xpReward} XP
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {quest.description}
                </p>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        quest.completed
                          ? "bg-brazil-green"
                          : "bg-gradient-to-r from-st-green to-brazil-teal"
                      }`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {quest.progress}/{quest.target}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
