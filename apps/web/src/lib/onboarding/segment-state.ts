/**
 * Pre-auth segment state for the /start intake (LX-A3).
 *
 * The intake is anonymous-friendly: a signed-out learner taps through it and we
 * keep their answers in `localStorage`, framed as "saved on this device". On
 * sign-in the state is copied into their `profiles` row (SegmentSync) and the
 * DB becomes authoritative — mirroring how the anonymous progress bank
 * (`lib/lessons/progress-bank.ts`) survives the sign-in wall.
 *
 * Only closed-set ids are stored — never free text. `interests` are kept for a
 * returning-to-the-flow learner's re-selected chips but are not copied to the
 * DB (the migration adds exactly segment/goal/daily_goal).
 */

import type { LearnerSegment, GoalId } from "@/lib/courses/learner-segment";
import { isGoalId } from "@/lib/courses/learner-segment";
import type { ExperienceId, InterestId } from "@/lib/onboarding/intake";
import {
  EXPERIENCE_TO_SEGMENT,
  isExperienceId,
  isInterestId,
} from "@/lib/onboarding/intake";

const STORAGE_KEY = "superteam:segment-state:v1";

export interface SegmentState {
  /** Screen 1 answer; the segment is derived from this, never stored separately. */
  experience: ExperienceId;
  /** Routing segment derived from `experience` (kept denormalized for cheap reads). */
  segment: LearnerSegment;
  /** Screen 2 goal, once chosen. */
  goal?: GoalId;
  /** Screen 3 interest chips (optional/skippable). */
  interests?: InterestId[];
  /** Screen 4 daily lesson goal — an integer matching an existing quest target. */
  dailyGoal?: number;
  /** Epoch ms of the last write — the copy-on-signin ordering signal. */
  updatedAt: number;
}

function isSegmentState(value: unknown): value is SegmentState {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  if (!isExperienceId(v.experience)) return false;
  if (v.segment !== 1 && v.segment !== 2 && v.segment !== 3) return false;
  if (typeof v.updatedAt !== "number" || !Number.isFinite(v.updatedAt)) {
    return false;
  }
  if (v.goal !== undefined && !isGoalId(v.goal)) return false;
  if (
    v.interests !== undefined &&
    (!Array.isArray(v.interests) || !v.interests.every(isInterestId))
  ) {
    return false;
  }
  if (
    v.dailyGoal !== undefined &&
    (typeof v.dailyGoal !== "number" ||
      !Number.isInteger(v.dailyGoal) ||
      v.dailyGoal <= 0)
  ) {
    return false;
  }
  return true;
}

/** Reads the stored intake state, or null when absent/corrupt/unavailable. */
export function readSegmentState(): SegmentState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isSegmentState(parsed) ? parsed : null;
  } catch {
    // Private mode / quota / garbage → treat as no stored state.
    return null;
  }
}

export function hasSegmentState(): boolean {
  return readSegmentState() !== null;
}

function write(state: SegmentState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Best-effort — a storage failure must never break the intake flow.
  }
}

/**
 * Sets the experience answer (screen 1), deriving the routing segment. Starting
 * a fresh fork resets the downstream answers so a re-fork can't strand a stale
 * goal/daily-goal from a previous run.
 */
export function setExperience(experience: ExperienceId): SegmentState {
  const next: SegmentState = {
    experience,
    segment: EXPERIENCE_TO_SEGMENT[experience],
    updatedAt: Date.now(),
  };
  write(next);
  return next;
}

/** Merges later-screen answers into the existing state (screen 1 must precede). */
export function updateSegmentState(
  patch: Partial<Omit<SegmentState, "experience" | "segment" | "updatedAt">>
): SegmentState | null {
  const current = readSegmentState();
  if (!current) return null;
  const next: SegmentState = { ...current, ...patch, updatedAt: Date.now() };
  write(next);
  return next;
}

export function clearSegmentState(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Best-effort.
  }
}
