/**
 * Human display name for a quest id (pure — safe to unit test).
 *
 * The authoritative name is the content bundle's `quest.name`, which the
 * dashboard poll already carries. The REALTIME channel observes a quest reward
 * as an `xp_transactions` row whose only quest handle is the id inside
 * `daily_quest:<questId>`, so it needs this fallback to name the quest in the
 * celebration toast without a content round trip.
 *
 * `quest-complete-lesson` → `Complete Lesson`. Same shape the dashboard
 * activity feed already renders for quest XP rows, factored here so both
 * surfaces agree.
 */
export function questDisplayName(questId: string): string {
  return questId
    .replace(/^quest-/, "")
    .replace(/[-_]/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
