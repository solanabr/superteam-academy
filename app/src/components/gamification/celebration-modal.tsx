"use client";

import { useEffect, useMemo, useRef } from "react";
import { Sparkles, Zap, TrendingUp, ArrowRight, Flame } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  useGamification,
  type CelebrationData,
} from "@/lib/hooks/use-gamification";
import { formatXP } from "@/lib/utils";

const CONTENT_MESSAGE_KEYS = [
  "celebration.lessonComplete",
  "celebration.onFire",
  "celebration.nailedIt",
  "celebration.keepGoing",
  "celebration.amazingWork",
];

const CHALLENGE_MESSAGE_KEYS = [
  "celebration.challengeCrushed",
  "celebration.codeMaster",
  "celebration.testsPassed",
  "celebration.brilliant",
];

const CONFETTI_COLORS = [
  "bg-brazil-gold",
  "bg-brazil-green",
  "bg-brazil-teal",
  "bg-xp",
  "bg-primary",
  "bg-brazil-coral",
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

function getMessageKey(title: string, isChallenge: boolean): string {
  const keys = isChallenge ? CHALLENGE_MESSAGE_KEYS : CONTENT_MESSAGE_KEYS;
  const idx = hashString(title) % keys.length;
  return keys[idx];
}

function ConfettiPiece({ index }: { index: number }) {
  const seed = hashString(`confetti-${index}`);
  const left = seed % 100;
  const delay = (seed % 2000) / 1000;
  const duration = 2 + (seed % 2000) / 1000;
  const colorIdx = seed % CONFETTI_COLORS.length;
  const size = 6 + (seed % 6);
  const isCircle = seed % 3 === 0;

  return (
    <div
      className={`absolute animate-confetti ${CONFETTI_COLORS[colorIdx]} ${isCircle ? "rounded-full" : "rounded-sm"}`}
      style={
        {
          left: `${left}%`,
          top: "-10px",
          width: `${size}px`,
          height: `${size}px`,
          "--confetti-delay": `${delay}s`,
          "--confetti-duration": `${duration}s`,
        } as React.CSSProperties
      }
    />
  );
}

export function CelebrationModal() {
  const { showCelebration, celebrationData, dismissCelebration } =
    useGamification();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (showCelebration) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [showCelebration]);

  if (!celebrationData) return null;

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-[200] m-0 h-full w-full max-h-full max-w-full bg-transparent p-0 backdrop:bg-black/70"
      onClose={dismissCelebration}
    >
      <CelebrationContent
        data={celebrationData}
        onContinue={dismissCelebration}
      />
    </dialog>
  );
}

function CelebrationContent({
  data,
  onContinue,
}: {
  data: CelebrationData;
  onContinue: () => void;
}) {
  const t = useTranslations("gamification");
  const messageKey = useMemo(
    () => getMessageKey(data.lessonTitle, data.isChallenge),
    [data.lessonTitle, data.isChallenge],
  );
  const message = t(messageKey);
  const comboLabel = useMemo(() => {
    if (data.comboCount >= 5) return t("combo.super");
    if (data.comboCount >= 3)
      return t("combo.count", { count: data.comboCount });
    if (data.comboCount >= 2) return t("combo.twoX");
    return null;
  }, [data.comboCount, t]);

  const confettiPieces = useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => <ConfettiPiece key={i} index={i} />),
    [],
  );

  return (
    <div className="flex h-full w-full items-center justify-center p-4">
      {/* Confetti layer */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {confettiPieces}
      </div>

      {/* Modal card */}
      <div className="animate-celebration-bounce relative z-10 w-full max-w-sm rounded-2xl border border-border bg-card p-8 text-center shadow-2xl">
        {/* Icon */}
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brazil-gold/20">
          {data.isChallenge ? (
            <Sparkles className="h-8 w-8 text-brazil-gold" />
          ) : (
            <Sparkles className="h-8 w-8 text-brazil-gold" />
          )}
        </div>

        {/* Message */}
        <h2 className="font-heading text-2xl font-bold">{message}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{data.lessonTitle}</p>

        {/* XP earned */}
        <div className="mt-6 flex items-center justify-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full bg-xp/10 px-4 py-2">
            <Zap className="h-5 w-5 text-xp" />
            <span className="text-lg font-bold text-xp">
              +{formatXP(data.xpEarned)} XP
            </span>
          </div>
        </div>

        {/* Bonus XP from combo */}
        {data.bonusXP > 0 && (
          <div className="mt-2 flex items-center justify-center gap-1 text-sm text-brazil-gold">
            <Flame className="h-4 w-4" />
            <span>
              +{data.bonusXP} bonus XP ({data.comboMultiplier}x)
            </span>
          </div>
        )}

        {/* Combo badge */}
        {comboLabel && (
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-brazil-gold/10 px-3 py-1 text-sm font-semibold text-brazil-gold animate-combo-pulse">
            <Flame className="h-4 w-4" />
            {comboLabel}
          </div>
        )}

        {/* Level up callout */}
        {data.isLevelUp && (
          <div className="mt-4 rounded-lg border border-level/30 bg-level/10 px-4 py-3">
            <div className="flex items-center justify-center gap-2">
              <TrendingUp className="h-5 w-5 text-level" />
              <span className="font-bold text-level">
                {t("celebration.levelUp")}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("celebration.levelReached", { level: data.newLevel })}
            </p>
          </div>
        )}

        {/* Daily goal progress */}
        {data.dailyGoalTarget > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{t("celebration.dailyGoal")}</span>
              <span>
                {Math.min(data.dailyGoalProgress, data.dailyGoalTarget)}/
                {data.dailyGoalTarget} XP
              </span>
            </div>
            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  data.dailyGoalProgress >= data.dailyGoalTarget
                    ? "bg-brazil-green animate-goal-complete"
                    : "bg-gradient-to-r from-st-green to-brazil-teal"
                }`}
                style={{
                  width: `${Math.min((data.dailyGoalProgress / data.dailyGoalTarget) * 100, 100)}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Continue button */}
        <button
          onClick={onContinue}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brazil-gold to-brazil-gold-light px-6 py-3 text-sm font-semibold text-black shadow-lg shadow-brazil-gold/20 transition-all hover:shadow-xl hover:shadow-brazil-gold/30"
        >
          {t("celebration.continue")}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
