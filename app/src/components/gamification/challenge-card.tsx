"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  GraduationCap,
  Zap,
  Star,
  Flame,
  Compass,
  Code,
  Trophy,
  Check,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DailyChallenge } from "@/lib/services/challenge-service";

const iconMap: Record<string, React.ElementType> = {
  BookOpen,
  GraduationCap,
  Zap,
  Star,
  Flame,
  Compass,
  Code,
  Trophy,
};

interface ChallengeCardProps {
  challenge: DailyChallenge;
  onClaim: (challengeId: string) => number;
}

export function ChallengeCard({ challenge, onClaim }: ChallengeCardProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [claimedXP, setClaimedXP] = useState<number | null>(null);
  const Icon = iconMap[challenge.icon] ?? Star;
  const isClaimed = !!challenge.claimedAt;
  const canClaim = challenge.completed && !isClaimed;
  const progressPct = Math.min(
    (challenge.progress / challenge.target) * 100,
    100,
  );

  const handleClaim = useCallback(() => {
    if (!canClaim) return;
    const xp = onClaim(challenge.id);
    if (xp > 0) {
      setClaimedXP(xp);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2000);
    }
  }, [canClaim, onClaim, challenge.id]);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[2px] border p-4 transition-colors",
        isClaimed
          ? "border-[#00FFA3]/20 bg-[#00FFA3]/5"
          : "border-[var(--c-border-subtle)] bg-[var(--c-bg-card)]",
      )}
    >
      {/* Confetti burst */}
      <AnimatePresence>
        {showConfetti && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none"
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ x: 0, y: 0, opacity: 1 }}
                animate={{
                  x: Math.cos((i * Math.PI) / 4) * 60,
                  y: Math.sin((i * Math.PI) / 4) * 60,
                  opacity: 0,
                }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="absolute w-1.5 h-1.5 rounded-full"
                style={{
                  backgroundColor: i % 2 === 0 ? "#00FFA3" : "#9945FF",
                }}
              />
            ))}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.3, 1] }}
              transition={{ duration: 0.5 }}
            >
              <Sparkles className="w-8 h-8 text-[#00FFA3]" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-[2px]",
            isClaimed
              ? "bg-[#00FFA3]/15"
              : challenge.completed
                ? "bg-[#00FFA3]/10"
                : "bg-[var(--c-bg-elevated)]",
          )}
        >
          <Icon
            className={cn(
              "h-5 w-5",
              isClaimed
                ? "text-[#00FFA3]"
                : challenge.completed
                  ? "text-[#00FFA3]"
                  : "text-[var(--c-text-2)]",
            )}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4
              className={cn(
                "text-sm font-medium truncate",
                isClaimed
                  ? "text-[#00FFA3]"
                  : "text-[var(--c-text)]",
              )}
            >
              {challenge.title}
            </h4>
            <span className="shrink-0 font-mono text-[11px] bg-[#9945FF]/15 text-[#CA9FF5] border border-[#9945FF]/20 px-1.5 py-0.5 rounded-[2px]">
              +{challenge.xpReward} XP
            </span>
          </div>

          <p className="text-xs text-[var(--c-text-2)] mt-0.5">
            {challenge.description}
          </p>

          {/* Progress bar */}
          <div className="mt-2.5 flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-[1px] bg-[var(--c-border-subtle)] overflow-hidden">
              <motion.div
                className="h-full rounded-[1px] bg-[#00FFA3]"
                initial={false}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>
            <span className="text-[10px] font-mono text-[var(--c-text-2)] tabular-nums shrink-0">
              {challenge.progress}/{challenge.target}
            </span>
          </div>

          {/* Claim button */}
          {canClaim && (
            <motion.button
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={handleClaim}
              className="mt-2.5 flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] bg-[#00FFA3]/15 text-[#00FFA3] border border-[#00FFA3]/30 text-xs font-medium hover:bg-[#00FFA3]/25 transition-colors cursor-pointer"
            >
              <Zap className="w-3 h-3 fill-current" />
              Claim Reward
            </motion.button>
          )}

          {/* Claimed state */}
          {isClaimed && (
            <div className="mt-2.5 flex items-center gap-1.5 text-xs text-[#00FFA3]/70">
              <Check className="w-3 h-3" />
              Claimed
              {claimedXP !== null && (
                <span className="font-mono">+{claimedXP} XP</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
