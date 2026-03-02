"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Zap, Lock } from "lucide-react";

interface AchievementCardProps {
  name: string;
  description: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  xpReward: number;
  earned?: boolean;
  earnedDate?: string;
  image?: string;
}

const RARITY_STYLES: Record<string, { badge: string; glow: string }> = {
  common: { badge: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20", glow: "" },
  rare: { badge: "bg-blue-500/10 text-blue-400 border-blue-500/20", glow: "hover:shadow-blue-500/10" },
  epic: { badge: "bg-purple-500/10 text-purple-400 border-purple-500/20", glow: "hover:shadow-purple-500/10" },
  legendary: { badge: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20", glow: "hover:shadow-yellow-500/10" },
};

export function AchievementCard({
  name,
  description,
  rarity,
  xpReward,
  earned = false,
  earnedDate,
  image,
}: AchievementCardProps) {
  const style = RARITY_STYLES[rarity] || RARITY_STYLES.common;

  return (
    <Card
      className={cn(
        "overflow-hidden transition-all duration-200 hover:shadow-lg",
        style.glow,
        !earned && "opacity-60 grayscale"
      )}
    >
      <CardContent className="p-4 flex gap-4">
        <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
          {earned ? (
            <span className="text-2xl">{image || "🏆"}</span>
          ) : (
            <Lock className="h-6 w-6 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-sm truncate">{name}</h4>
            <Badge variant="outline" className={cn("text-[10px] shrink-0", style.badge)}>
              {rarity}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">{description}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="flex items-center gap-1 text-xs text-superteam-green">
              <Zap className="h-3 w-3" />
              +{xpReward} XP
            </span>
            {earned && earnedDate && (
              <span className="text-xs text-muted-foreground">
                {new Date(earnedDate).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
