"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Achievement } from "@/types";

export function AchievementCard({ achievement }: { achievement: Achievement }) {
  return (
    <Card className="border-white/10 bg-zinc-900/60">
      <CardContent className="space-y-2 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-100">{achievement.title}</h3>
          <Badge
            variant={achievement.unlocked ? "default" : "outline"}
            className={achievement.unlocked ? "bg-[#14F195] text-black" : "border-white/20 text-zinc-300"}
          >
            {achievement.rarity}
          </Badge>
        </div>
        <p className="text-xs text-zinc-400">{achievement.description}</p>
        <p className="text-xs text-[#14F195]">+{achievement.xpReward} XP</p>
      </CardContent>
    </Card>
  );
}
