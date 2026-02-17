"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Flame, Clock, Zap, CheckCircle2, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDailyChallenge } from "@/lib/hooks/use-service";
import { PRACTICE_DIFFICULTY_CONFIG } from "@/types/practice";

function getTimeUntilNextChallenge(): { hours: number; minutes: number; seconds: number } {
  const now = new Date();
  const brt = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  const nextMidnight = new Date(brt);
  nextMidnight.setUTCHours(24, 0, 0, 0);
  const diff = nextMidnight.getTime() - brt.getTime();
  return {
    hours: Math.floor(diff / (1000 * 60 * 60)),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function DailyChallengeBanner() {
  const t = useTranslations("dailyChallenge");
  const { data, isLoading } = useDailyChallenge();
  const [countdown, setCountdown] = useState(getTimeUntilNextChallenge);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(getTimeUntilNextChallenge());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return <Skeleton className="h-24 w-full rounded-xl mb-6" />;
  }

  if (!data) return null;

  const diffConfig = PRACTICE_DIFFICULTY_CONFIG[data.difficulty];

  return (
    <Card className="mb-6 overflow-hidden border-solana-purple/30 bg-gradient-to-r from-solana-purple/5 to-xp-gold/5">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="h-5 w-5 text-xp-gold" />
              <span className="text-sm font-bold uppercase tracking-wider text-xp-gold">
                {t("title")}
              </span>
              <Badge variant="outline" className="text-[10px]" style={{ borderColor: diffConfig.color, color: diffConfig.color }}>
                {diffConfig.label}
              </Badge>
            </div>
            <h3 className="text-lg font-bold truncate">{data.title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">{data.description}</p>
          </div>

          <div className="flex items-center gap-4 sm:gap-6 flex-shrink-0">
            {/* Daily streak */}
            <div className="flex items-center gap-1.5 text-center">
              <Flame className="h-5 w-5 text-streak-orange" />
              <div>
                <p className="text-lg font-bold leading-none">{data.dailyStreak?.current ?? 0}</p>
                <p className="text-[10px] text-muted-foreground">{t("streak")}</p>
              </div>
            </div>

            {/* XP reward */}
            <div className="text-center">
              <p className="text-lg font-bold text-xp-gold leading-none">{data.xpReward}</p>
              <p className="text-[10px] text-muted-foreground">XP</p>
            </div>

            {/* Countdown */}
            <div className="flex items-center gap-1.5 text-center">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-mono font-bold leading-none tabular-nums">
                  {pad(countdown.hours)}:{pad(countdown.minutes)}:{pad(countdown.seconds)}
                </p>
                <p className="text-[10px] text-muted-foreground">{t("nextChallenge")}</p>
              </div>
            </div>

            {/* Action */}
            {data.completed ? (
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-5 w-5 text-solana-green" />
                <span className="text-sm font-medium text-solana-green">{t("completed")}</span>
              </div>
            ) : (
              <Button asChild size="sm" variant="solana">
                <Link href="/practice/daily">
                  {t("solveNow")} <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
