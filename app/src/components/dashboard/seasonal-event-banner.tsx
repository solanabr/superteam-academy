"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { X, Zap, Clock } from "lucide-react";
import {
  getActiveEvent,
  formatTimeRemaining,
  isEventDismissed,
  dismissEvent,
  type SeasonalEvent,
} from "@/lib/events";

/** Updates the time-remaining string every minute. */
function useCountdown(endDate: Date | null): string {
  const [remaining, setRemaining] = useState<string>(
    endDate ? formatTimeRemaining(endDate) : ""
  );

  useEffect(() => {
    if (!endDate) return;
    const tick = () => setRemaining(formatTimeRemaining(endDate));
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [endDate]);

  return remaining;
}

interface SeasonalEventBannerProps {
  /** Optional override for testing; defaults to the live active event. */
  event?: SeasonalEvent | null;
}

/**
 * Displays a dismissible seasonal event banner when a time-limited XP bonus event
 * is currently active. Persists the dismissed state to localStorage so the banner
 * does not re-appear after the user closes it.
 */
export function SeasonalEventBanner({ event: eventProp }: SeasonalEventBannerProps) {
  const t = useTranslations("dashboard.events");

  // Resolve the active event (from prop or live detection)
  const event = useMemo<SeasonalEvent | null>(() => {
    const active = eventProp !== undefined ? eventProp : getActiveEvent();
    return active ?? null;
  }, [eventProp]);

  const [dismissed, setDismissed] = useState(() => {
    if (!event) return true;
    return isEventDismissed(event.id);
  });

  const timeRemaining = useCountdown(event?.endDate ?? null);

  const handleDismiss = () => {
    if (!event) return;
    dismissEvent(event.id);
    setDismissed(true);
  };

  const [now] = useState(() => Date.now());

  if (!event || dismissed) return null;

  const isEndingSoon =
    event.endDate.getTime() - now < 24 * 60 * 60 * 1000; // < 24h

  return (
    <div
      role="alert"
      aria-live="polite"
      className="mb-6 rounded-xl border border-brazil-gold/30 bg-brazil-gold/5 px-4 py-3"
    >
      <div className="flex items-center gap-3">
        {/* Event badge */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brazil-gold/10 text-xl">
          {event.badge}
        </div>

        {/* Event info */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t("activeNow")}
            </span>
            {isEndingSoon && (
              <span className="rounded-full bg-destructive/20 px-2 py-0.5 text-xs font-medium text-destructive">
                {t("endingSoon")}
              </span>
            )}
          </div>

          <p className="font-semibold text-brazil-gold">
            {t(event.nameKey as Parameters<typeof t>[0])}
          </p>

          <p className="text-xs text-muted-foreground line-clamp-1">
            {t(event.descriptionKey as Parameters<typeof t>[0])}
          </p>
        </div>

        {/* XP bonus pill + time remaining */}
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span className="flex items-center gap-1 rounded-full bg-xp/15 px-3 py-1 text-sm font-bold text-xp">
            <Zap className="h-3.5 w-3.5" />
            {t("xpBonus", { percent: event.xpBonusPercent })}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {t("endsIn", { time: timeRemaining })}
          </span>
        </div>

        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          aria-label={t("dismiss")}
          className="shrink-0 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
