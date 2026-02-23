"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

export function XpDisplay({ xp, onChainXp }: { xp: number; onChainXp: number }) {
  return (
    <Card className="border-white/10 bg-zinc-900/70">
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-zinc-400">Total XP</p>
          <p className="text-2xl font-semibold text-zinc-100">{xp.toLocaleString()}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-zinc-500">On-chain</p>
          <p className="text-sm text-[#14F195]">{onChainXp.toLocaleString()}</p>
        </div>
        <Sparkles className="size-5 text-[#14F195]" />
      </CardContent>
    </Card>
  );
}
