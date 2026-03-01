"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Achievement } from "@/types";
import { Award, Lock } from "lucide-react";

const rarityStyles: Record<Achievement["rarity"], string> = {
  common: "border-muted-foreground/30 text-foreground/90",
  rare: "border-highlight/40 text-highlight",
  epic: "border-primary/50 text-foreground",
};

export function AchievementCard({ achievement }: { achievement: Achievement }) {
  return (
    <Card className={`border-border ${achievement.unlocked ? "bg-card" : "bg-surface opacity-75"}`}>
      <CardContent className="space-y-2 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {achievement.unlocked ? <Award className="size-4 text-highlight" /> : <Lock className="size-4 text-muted-foreground/70" />}
            <h3 className="text-sm font-semibold text-foreground">{achievement.title}</h3>
          </div>
          <Badge variant="outline" className={rarityStyles[achievement.rarity]}>
            {achievement.rarity}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">{achievement.description}</p>
        <div className="flex items-center justify-between">
          <p className="text-xs text-highlight">+{achievement.xpReward} XP</p>
          <p className="text-xs text-muted-foreground/70">{achievement.unlocked ? "Unlocked" : "Locked"}</p>
        </div>
      </CardContent>
    </Card>
  );
}
