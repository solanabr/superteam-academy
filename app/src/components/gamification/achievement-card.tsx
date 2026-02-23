"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Achievement } from "@/types";
import { Award, Lock } from "lucide-react";

const rarityStyles: Record<Achievement["rarity"], string> = {
  common: "border-zinc-400/30 text-foreground/90",
  rare: "border-[#ffd23f]/40 text-[#ffd23f]",
  epic: "border-[#2f6b3f]/50 text-[#f7eacb]",
};

export function AchievementCard({ achievement }: { achievement: Achievement }) {
  return (
    <Card className={`border-border ${achievement.unlocked ? "bg-card" : "bg-st-dark/60 opacity-75"}`}>
      <CardContent className="space-y-2 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {achievement.unlocked ? <Award className="size-4 text-[#ffd23f]" /> : <Lock className="size-4 text-muted-foreground/70" />}
            <h3 className="text-sm font-semibold text-foreground">{achievement.title}</h3>
          </div>
          <Badge variant="outline" className={rarityStyles[achievement.rarity]}>
            {achievement.rarity}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">{achievement.description}</p>
        <div className="flex items-center justify-between">
          <p className="text-xs text-[#ffd23f]">+{achievement.xpReward} XP</p>
          <p className="text-xs text-muted-foreground/70">{achievement.unlocked ? "Unlocked" : "Locked"}</p>
        </div>
      </CardContent>
    </Card>
  );
}
