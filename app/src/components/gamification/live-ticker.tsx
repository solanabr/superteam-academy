"use client";

import { useTranslations } from "next-intl";

interface LiveTickerProps {
  className?: string;
}

interface TickerEvent {
  user: string;
  actionKey: string;
  item: string;
  itemKey?: string;
  itemParams?: Record<string, string | number>;
  xp: number;
}

const mockEvents: TickerEvent[] = [
  {
    user: "EsyB...P4Ub",
    actionKey: "earned",
    item: "Rustacean Badge",
    xp: 500,
  },
  {
    user: "CryptoKing",
    actionKey: "finished",
    item: "Intro to Anchor",
    xp: 1000,
  },
  { user: "Sol_Dev42", actionKey: "deployed", item: "First Program", xp: 250 },
  {
    user: "0xAnon",
    actionKey: "hit",
    item: "7 Day Streak",
    itemKey: "dayStreak",
    itemParams: { count: 7 },
    xp: 100,
  },
  {
    user: "DeFiQueen",
    actionKey: "completed",
    item: "Solana Frontend",
    xp: 650,
  },
  {
    user: "AnchorMaster",
    actionKey: "earned",
    item: "Security Expert",
    xp: 750,
  },
  {
    user: "TokenWiz",
    actionKey: "finished",
    item: "Token 2022 Deep Dive",
    xp: 800,
  },
  {
    user: "RustLord",
    actionKey: "hit",
    item: "30 Day Streak",
    itemKey: "dayStreak",
    itemParams: { count: 30 },
    xp: 500,
  },
];

function TickerItem({ event }: { event: TickerEvent }) {
  const t = useTranslations("ticker");
  const itemText = event.itemKey
    ? t(event.itemKey, event.itemParams)
    : event.item;
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
        {t(event.actionKey)}
      </span>
      <span className="text-sm text-[#00FFA3] whitespace-nowrap">
        {itemText}
      </span>
      <span className="font-mono text-xs bg-[#9945FF]/20 text-[#9945FF] border border-[#9945FF]/30 px-2 py-0.5 rounded-full whitespace-nowrap">
        +{event.xp} XP
      </span>
      <span className="text-[#ECE4FD33] ml-3" aria-hidden="true">
        &bull;
      </span>
    </div>
  );
}

export function LiveTicker({ className }: LiveTickerProps) {
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
            {mockEvents.map((event, i) => (
              <TickerItem key={`${copy}-${i}`} event={event} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
