import type { QuestType } from "@superteam-lms/types";

/**
 * Per-quest-type deep-link targets (the locale prefix is added by `questHref`).
 * Only quest kinds that have a learner surface to open appear here; a quest
 * whose type is absent renders as a plain, non-interactive card (the prior
 * behavior of every quest div).
 *
 * `review` → `/review` (LX-B5). Sequencing (LX-B7 deps LX-B5): a review quest
 * only renders once its content YAML is authored in courses-academy AND
 * activated by a monorepo content.lock bump, and that activation lands after
 * the /review page ships — so this href can never resolve to a dead route from
 * this code change alone.
 */
const QUEST_HREFS: Partial<Record<QuestType, string>> = {
  review: "/review",
};

/**
 * Locale-prefixed href for a quest card, or `null` when the quest type has no
 * destination surface (the card then renders as a non-link).
 */
export function questHref(type: QuestType, locale: string): string | null {
  const path = QUEST_HREFS[type];
  return path ? `/${locale}${path}` : null;
}
