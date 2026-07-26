/**
 * Closed-set option definitions for the /start intake (LX-A2).
 *
 * This module is the single source of truth for the intake's answer sets: the
 * UI renders from these lists and the analytics funnel emits their ids as
 * closed-set strings (never free text — the intake is tap-only, zero data
 * entry). Screen 1 (experience) maps onto a `LearnerSegment` for routing;
 * screens 2–4 (goal, interests, daily goal) feed framing copy, funnel
 * analytics, and the stored daily-goal commitment respectively.
 *
 * Labels live in i18n (the `start` namespace); only stable ids and icon names
 * live here so payloads and storage stay locale-independent.
 */

import type { GoalId, LearnerSegment } from "@/lib/courses/learner-segment";
import { GOAL_IDS } from "@/lib/courses/learner-segment";

/**
 * Screen 1 — experience fork. Every option is a VERIFIABLE-HISTORY statement
 * ("have you shipped X?"), never a self-rating (S10): a learner reports what
 * they have done, not how good they think they are.
 *
 *   js_ts — has shipped apps with JavaScript/TypeScript (→ segment 1, CORE web2)
 *   web3  — has written smart contracts / shipped on-chain (→ segment 2, web3 dev)
 *   new   — has not written code professionally yet (→ segment 3, beginner)
 */
export type ExperienceId = "js_ts" | "web3" | "new";

export const EXPERIENCE_IDS: readonly ExperienceId[] = [
  "js_ts",
  "web3",
  "new",
] as const;

/** Experience answer → routing segment (LX-A3). */
export const EXPERIENCE_TO_SEGMENT: Record<ExperienceId, LearnerSegment> = {
  js_ts: 1,
  web3: 2,
  new: 3,
};

export function isExperienceId(value: unknown): value is ExperienceId {
  return (
    typeof value === "string" &&
    (EXPERIENCE_IDS as readonly string[]).includes(value)
  );
}

/**
 * Screen 3 — optional value-relevance chips (skippable). Multi-select interest
 * areas. Consumed by the funnel event (onboarding_step_completed step 3); not
 * persisted to a profiles column (the migration adds exactly segment/goal/
 * daily_goal). Kept in local intake state so a returning-to-the-flow learner
 * sees their picks re-selected.
 */
export type InterestId =
  | "defi"
  | "nfts"
  | "payments"
  | "gaming"
  | "infra"
  | "ai";

export const INTEREST_IDS: readonly InterestId[] = [
  "defi",
  "nfts",
  "payments",
  "gaming",
  "infra",
  "ai",
] as const;

export function isInterestId(value: unknown): value is InterestId {
  return (
    typeof value === "string" &&
    (INTEREST_IDS as readonly string[]).includes(value)
  );
}

/** Screen 2 goal ids, re-exported so the intake UI has one import surface. */
export { GOAL_IDS };
export type { GoalId };

/** An intake option with a stable id and the i18n key of its label/description. */
export interface IntakeOption<TId extends string> {
  id: TId;
  /** i18n key under the `start` namespace for the option's headline. */
  labelKey: string;
  /** i18n key for the supporting one-liner (omitted for compact chips). */
  descKey?: string;
  /** Phosphor icon name rendered by the screen (decorative, aria-hidden). */
  icon: string;
}

export const EXPERIENCE_OPTIONS: readonly IntakeOption<ExperienceId>[] = [
  {
    id: "js_ts",
    labelKey: "exp.jsTs.label",
    descKey: "exp.jsTs.desc",
    icon: "Code",
  },
  {
    id: "web3",
    labelKey: "exp.web3.label",
    descKey: "exp.web3.desc",
    icon: "Cube",
  },
  {
    id: "new",
    labelKey: "exp.new.label",
    descKey: "exp.new.desc",
    icon: "Sparkle",
  },
] as const;

export const GOAL_OPTIONS: readonly IntakeOption<GoalId>[] = [
  {
    id: "job",
    labelKey: "goal.job.label",
    descKey: "goal.job.desc",
    icon: "Briefcase",
  },
  {
    id: "build",
    labelKey: "goal.build.label",
    descKey: "goal.build.desc",
    icon: "Rocket",
  },
  {
    id: "explore",
    labelKey: "goal.explore.label",
    descKey: "goal.explore.desc",
    icon: "Compass",
  },
] as const;

export const INTEREST_OPTIONS: readonly IntakeOption<InterestId>[] = [
  { id: "defi", labelKey: "interest.defi", icon: "ChartLine" },
  { id: "nfts", labelKey: "interest.nfts", icon: "ImageSquare" },
  { id: "payments", labelKey: "interest.payments", icon: "CurrencyDollar" },
  { id: "gaming", labelKey: "interest.gaming", icon: "GameController" },
  { id: "infra", labelKey: "interest.infra", icon: "Stack" },
  { id: "ai", labelKey: "interest.ai", icon: "Brain" },
] as const;

/**
 * Screen 4 — daily-goal picker, WIRED TO EXISTING QUEST TARGETS (LX-A2). The
 * options are not invented numbers: they are the distinct target values of the
 * daily lesson-completion quests in the content bundle, so a learner's chosen
 * daily goal always corresponds to a quest that actually exists (choosing "3"
 * lines up with the "Complete 3 Lessons" quest). If content adds a new daily
 * lesson quest, the picker grows with it — no code change here.
 *
 * The quest bundle is read server-side (`dailyGoalOptionsFromQuests`) and the
 * resulting integers are passed to the client, keeping this module free of a
 * content-bundle import at module scope.
 */
export interface QuestTargetSource {
  type: string;
  resetType: string;
  targetValue: number;
}

/** Quest types whose target is "N lessons in a day" — the daily-goal substrate. */
const DAILY_LESSON_QUEST_TYPES = new Set(["lesson", "lesson_batch"]);

/**
 * Distinct daily lesson-completion targets, ascending. Falls back to a single
 * one-lesson goal if the bundle somehow carries no daily lesson quest, so the
 * picker is never empty.
 */
export function dailyGoalOptionsFromQuests(
  quests: readonly QuestTargetSource[]
): number[] {
  const targets = new Set<number>();
  for (const q of quests) {
    if (
      DAILY_LESSON_QUEST_TYPES.has(q.type) &&
      q.resetType === "daily" &&
      Number.isInteger(q.targetValue) &&
      q.targetValue > 0
    ) {
      targets.add(q.targetValue);
    }
  }
  if (targets.size === 0) return [1];
  return [...targets].sort((a, b) => a - b);
}
