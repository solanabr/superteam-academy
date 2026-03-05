"use client";
import { CheckCircle2, Circle, Target, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { useLocale } from "@/providers/locale-provider";

type MissionStep = {
  id: string;
  title: string;
  done: boolean;
};

export function MissionRail({
  courseTitle,
  xpReward,
  completion,
  steps,
}: {
  courseTitle: string;
  xpReward: number;
  completion: number;
  steps: MissionStep[];
}): React.JSX.Element {
  const { t } = useLocale();
  return (
    <aside className="w-full xl:w-72 xl:sticky top-20 shrink-0 self-start rounded-2xl border border-border/50 bg-background/50 backdrop-blur-xl p-5 shadow-lg">
      <div className="space-y-4 mb-8">
        <div className="flex items-start justify-between">
          <Badge
            variant="outline"
            className="bg-primary/10 text-primary border-primary/20 flex items-center gap-1.5 px-3 py-1"
          >
            <Target className="h-3.5 w-3.5" /> {t("missionRail.title")}
          </Badge>
          <Badge
            variant="secondary"
            className="bg-secondary/15 text-secondary flex items-center gap-1"
          >
            <Zap className="h-3.5 w-3.5 fill-current" /> {xpReward} XP
          </Badge>
        </div>
        <div>
          <h3 className="font-display text-lg font-bold leading-tight uppercase tracking-tight text-foreground">
            {courseTitle}
          </h3>
        </div>
      </div>

      <div className="space-y-3 mb-8 bg-muted/20 p-4 rounded-xl border border-border/40">
        <div className="flex items-center justify-between text-sm font-medium">
          <span className="text-muted-foreground">
            {t("missionRail.progressSession")}
          </span>
          <span
            className={
              completion === 100 ? "text-primary font-bold" : "text-foreground"
            }
          >
            {completion}%
          </span>
        </div>
        <ProgressBar value={completion} />
      </div>

      <div>
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
          {t("missionRail.objectives")}
        </h4>
        <ol className="space-y-3 relative before:absolute before:inset-y-0 before:left-3 before:w-px before:bg-border/50">
          {steps.map((step) => (
            <li
              key={step.id}
              className="relative flex items-center gap-3 bg-background/60 p-3 rounded-xl border border-border/40"
            >
              <div className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-background border border-border/60">
                {step.done ? (
                  <CheckCircle2 className="h-5 w-5 text-primary bg-background rounded-full" />
                ) : (
                  <Circle
                    className="h-2 w-2 text-muted-foreground rounded-full"
                    fill="currentColor"
                  />
                )}
              </div>
              <span
                className={`text-sm font-medium transition-colors ${step.done ? "text-muted-foreground line-through decoration-muted-foreground/50" : "text-foreground"}`}
              >
                {step.title}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </aside>
  );
}
