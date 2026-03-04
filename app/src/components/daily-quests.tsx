"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/hooks/useUser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Target, CheckCircle, Loader2, CalendarRange } from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";

type Quest = {
    id: string;
    title: string;
    description: string;
    xpReward: number;
    currentCount: number;
    targetCount: number;
    isCompleted: boolean;
    claimedAt: string | null;
};

export function DailyQuests() {
  const { userDb, refetchUser } = useUser();
  const [daily, setDaily] = useState<Quest[]>([]);
  const [seasonal, setSeasonal] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQuests = async () => {
    if (!userDb?.walletAddress) return;
    const res = await fetch(`/api/user/quests?wallet=${userDb.walletAddress}`);
    const data = await res.json();
    setDaily(data.daily || []);
    setSeasonal(data.seasonal || []);
    setLoading(false);
  };

  useEffect(() => { fetchQuests(); }, [userDb]);

  const handleClaim = async (userChallengeId: string, e: React.MouseEvent) => {
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      confetti({ particleCount: 50, spread: 60, origin: { x: (rect.left + rect.width / 2) / window.innerWidth, y: rect.top / window.innerHeight } });

      try {
          const res = await fetch('/api/user/quests/claim', {
              method: 'POST',
              body: JSON.stringify({ userChallengeId, walletAddress: userDb.walletAddress })
          });
          if (res.ok) {
              toast.success("XP Claimed!");
              fetchQuests();
              refetchUser();
          }
      } catch (e) {
          toast.error("Failed to claim");
      }
  };

  if (loading) return <Card className="col-span-3 h-48 flex items-center justify-center"><Loader2 className="animate-spin text-muted-foreground" /></Card>;

  const renderQuestList = (quests: Quest[]) => {
      if (quests.length === 0) return <p className="text-sm text-muted-foreground">No active quests.</p>;

      return quests.map(q => {
        const progress = Math.min((q.currentCount / q.targetCount) * 100, 100);
        const canClaim = q.isCompleted && !q.claimedAt;

        return (
            <div key={q.id} className="space-y-2 p-3 border rounded-lg bg-muted/20">
                <div className="flex justify-between items-start">
                    <div className="flex-1 pr-4">
                        <p className="font-medium text-sm">{q.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{q.description}</p>
                    </div>
                    
                    <div className="shrink-0 flex flex-col items-end">
                        <span className="text-yellow-500 font-bold text-xs mb-1">+{q.xpReward} XP</span>
                        {q.claimedAt ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : canClaim ? (
                            <Button size="sm" className="h-6 text-[10px] px-2 bg-yellow-500 hover:bg-yellow-600 text-black uppercase font-bold" onClick={(e) => handleClaim(q.id, e)}>
                                Claim
                            </Button>
                        ) : (
                            <span className="text-xs font-mono font-medium">{q.currentCount}/{q.targetCount}</span>
                        )}
                    </div>
                </div>
                <Progress value={progress} className="h-1.5" aria-label={`Quest progress: ${q.title}`} />
            </div>
        );
      });
  };

  return (
    <div className="col-span-3 space-y-6">
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="h-5 w-5 text-red-500" /> Daily Quests
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {renderQuestList(daily)}
            </CardContent>
        </Card>

        <Card className="border-purple-500/20 bg-purple-500/5">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-purple-400">
                    <CalendarRange className="h-5 w-5" /> Season 1 (Beta)
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {renderQuestList(seasonal)}
            </CardContent>
        </Card>
    </div>
  );
}