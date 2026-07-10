import { z } from "zod";
import { QuestId } from "./ids";
import { MAX_XP_PER_MINT, QUEST_TYPES } from "./constants";

/**
 * `get_daily_quest_state` branches on `type` with an IF/ELSIF chain and no final
 * ELSE, so an unknown type computes `v_current = 0` and silently never awards.
 * It also compares `v_current >= v_target` with no guard, so `targetValue: 0`
 * completes every day and mints free XP. Sanity's `required().min(1)` never runs
 * on programmatic writes. This schema is the only gate.
 */
export const Quest = z.object({
  id: QuestId,
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(QUEST_TYPES),
  icon: z.string().optional(),
  xpReward: z.number().int().min(1).max(MAX_XP_PER_MINT),
  targetValue: z.number().int().min(1),
  // NOTE: get_daily_quest_state assigns v_reset_type (schema.sql:34) but NEVER
  // reads it — v_period is set by other branches — so this field currently has
  // no behavioural effect. It is kept because the DailyQuest type and the RPC
  // signature carry it; wiring or dropping it is a Supabase+app change tracked
  // as a bug (spec §14.13), not a content-schema change.
  resetType: z.enum(["daily", "multi_day"]),
  active: z.boolean().default(true),
});

export type QuestT = z.infer<typeof Quest>;
