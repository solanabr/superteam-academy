"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, Clock } from "lucide-react";
import { useSeasonalEvent } from "@/lib/hooks/use-seasonal-event";
import { cn } from "@/lib/utils";

interface SeasonalEventBannerProps {
  className?: string;
}

function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return "Ended";
  const days = Math.floor(ms / 86_400_000);
  const hours = Math.floor((ms % 86_400_000) / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);

  if (days > 0) return `${days}d ${hours}h remaining`;
  if (hours > 0) return `${hours}h ${minutes}m remaining`;
  return `${minutes}m remaining`;
}

export function SeasonalEventBanner({ className }: SeasonalEventBannerProps) {
  const { activeEvent, timeRemaining } = useSeasonalEvent();
  const [dismissed, setDismissed] = useState(false);

  if (!activeEvent || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={cn(
          "relative overflow-hidden rounded-[2px] border border-[var(--c-border-subtle)]",
          className,
        )}
        style={{
          background: activeEvent.theme.gradient,
        }}
      >
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-black/60" />

        {/* Animated shimmer */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${activeEvent.theme.accent}40 50%, transparent 100%)`,
            animation: "shimmer 3s ease-in-out infinite",
          }}
        />

        <div className="relative flex items-center justify-between px-4 py-3 gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {/* XP Multiplier badge */}
            <div
              className="flex items-center gap-1 shrink-0 rounded-[2px] px-2.5 py-1.5 font-mono text-sm font-bold"
              style={{
                backgroundColor: `${activeEvent.theme.accent}25`,
                color: activeEvent.theme.accent,
                border: `1px solid ${activeEvent.theme.accent}40`,
              }}
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              {activeEvent.xpMultiplier}x XP
            </div>

            {/* Event info */}
            <div className="min-w-0">
              <h4 className="text-sm font-semibold text-white truncate">
                {activeEvent.name}
              </h4>
              <p className="text-xs text-white/70 truncate">
                {activeEvent.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Countdown */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-white/60">
              <Clock className="w-3 h-3" />
              <span className="font-mono tabular-nums">
                {formatTimeRemaining(timeRemaining)}
              </span>
            </div>

            {/* Dismiss */}
            <button
              onClick={() => setDismissed(true)}
              className="flex items-center justify-center w-6 h-6 rounded-[2px] text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Dismiss banner"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
