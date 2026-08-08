/**
 * The public roadmap (#876, personalization research C11: "the post-launch
 * cadence is itself marketing").
 *
 * Two rules govern this file:
 *
 * 1. **Shipped entries are dated, and the date is the merge date of the change
 *    that shipped them** — sourced from git history, not from a plan. Each
 *    entry carries the evidence in a comment so the next editor can re-check it
 *    instead of trusting the list.
 * 2. **Planned entries carry no date.** The roadmap is a public commitment
 *    surface; a date goes up only once the owner has confirmed it. An undated
 *    "next up" is honest, an invented date is not.
 *
 * Copy lives in the `roadmap` message namespace (three locales); only ids and
 * ISO dates live here, so dates format per locale at render time.
 */

export interface RoadmapEntry {
  /** Stable id — also the i18n key under `roadmap.items`. */
  id: string;
}

export interface ShippedEntry extends RoadmapEntry {
  /** ISO date (YYYY-MM-DD) the change landed on main. */
  date: string;
}

/** Newest first. */
export const ROADMAP_SHIPPED: readonly ShippedEntry[] = [
  // "feat(email): reminder consent toggle + session-plan reminder send (#869)"
  { id: "reminders", date: "2026-07-31" },
  // "feat(ai): assist ladder — free tier, Socratic mode, community handoff,
  //  self-reset (#864)" + per-action model routing (#868)
  { id: "aiTutor", date: "2026-07-30" },
  // "content: bump content.lock — C1 + EVM elective + reflection prompts (#892)"
  // completes the five-course Zero to Deployed path (C1→C5).
  { id: "ladder", date: "2026-07-30" },
  // "feat(leaderboard): cohort leagues + you-±3 strip (#574)"
  { id: "leagues", date: "2026-07-26" },
  // "feat(db): add community forum core tables / RLS / triggers"
  { id: "forum", date: "2026-03-01" },
  // "feat: on-chain enrollment, XP, credentials and finalization flow"
  { id: "credentials", date: "2026-02-18" },
] as const;

/**
 * Next up — deliberately undated. Both are real, in-flight work:
 * `evm` is authored but PARKED under `_draft/` in academy-courses as of the
 * public-alpha bump (2026-08-04), so it is no longer in the compiled bundle —
 * still "next up", now further out; `notifications` extends the email reminders
 * that shipped on 2026-07-31.
 *
 * Both these entries and the shipped `ladder` entry above describe the parked
 * track-1 catalog. They are marketing claims, not content reads, so the alpha
 * bump left them for an editorial pass rather than silently rewriting the
 * public roadmap.
 */
export const ROADMAP_NEXT: readonly RoadmapEntry[] = [
  { id: "evm" },
  { id: "notifications" },
] as const;

/** Locale-aware long date for a roadmap entry (e.g. "30 July 2026"). */
export function formatRoadmapDate(iso: string, locale: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  // Constructed as UTC and formatted in UTC so the printed day never shifts
  // with the server's timezone.
  const date = new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1));
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}
