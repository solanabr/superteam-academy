"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/hooks/useUser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Target, CheckCircle, Loader2, CalendarRange } from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("DashboardWidgets");

  const fetchQuests = async () => {
    if (!userDb?.walletAddress) return;
    const res = await fetch(`/api/user/quests?wallet=${userDb.walletAddress}`);
    const data = await res.json();
    setDaily(data.daily || []);
    setSeasonal(data.seasonal || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchQuests();
  }, [userDb]);

  const handleClaim = async (userChallengeId: string, e: React.MouseEvent) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    confetti({ particleCount: 50, spread: 60, origin: { x: (rect.left + rect.width / 2) / window.innerWidth, y: rect.top / window.innerHeight } });

    try {
      const res = await fetch("/api/user/quests/claim", {
        method: "POST",
        body: JSON.stringify({ userChallengeId, walletAddress: userDb.walletAddress }),
      });
      if (res.ok) {
        toast.success(t("xpClaimed"));
        fetchQuests();
        refetchUser();
      }
    } catch (_e) {
      toast.error(t("claimFailed"));
    }
  };

  if (loading) return <Card className="col-span-3 flex h-48 items-center justify-center border-border/60 bg-card/70"><Loader2 className="animate-spin text-muted-foreground" /></Card>;

  const renderQuestList = (quests: Quest[]) => {
    if (quests.length === 0) return <p className="text-sm text-muted-foreground">{t("noActiveQuests")}</p>;

    return quests.map((q) => {
      const progress = Math.min((q.currentCount / q.targetCount) * 100, 100);
      const canClaim = q.isCompleted && !q.claimedAt;

      return (
        <div key={q.id} className="space-y-2 rounded-lg border border-border/60 bg-muted/20 p-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-4">
              <p className="text-sm font-medium">{q.title}</p>
              <p className="line-clamp-1 text-xs text-muted-foreground">{q.description}</p>
            </div>

            <div className="flex shrink-0 flex-col items-end">
              <span className="mb-1 text-xs font-bold text-yellow-500">+{q.xpReward} XP</span>
              {q.claimedAt ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : canClaim ? (
                <Button size="sm" className="h-6 px-2 text-[10px] font-bold uppercase" onClick={(e) => handleClaim(q.id, e)}>
                  {t("claim")}
                </Button>
              ) : (
                <span className="font-mono text-xs font-medium">{q.currentCount}/{q.targetCount}</span>
              )}
            </div>
          </div>
          <Progress value={progress} className="h-1.5" aria-label={t("questProgressAria", { title: q.title })} />
        </div>
      );
    });
  };

  return (
    <div className="col-span-3 space-y-6">
      <Card className="border-border/60 bg-card/70 backdrop-blur-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg"><Target className="h-5 w-5 text-red-500" /> {t("dailyQuests")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">{renderQuestList(daily)}</CardContent>
      </Card>

      <Card className="border-purple-500/20 bg-card/70 backdrop-blur-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg text-purple-400"><CalendarRange className="h-5 w-5" /> {t("seasonBeta")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">{renderQuestList(seasonal)}</CardContent>
      </Card>
    </div>
  );
}
