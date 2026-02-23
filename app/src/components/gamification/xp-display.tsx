"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

function calculateNextLevelXp(xp: number): { currentLevelXp: number; nextLevelXp: number; progress: number } {
  const currentLevelXp = Math.floor(xp / 500) * 500;
  const nextLevelXp = currentLevelXp + 500;
  const progress = Math.round(((xp - currentLevelXp) / 500) * 100);
  return { currentLevelXp, nextLevelXp, progress };
}

export function XpDisplay({ xp, onChainXp }: { xp: number; onChainXp: number }) {
  const [animatedXp, setAnimatedXp] = useState(xp);

  useEffect(() => {
    let frame = 0;
    const start = animatedXp;
    const delta = xp - start;
    const started = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - started) / 500, 1);
      setAnimatedXp(Math.round(start + delta * progress));
      if (progress < 1) {
        frame = window.requestAnimationFrame(tick);
      }
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [xp]);

  const { currentLevelXp, nextLevelXp, progress } = calculateNextLevelXp(animatedXp);

  return (
    <Card className="border-white/10 bg-zinc-900/70">
      <CardContent className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-400">Total XP</p>
            <p className="text-2xl font-semibold text-zinc-100">{animatedXp.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-zinc-500">On-chain</p>
            <p className="text-sm text-[#14F195]">{onChainXp.toLocaleString()}</p>
          </div>
          <Sparkles className="size-5 text-[#14F195]" />
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between text-xs text-zinc-400">
            <span>{currentLevelXp.toLocaleString()} XP</span>
            <span>{nextLevelXp.toLocaleString()} XP</span>
          </div>
          <Progress value={progress} className="h-2 bg-zinc-800" />
        </div>
      </CardContent>
    </Card>
  );
}
