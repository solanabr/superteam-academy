"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ACHIEVEMENTS } from "@/data/mock";
import { cn } from "@/lib/utils";
import {
  Footprints,
  GraduationCap,
  Trophy,
  Flame,
  Zap,
  Star,
  Users,
  Bug,
  Timer,
  Globe,
  Lock,
} from "lucide-react";
import { type LucideIcon } from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  Footprints,
  GraduationCap,
  Trophy,
  Flame,
  Zap,
  Star,
  Users,
  Bug,
  Timer,
  Globe,
};

interface AchievementGridProps {
  unlockedIds: number[];
}

export function AchievementGrid({ unlockedIds }: AchievementGridProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-400" />
          Achievements
          <span className="text-sm text-muted-foreground font-normal">
            {unlockedIds.length}/{ACHIEVEMENTS.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {ACHIEVEMENTS.map((achievement) => {
            const isUnlocked = unlockedIds.includes(achievement.id);
            const Icon = ICON_MAP[achievement.icon] || Star;
            return (
              <div
                key={achievement.id}
                className={cn(
                  "relative flex flex-col items-center gap-2 p-3 rounded-lg border text-center transition-all",
                  isUnlocked
                    ? "bg-primary/5 border-primary/20"
                    : "bg-muted/30 border-border/50 opacity-50"
                )}
              >
                <div
                  className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center",
                    isUnlocked ? "bg-primary/20" : "bg-muted"
                  )}
                >
                  {isUnlocked ? (
                    <Icon className="h-5 w-5 text-primary" />
                  ) : (
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-medium leading-tight">
                    {achievement.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    +{achievement.xpReward} XP
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
