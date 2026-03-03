/**
 * Seasonal events system for advanced gamification.
 * Events are time-limited promotions that grant XP bonuses and special achievements.
 */

export interface SeasonalEvent {
  /** Unique event identifier used for localStorage dismiss flag */
  id: string;
  /** i18n key for the event name (under dashboard.events) */
  nameKey: string;
  /** i18n key for the event description (under dashboard.events) */
  descriptionKey: string;
  /** UTC start of the event */
  startDate: Date;
  /** UTC end of the event */
  endDate: Date;
  /** Bonus XP percentage (50 = +50% XP on all lessons during event) */
  xpBonusPercent: number;
  /** Emoji badge displayed in the banner */
  badge: string;
  /** Optional link for a "Learn More" CTA */
  learnMoreUrl?: string;
}

/**
 * All defined seasonal events (past, present, and future).
 * Add new events here — they activate automatically based on dates.
 */
const SEASONAL_EVENTS: SeasonalEvent[] = [
  {
    id: "devnet-sprint-feb-2026",
    nameKey: "devnetSprint.name",
    descriptionKey: "devnetSprint.description",
    startDate: new Date("2026-02-20T00:00:00Z"),
    endDate: new Date("2026-02-28T23:59:59Z"),
    xpBonusPercent: 50,
    badge: "⚡",
  },
  {
    id: "hack-season-mar-2026",
    nameKey: "hackSeason.name",
    descriptionKey: "hackSeason.description",
    startDate: new Date("2026-03-01T00:00:00Z"),
    endDate: new Date("2026-03-14T23:59:59Z"),
    xpBonusPercent: 100,
    badge: "🏆",
  },
  {
    id: "solana-birthday-apr-2026",
    nameKey: "solanaBirthday.name",
    descriptionKey: "solanaBirthday.description",
    startDate: new Date("2026-03-16T00:00:00Z"),
    endDate: new Date("2026-03-23T23:59:59Z"),
    xpBonusPercent: 75,
    badge: "🎂",
  },
];

/**
 * Returns the currently active event, or null if none is active.
 */
export function getActiveEvent(): SeasonalEvent | null {
  const now = new Date();
  return (
    SEASONAL_EVENTS.find((e) => now >= e.startDate && now <= e.endDate) ?? null
  );
}

/**
 * Returns the next upcoming event (soonest future start date), or null.
 */
export function getUpcomingEvent(): SeasonalEvent | null {
  const now = new Date();
  const upcoming = SEASONAL_EVENTS.filter((e) => e.startDate > now).sort(
    (a, b) => a.startDate.getTime() - b.startDate.getTime(),
  );
  return upcoming[0] ?? null;
}

/**
 * Formats the remaining time until a target date as a human-readable string.
 * Returns strings like "2d 4h", "3h 15m", "45m", "Just ended".
 */
export function formatTimeRemaining(endDate: Date): string {
  const now = new Date();
  const diffMs = endDate.getTime() - now.getTime();

  if (diffMs <= 0) return "Just ended";

  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

/**
 * Checks whether the user has dismissed a specific event banner.
 */
export function isEventDismissed(eventId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const dismissed = JSON.parse(
      localStorage.getItem("sta_dismissed_events") ?? "[]",
    ) as string[];
    return dismissed.includes(eventId);
  } catch {
    return false;
  }
}

/**
 * Marks an event as dismissed in localStorage.
 */
export function dismissEvent(eventId: string): void {
  if (typeof window === "undefined") return;
  try {
    const dismissed = JSON.parse(
      localStorage.getItem("sta_dismissed_events") ?? "[]",
    ) as string[];
    if (!dismissed.includes(eventId)) {
      dismissed.push(eventId);
      localStorage.setItem("sta_dismissed_events", JSON.stringify(dismissed));
    }
  } catch {
    // Ignore localStorage errors
  }
}
