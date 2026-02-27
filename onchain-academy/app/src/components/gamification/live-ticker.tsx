"use client";

import { useTranslations } from "next-intl";
import { useActivityFeed } from "@/lib/hooks/use-activity-feed";
import type { ActivityEvent } from "@/lib/services/activity-feed-service";

interface LiveTickerProps {
  className?: string;
}

const ACTION_KEYS: Record<string, string> = {
  lesson_complete: "completed",
  course_finalize: "finalized",
  xp_earned: "earned",
  credential_issued: "receivedCredentialFor",
  enrollment: "enrolledIn",
};

function TickerItem({ event }: { event: ActivityEvent }) {
  const t = useTranslations("ticker");
  const key = ACTION_KEYS[event.type];
  const actionLabel = key ? t(key) : event.type;
  return (
    <div className="flex items-center gap-3 mx-6 shrink-0">
      <div
        className="w-5 h-5 rounded-full shrink-0"
        style={{ background: "linear-gradient(135deg, #9945FF, #14F195)" }}
      />
      <span className="text-sm text-[var(--c-text)] font-semibold whitespace-nowrap">
        {event.user}
      </span>
      <span className="text-sm text-[var(--c-text-2)] whitespace-nowrap">
        {actionLabel}
      </span>
      <span className="text-sm text-[#00FFA3] whitespace-nowrap">
        {event.detail}
      </span>
      {event.xp > 0 && (
        <span className="font-mono text-xs bg-[#9945FF]/20 text-[#9945FF] border border-[#9945FF]/30 px-2 py-0.5 rounded-full whitespace-nowrap">
          +{event.xp} XP
        </span>
      )}
      <span className="text-[#ECE4FD33] ml-3" aria-hidden="true">
        &bull;
      </span>
    </div>
  );
}

export function LiveTicker({ className }: LiveTickerProps) {
  const { events } = useActivityFeed();

  if (events.length === 0) return null;

  return (
    <div
      role="marquee"
      aria-label="Live learner activity feed"
      className={`w-full bg-[var(--c-bg-card)]/80 backdrop-blur-sm border-y border-[var(--c-border-subtle)] py-2.5 overflow-hidden ${className ?? ""}`}
    >
      <div className="ticker-track flex hover:[animation-play-state:paused]">
        {/* Render twice for seamless infinite loop */}
        {[0, 1].map((copy) => (
          <div
            key={copy}
            className="flex shrink-0 ticker-scroll"
            aria-hidden={copy === 1}
          >
            {events.map((event, i) => (
              <TickerItem key={`${copy}-${i}`} event={event} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
