"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Achievement } from "@/types";
import { Award, Lock } from "lucide-react";

const rarityStyles: Record<Achievement["rarity"], string> = {
  common: "border-zinc-400/30 text-zinc-200",
  rare: "border-[#14F195]/40 text-[#14F195]",
  epic: "border-[#9945FF]/50 text-[#d5bcff]",
};

export function AchievementCard({ achievement }: { achievement: Achievement }) {
  return (
    <Card className={`border-white/10 ${achievement.unlocked ? "bg-zinc-900/60" : "bg-zinc-950/60 opacity-75"}`}>
      <CardContent className="space-y-2 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {achievement.unlocked ? <Award className="size-4 text-[#14F195]" /> : <Lock className="size-4 text-zinc-500" />}
            <h3 className="text-sm font-semibold text-zinc-100">{achievement.title}</h3>
          </div>
          <Badge variant="outline" className={rarityStyles[achievement.rarity]}>
            {achievement.rarity}
          </Badge>
        </div>
        <p className="text-xs text-zinc-400">{achievement.description}</p>
        <div className="flex items-center justify-between">
          <p className="text-xs text-[#14F195]">+{achievement.xpReward} XP</p>
          <p className="text-xs text-zinc-500">{achievement.unlocked ? "Unlocked" : "Locked"}</p>
        </div>
      </CardContent>
    </Card>
  );
}
