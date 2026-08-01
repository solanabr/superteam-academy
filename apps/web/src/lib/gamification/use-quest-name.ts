"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { questDisplayName } from "./quest-name";

/**
 * Localized display name for a quest id.
 *
 * The content bundle's `quest.name` is authored in English only, and the
 * Realtime channel sees nothing but the id inside `daily_quest:<questId>` — so
 * neither source can produce a pt-BR/es name. The catalogs carry the curated
 * set under `gamification.questNames.<questId>`; an id with no entry (a quest
 * added to the bundle before its catalog rows land) degrades to the derived
 * English slug rather than rendering a raw id.
 */
export function useQuestName(): (questId: string) => string {
  const t = useTranslations("gamification");
  return useCallback(
    (questId: string) => {
      const key = `questNames.${questId}`;
      return t.has(key) ? t(key) : questDisplayName(questId);
    },
    [t]
  );
}
