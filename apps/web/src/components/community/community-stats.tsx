"use client";

import { MessageSquare, MessageCircle, CheckCircle, Zap } from "lucide-react";
import { useCommunityStats } from "@/hooks/use-community-stats";
import { cn } from "@/lib/utils";

interface CommunityStatsProps {
  userId: string | undefined;
}

const STAT_ITEMS = [
  {
    key: "totalThreads",
    label: "Threads",
    icon: MessageSquare,
    color: "text-[var(--primary)]",
    bg: "bg-[var(--primary-dim)]",
  },
  {
    key: "totalAnswers",
    label: "Answers",
    icon: MessageCircle,
    color: "text-[var(--sol-purple)]",
    bg: "bg-[rgba(153,69,255,0.1)]",
  },
  {
    key: "acceptedAnswers",
    label: "Accepted",
    icon: CheckCircle,
    color: "text-[var(--primary)]",
    bg: "bg-[var(--primary-dim)]",
  },
  {
    key: "totalCommunityXp",
    label: "Community XP",
    icon: Zap,
    color: "text-[var(--xp)]",
    bg: "bg-[var(--xp-dim)]",
  },
] as const;

export function CommunityStats({ userId }: CommunityStatsProps) {
  const { stats, isLoading } = useCommunityStats(userId);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-lg border border-[var(--border-default)] bg-[var(--card)] p-3"
          >
            <div className="mb-2 h-4 w-16 rounded bg-[var(--surface)]" />
            <div className="h-6 w-10 rounded bg-[var(--surface)]" />
          </div>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 gap-3">
      {STAT_ITEMS.map((item) => {
        const Icon = item.icon;
        const value = stats[item.key as keyof typeof stats];
        return (
          <div
            key={item.key}
            className="rounded-lg border border-[var(--border-default)] bg-[var(--card)] p-3"
          >
            <div className="mb-1 flex items-center gap-1.5">
              <div className={cn("rounded-md p-1", item.bg)}>
                <Icon size={14} className={item.color} />
              </div>
              <span className="text-xs text-[var(--text-2)]">{item.label}</span>
            </div>
            <span className="font-display text-lg font-bold text-[var(--text)]">
              {value}
            </span>
          </div>
        );
      })}
    </div>
  );
}
