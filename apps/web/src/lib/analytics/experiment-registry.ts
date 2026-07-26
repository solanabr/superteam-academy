/**
 * Experiment registry — the 10–12 week evaluation rule, encoded (#605, item 48).
 *
 * PED-15 (novelty trough, N=756 Brazilian CS1 undergraduates) is the load-bearing
 * evidence: a gamification novelty effect dips at week 4, recovers by weeks 6–10,
 * and is net positive only at week 14. PED-31 and MAS-29 concur. The consequence
 * for this launch is a hard rule:
 *
 *   **No mechanic is evaluated before week 10 of learner exposure. Week-3 numbers lie.**
 *
 * This module encodes that rule in code so an engineer reading a metric cannot
 * treat an early read as decision-grade. Each shipped mechanic gets one row; the
 * earliest date a row may be read is computed as exposure-start + 10 weeks, never
 * typed. The clock starts at *learner exposure* (production launch), not at the
 * merge date — the novelty trough is measured from the moment a learner first sees
 * the mechanic, so anchoring the window to a merge that predates launch would read
 * the trough too early and defeat the rule.
 *
 * Scope: this is the minimal registry substrate item 48's rule needs to point at.
 * Item 45 (#582's third component) owns growing it into the full experiment
 * registry — E1–E8, the UIUX A/B sets, and E6 as INFEASIBLE-AS-DESIGNED.
 */

/** The evaluation-window floor from PED-15/PED-31/MAS-29. Weeks, not days. */
export const EVALUATION_WINDOW_WEEKS = 10;

/** The floor in days: 10 weeks × 7. This is the earliest-read offset. */
export const EVALUATION_WINDOW_DAYS = EVALUATION_WINDOW_WEEKS * 7;

/**
 * Production launch date = exposure start for every launch-cohort mechanic below.
 * `null` until launch is scheduled: while it is null, no launch-cohort row has a
 * computable earliest-read date, which is the correct state — the novelty clock
 * has not started, so nothing may be evaluated yet. Set this to an ISO date
 * (`YYYY-MM-DD`) the day launch exposure begins and every earliest-read date
 * recomputes from it.
 */
export const LAUNCH_DATE: string | null = null;

export type ExperimentStatus =
  /** Code merged to main; awaiting launch exposure. Evaluation clock not yet started. */
  | "merged-pre-launch"
  /** Exposed to learners on `exposureStart`; the evaluation clock is running. */
  | "live"
  /** Filed and planned; not yet merged. */
  | "planned"
  /** Ruled out at design time; kept as a row so it is not re-proposed. */
  | "infeasible-as-designed";

export interface ExperimentRegistryEntry {
  /** Stable slug. */
  id: string;
  /** The shipped mechanic or the experiment under test. */
  mechanic: string;
  /** Tracking issue, when one exists. */
  issue?: number;
  /** What we expect to move, and in which direction. */
  hypothesis: string;
  /** The single metric this row is judged on. */
  primaryMetric: string;
  /** Unit of exposure/assignment (learner, cohort, session, …). */
  exposureUnit: string;
  /**
   * When exposure to learners begins. `null` means "the shared launch date"
   * (`LAUNCH_DATE`); set a per-row ISO date only for a mechanic that starts on
   * its own schedule rather than at launch.
   */
  exposureStart?: string | null;
  /** When the code landed on main. Informational — NOT the evaluation clock. */
  mergedDate?: string;
  /** The finding this mechanic rests on. */
  evidenceBasis: string;
  /** Direction pre-registered before any read (item 43: preregister direction, not doubling). */
  preregisteredDirection: string;
  status: ExperimentStatus;
}

/**
 * Launch-cycle mechanics. `mergedDate` values are the real merge dates of the
 * closing PRs; `exposureStart` is left at the shared `LAUNCH_DATE` because none
 * of these are exposed to learners until production launch.
 */
export const EXPERIMENT_REGISTRY: readonly ExperimentRegistryEntry[] = [
  {
    id: "celebration-retiering",
    mechanic:
      "Celebration re-tiering — confetti only at deploy + credential mint",
    issue: 549,
    hypothesis:
      "Reserving the full celebration for deploy/mint (not every lesson) raises the signal without training reward-seeking.",
    primaryMetric: "weekly return of previously-active learners",
    exposureUnit: "learner",
    mergedDate: "2026-07-26",
    evidenceBasis: "PED-10 overjustification; UIU-09 reward framing",
    preregisteredDirection:
      "no drop in weekly return; celebration events concentrate at deploy/mint",
    status: "merged-pre-launch",
  },
  {
    id: "prominence-demotion",
    mechanic: "Launch prominence demotion — streaks + global leaderboard",
    issue: 583,
    hypothesis:
      "Demoting the raw streak counter and global absolute board reduces the maladaptive grinding UIU-08 documented, without cutting return.",
    primaryMetric: "weekly return of previously-active learners",
    exposureUnit: "learner",
    mergedDate: "2026-07-26",
    evidenceBasis:
      "UIU-08 GitHub streak-removal natural experiment; PED-14/UIU-09 leaderboards",
    preregisteredDirection:
      "weekly return holds or rises; weekend/one-token grinding falls",
    status: "merged-pre-launch",
  },
  {
    id: "endowed-progress",
    mechanic: "Endowed progress with stated reasons",
    issue: 584,
    hypothesis:
      "A first progress tick granted with a stated reason increases early-course continuation.",
    primaryMetric: "lesson-2 continuation rate",
    exposureUnit: "learner",
    mergedDate: "2026-07-26",
    evidenceBasis:
      "endowed-progress effect (Nunes & Drèze); stated-reason framing",
    preregisteredDirection: "higher lesson-2 continuation vs no endowed tick",
    status: "merged-pre-launch",
  },
  {
    id: "continue-card",
    mechanic: "Continue card (resume affordance)",
    issue: 551,
    hypothesis:
      "A resume-where-you-left-off card raises return-session lesson starts vs a static first-lesson CTA.",
    primaryMetric: "return-session lesson-start rate",
    exposureUnit: "learner",
    mergedDate: "2026-07-26",
    evidenceBasis: "resumption-friction reduction (UIUX continue-hero set)",
    preregisteredDirection: "higher return-session lesson starts",
    status: "merged-pre-launch",
  },
  {
    id: "earn-handoff",
    mechanic: "Earn handoff card at the post-mint moment",
    issue: 553,
    hypothesis:
      "Surfacing an Earn handoff right after the credential mint converts completion into a bounty submission (E8).",
    primaryMetric: "Earn submission within 30 days of handoff",
    exposureUnit: "learner",
    mergedDate: "2026-07-26",
    evidenceBasis:
      "E8 (personalization report); launch KPI = capstone deploys + Earn submissions",
    preregisteredDirection:
      "non-zero Earn submissions attributable to the handoff",
    status: "merged-pre-launch",
  },
  {
    id: "share-nudge",
    mechanic: "LinkedIn Add-to-Profile + post-mint share nudge",
    issue: 552,
    hypothesis:
      "A post-mint share nudge lifts credential shares without harming return.",
    primaryMetric: "credential_share_click rate per mint",
    exposureUnit: "learner",
    mergedDate: "2026-07-26",
    evidenceBasis: "credentialed-share funnel (personalization report)",
    preregisteredDirection: "higher shares per mint; no drop in weekly return",
    status: "merged-pre-launch",
  },
  {
    id: "quiz-feedback",
    mechanic: "Quiz feedback rendering + 403 mismap + AI suppression",
    issue: 564,
    hypothesis:
      "Explanatory quiz feedback improves comprehension-check first-attempt accuracy — the transfer half PED-02 says verbatim recall does not buy.",
    primaryMetric: "comprehension-check first-attempt accuracy",
    exposureUnit: "learner",
    mergedDate: "2026-07-26",
    evidenceBasis:
      "PED-01 retrieval practice; PED-02 transfer requires explanatory feedback",
    preregisteredDirection: "higher first-attempt accuracy on later checks",
    status: "merged-pre-launch",
  },
  {
    id: "stuck-nudge",
    mechanic:
      "Stuck-nudge v1 — authored hint offered in-editor after N failed runs",
    issue: 576,
    hypothesis:
      "Surfacing a free authored hint in-editor after repeated failed runs raises the post-nudge solve rate without learners abandoning the challenge.",
    primaryMetric: "post-nudge solve rate",
    exposureUnit: "learner",
    mergedDate: "2026-07-26",
    evidenceBasis:
      "UIUX experiment #7 (authored per-challenge scaffolding); F17 authored beats LLM-generated",
    preregisteredDirection:
      "higher solve rate among nudge-exposed learners; no rise in challenge abandonment",
    status: "merged-pre-launch",
  },
  {
    id: "streak-freeze-insurance",
    mechanic:
      "Streak forgiveness / absence insurance (one PR, all streak paths)",
    issue: 573,
    hypothesis:
      "Absence insurance before prominence reduces streak abandonment after a missed day (forgiveness-before-prominence).",
    primaryMetric: "post-miss streak-continuation rate",
    exposureUnit: "learner",
    evidenceBasis: "UIU-08; Sharif & Shu forgiveness",
    preregisteredDirection: "higher continuation after a missed day",
    status: "planned",
  },
];

/**
 * Earliest date a row may be read: exposure-start + 10 weeks, computed. Returns
 * `null` when exposure has not started (no launch date), because a read date does
 * not exist until the novelty clock does.
 */
export function earliestReadDate(
  exposureStart: string | null | undefined
): string | null {
  if (!exposureStart) return null;
  return addDays(exposureStart, EVALUATION_WINDOW_DAYS);
}

/** Resolves a row's exposure start: its own override, else the shared launch date. */
export function exposureStartFor(
  entry: ExperimentRegistryEntry
): string | null {
  return entry.exposureStart ?? LAUNCH_DATE;
}

export interface ExperimentRow extends ExperimentRegistryEntry {
  /** Resolved exposure start (override ?? LAUNCH_DATE). */
  resolvedExposureStart: string | null;
  /** exposure-start + 10 weeks, or null while the clock has not started. */
  earliestReadDate: string | null;
}

/** The registry with the earliest-read column computed for each row. */
export function registryWithEarliestRead(): ExperimentRow[] {
  return EXPERIMENT_REGISTRY.map((entry) => {
    const resolvedExposureStart = exposureStartFor(entry);
    return {
      ...entry,
      resolvedExposureStart,
      earliestReadDate: earliestReadDate(resolvedExposureStart),
    };
  });
}

/**
 * True once `on` (default: today) has reached a row's earliest-read date. False
 * whenever the clock has not started or the window has not elapsed — so a caller
 * that gates on this fails closed inside the novelty trough.
 */
export function isReadable(
  entry: ExperimentRegistryEntry,
  on: Date = new Date()
): boolean {
  const earliest = earliestReadDate(exposureStartFor(entry));
  if (!earliest) return false;
  return on.getTime() >= parseIsoDateUtc(earliest).getTime();
}

/** Parses a `YYYY-MM-DD` string as a UTC midnight Date. */
function parseIsoDateUtc(isoDate: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) {
    throw new Error(`Expected an ISO date (YYYY-MM-DD), received: ${isoDate}`);
  }
  const [, year, month, day] = match;
  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
}

/** Adds whole days to a `YYYY-MM-DD` string, in UTC, returning `YYYY-MM-DD`. */
function addDays(isoDate: string, days: number): string {
  const date = parseIsoDateUtc(isoDate);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
