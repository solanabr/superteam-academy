"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/hooks/useUser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Target, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti"; // Легковесная либа для кнопок

type Quest = {
    id: string; // ID UserChallenge
    title: string;
    xpReward: number;
    currentCount: number;
    targetCount: number;
    isCompleted: boolean;
    claimedAt: string | null;
};

export function DailyQuests() {
  const { userDb, refetchUser } = useUser();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQuests = async () => {
    if (!userDb?.walletAddress) return;
    const res = await fetch(`/api/user/quests?wallet=${userDb.walletAddress}`);
    const data = await res.json();
    setQuests(data);
    setLoading(false);
  };

  useEffect(() => { 
    fetchQuests();
  // eslint-disable-next-line react-hooks/exhaustive-deps 
  }, [userDb]);

  const handleClaim = async (userChallengeId: string, e: React.MouseEvent) => {
      // Анимация прямо на кнопке
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      confetti({
          particleCount: 50,
          spread: 60,
          origin: { x: (rect.left + rect.width / 2) / window.innerWidth, y: rect.top / window.innerHeight }
      });

      try {
          const res = await fetch('/api/user/quests/claim', {
              method: 'POST',
              body: JSON.stringify({ userChallengeId, walletAddress: userDb.walletAddress })
          });
          if (res.ok) {
              toast.success("XP Claimed!");
              fetchQuests();
              refetchUser(); // Обновляем глобальный XP
          }
      } catch (e) {
          toast.error("Failed to claim");
      }
  };

  if (loading) return <Card className="col-span-3 h-48 flex items-center justify-center"><Loader2 className="animate-spin" /></Card>;

  return (
    <Card className="col-span-3">
        <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5 text-red-500" /> Daily Quests
            </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            {quests.length > 0 ? quests.map(q => {
                const progress = Math.min((q.currentCount / q.targetCount) * 100, 100);
                const canClaim = q.isCompleted && !q.claimedAt;

                return (
                    <div key={q.id} className="space-y-2">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-medium text-sm">{q.title}</p>
                                <p className="text-xs text-muted-foreground">Reward: <span className="text-yellow-500 font-bold">+{q.xpReward} XP</span></p>
                            </div>
                            
                            {q.claimedAt ? (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : canClaim ? (
                                <Button size="sm" className="h-7 text-xs bg-yellow-500 hover:bg-yellow-600 text-black" onClick={(e) => handleClaim(q.id, e)}>
                                    Claim
                                </Button>
                            ) : (
                                <span className="text-xs font-mono">{q.currentCount}/{q.targetCount}</span>
                            )}
                        </div>
                        <Progress value={progress} className="h-1.5" aria-label={`Quest progress: ${q.title}`} />
                    </div>
                );
            }) : (
                <p className="text-sm text-muted-foreground">No active quests today.</p>
            )}
        </CardContent>
    </Card>
  );
}