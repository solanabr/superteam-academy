"use client";

import {
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Lightning } from "@phosphor-icons/react";
import { getAllAchievements } from "@/lib/content/client-queries";
import { celebrate } from "@/lib/gamification/celebration";
import { setRewardQueueLength } from "@/lib/gamification/reward-queue-state";
import { useQuestName } from "@/lib/gamification/use-quest-name";
import { cn } from "@/lib/utils";
import { AchievementPatch } from "@/components/gamification/achievement-patch";
import { GlyphChip } from "@/components/gamification/glyph-chip";
import type { PatchCategory } from "@/components/gamification/patch-look";
import {
  ACHIEVEMENT_UNLOCK_EVENT,
  ACHIEVEMENT_XP_EVENT,
  type AchievementUnlockDetail,
  type AchievementXpDetail,
} from "./achievement-unlock";
import { LEVEL_UP_EVENT } from "./level-up-popup";
import { QUEST_REWARD_EVENT } from "./quest-reward-toast";

/**
 * The reward popup queue — the single presentation surface for every recurring
 * reward moment: level-up, daily-quest completion and achievement unlocks.
 *
 * Owner reversal 2026-08-01: these shipped as small success toasts (the
 * level-up got nothing at all after #955/#957 removed its popup). The owner
 * found that too cheap for what the moments represent, so they render
 * pop-spring popup cards. This supersedes the earlier PED-10
 * minimal-celebration reading; see the tier map in lib/gamification/celebration.ts.
 *
 * CHOREOGRAPHY REWORK 24-08 (owner-approved). A first lesson could stack six to
 * eight reward surfaces across ~25 seconds. Three changes fixed that:
 *   1. Achievement unlocks join this queue instead of rendering in their own
 *      parallel column, where two unlocks meant two simultaneous cards.
 *   2. A moment plays at most 3 cards: two rewards, then one summary card for
 *      everything still waiting.
 *   3. The beat dropped 5s → 3.5s, so a full moment runs ~7s.
 * The certificate popup + confetti now wait for this queue to drain
 * (lib/gamification/reward-queue-state.ts).
 *
 * REMOVED 24-08: the LX-B15 surprise bonus. The owner cut the feature outright —
 * its server roll, its dispatcher and its card are gone. Historical
 * `surprise_bonus:` rows still render in the dashboard activity feed.
 *
 * What did NOT change: confetti is still reserved by LX-B11 for deploy +
 * credential mint. Every event routed here resolves to the "popup" tier, which
 * celebrate() guarantees is confetti-free.
 */

/** How long one reward holds the stage before the queue advances. */
export const REWARD_POPUP_DURATION_MS = 3500;

/**
 * Individual cards one moment may play before the rest collapse into a single
 * summary card. Two played + one summary = the 3-card ceiling.
 */
export const MAX_INDIVIDUAL_REWARD_CARDS = 2;

type RewardItem =
  | { kind: "level-up"; uid: number; level: number }
  | { kind: "daily-quest"; uid: number; questId: string; xpReward: number }
  | {
      kind: "achievement";
      uid: number;
      achievementId: string;
      name: string;
      xpReward: number;
    };

interface TokenInfo {
  glyph: string;
  name: string;
  solTier: boolean;
  category: string;
}

// Module-level so uids stay unique across an effect re-run or a remount —
// a collision would let the dismiss filter drop the wrong queue entry.
let uidCounter = 0;

function xpOf(item: RewardItem): number {
  switch (item.kind) {
    case "level-up":
      return 0;
    case "daily-quest":
      return item.xpReward;
    case "achievement":
      return item.xpReward;
  }
}

export function RewardPopupQueue({ className }: { className?: string }) {
  const t = useTranslations("gamification");
  const questName = useQuestName();
  const router = useRouter();
  const params = useParams();
  const locale = typeof params.locale === "string" ? params.locale : "en";

  const [queue, setQueue] = useState<RewardItem[]>([]);
  /** Individual cards already played in this moment; resets when the queue empties. */
  const [played, setPlayed] = useState(0);

  const enqueue = useCallback((item: RewardItem) => {
    setQueue((prev) => [...prev, item]);
  }, []);

  useEffect(() => {
    const nextUid = () => (uidCounter += 1);

    // One level-up card per moment: a burst of XP can cross two level
    // boundaries within a second, and two "Level Up" cards in a row read as a
    // bug. The pending card absorbs the higher level instead.
    const onLevelUp = (e: Event) => {
      const { level } = (e as CustomEvent<{ level: number }>).detail;
      setQueue((prev) => {
        const index = prev.findIndex((item) => item.kind === "level-up");
        if (index === -1) {
          return [...prev, { kind: "level-up", uid: nextUid(), level }];
        }
        const existing = prev[index];
        if (existing?.kind !== "level-up" || level <= existing.level) {
          return prev;
        }
        const next = [...prev];
        next[index] = { ...existing, level };
        return next;
      });
    };
    const onQuestReward = (e: Event) => {
      const { questId, xpReward } = (
        e as CustomEvent<{ questId: string; xpReward: number }>
      ).detail;
      enqueue({ kind: "daily-quest", uid: nextUid(), questId, xpReward });
    };
    const onAchievement = (e: Event) => {
      const { achievementId, name } = (
        e as CustomEvent<AchievementUnlockDetail>
      ).detail;
      enqueue({
        kind: "achievement",
        uid: nextUid(),
        achievementId,
        name,
        xpReward: 0,
      });
    };
    // The XP amount arrives separately, on the achievement's xp_transactions
    // INSERT — enrich whichever card is queued or on screen.
    const onAchievementXp = (e: Event) => {
      const { achievementId, amount } = (e as CustomEvent<AchievementXpDetail>)
        .detail;
      setQueue((prev) =>
        prev.map((item) =>
          item.kind === "achievement" && item.achievementId === achievementId
            ? { ...item, xpReward: amount }
            : item
        )
      );
    };

    window.addEventListener(LEVEL_UP_EVENT, onLevelUp);
    window.addEventListener(QUEST_REWARD_EVENT, onQuestReward);
    window.addEventListener(ACHIEVEMENT_UNLOCK_EVENT, onAchievement);
    window.addEventListener(ACHIEVEMENT_XP_EVENT, onAchievementXp);
    return () => {
      window.removeEventListener(LEVEL_UP_EVENT, onLevelUp);
      window.removeEventListener(QUEST_REWARD_EVENT, onQuestReward);
      window.removeEventListener(ACHIEVEMENT_UNLOCK_EVENT, onAchievement);
      window.removeEventListener(ACHIEVEMENT_XP_EVENT, onAchievementXp);
    };
  }, [enqueue]);

  // Content catalog by id — an achievement card renders its REAL patch token
  // (glyph + tier), and the content name beats the id-derived fallback the
  // Realtime handler sends. Fetched lazily on the first unlock; a failed fetch
  // leaves the fallback name and a starter glyph.
  const [catalog, setCatalog] = useState<Map<string, TokenInfo> | null>(null);
  const catalogRequested = useRef(false);
  const hasAchievement = queue.some((item) => item.kind === "achievement");
  useEffect(() => {
    if (!hasAchievement || catalogRequested.current) return;
    catalogRequested.current = true;
    getAllAchievements()
      .then((all) => {
        setCatalog(
          new Map(
            all.map((a) => [
              a.id,
              {
                glyph: a.glyph,
                name: a.name,
                solTier: a.solTier,
                category: a.category,
              },
            ])
          )
        );
      })
      .catch(() => {
        // Fallback path renders without content data.
      });
  }, [hasAchievement]);

  // More than the ceiling still waiting once two have played? Collapse the rest
  // into one summary card. With exactly three rewards the third plays normally —
  // a summary standing in for a single card would be worse, not calmer.
  const showSummary =
    played >= MAX_INDIVIDUAL_REWARD_CARDS && queue.length >= 2;
  const current = queue[0];
  const currentUid = current?.uid;
  const currentKind = current?.kind;

  // The head holds the stage for a fixed beat, then the queue advances. Keyed
  // on the head's uid so each reward gets a full duration — an arrival while
  // one is showing must not shorten (or restart) the one on screen.
  useEffect(() => {
    if (currentUid === undefined || currentKind === undefined) return;
    // Routed through the tier module for uniformity; every kind reaching this
    // component resolves to the "popup" tier, which is guaranteed confetti-free
    // (asserted in celebration.test.ts). The summary card is a digest, not a
    // moment, so it celebrates nothing.
    if (!showSummary) celebrate(currentKind);
    const timer = setTimeout(() => {
      if (showSummary) {
        setQueue([]);
        return;
      }
      setQueue((prev) => prev.filter((item) => item.uid !== currentUid));
      setPlayed((count) => count + 1);
    }, REWARD_POPUP_DURATION_MS);
    return () => clearTimeout(timer);
  }, [currentUid, currentKind, showSummary]);

  // An empty queue ends the moment: the card budget resets and the certificate
  // popup is released (it defers while anything is queued).
  useEffect(() => {
    if (queue.length === 0 && played !== 0) setPlayed(0);
    setRewardQueueLength(queue.length);
  }, [queue.length, played]);

  useEffect(() => () => setRewardQueueLength(0), []);

  const goToAchievements = useCallback(() => {
    setQueue([]);
    router.push(`/${locale}/profile#achievements`);
  }, [locale, router]);

  if (!current) return null;

  const summaryXp = queue.reduce((sum, item) => sum + xpOf(item), 0);

  const card = showSummary
    ? {
        accent: "gold",
        icon: <GlyphChip glyph="+" cat="reward" size={40} />,
        label: t("moreRewardsTitle"),
        name: t("moreRewards", { count: queue.length }),
        xp: summaryXp,
        onOpen: goToAchievements,
      }
    : describe(current);

  const dismiss = () =>
    setQueue((prev) => prev.filter((item) => item.uid !== current.uid));

  /** Per-kind copy. The switch is exhaustive — a new kind is a compile error. */
  function describe(item: RewardItem): {
    accent: string;
    icon: ReactNode;
    label: string;
    name: string;
    xp: number;
    onOpen: (() => void) | null;
  } {
    const chip = (glyph: string, cat: PatchCategory, round?: boolean) => (
      <GlyphChip glyph={glyph} cat={cat} size={40} round={round} />
    );
    switch (item.kind) {
      case "level-up":
        return {
          accent: "level",
          icon: chip(String(item.level), "course", true),
          label: t("levelUp"),
          name: t("levelUpMessage", { level: item.level }),
          xp: 0,
          onOpen: null,
        };
      case "daily-quest":
        return {
          accent: "gold",
          icon: chip("✓", "reward"),
          label: t("questComplete"),
          name: questName(item.questId),
          xp: item.xpReward,
          onOpen: null,
        };
      case "achievement": {
        // The icon is the earned patch itself, the same one lighting up on the
        // dashboard — the patch stays the achievement's own idiom inside the
        // shared queue.
        const info = catalog?.get(item.achievementId);
        return {
          accent: "gold",
          icon: (
            <div className="rw-oct" aria-hidden="true">
              <AchievementPatch
                id={item.achievementId}
                glyph={info?.glyph ?? "★"}
                category={info?.category}
                solTier={info?.solTier}
                state="earned"
                size={40}
              />
            </div>
          ),
          label: t("newAchievement"),
          name: info?.name ?? item.name,
          xp: item.xpReward,
          onOpen: goToAchievements,
        };
      }
    }
  }

  const { accent, icon, label, name, xp, onOpen } = card;

  return (
    <div
      className={cn("flex flex-col gap-2", className)}
      aria-live="polite"
      aria-label={label}
    >
      <div
        key={showSummary ? "summary" : current.uid}
        className={cn("rw-card", accent)}
      >
        {icon}
        {onOpen ? (
          <button
            type="button"
            onClick={onOpen}
            className="flex-1 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={`${label}: ${name} — ${t("viewAchievements")}`}
          >
            <div className="rw-kicker">{label}</div>
            <div className="rw-name">{name}</div>
          </button>
        ) : (
          <div className="flex-1">
            <div className="rw-kicker">{label}</div>
            <div className="rw-name">{name}</div>
          </div>
        )}
        {xp > 0 && (
          <div className="rw-xp">
            <Lightning size={12} weight="fill" aria-hidden="true" />+{xp}{" "}
            {t("xp")}
          </div>
        )}
        <button
          type="button"
          onClick={showSummary ? () => setQueue([]) : dismiss}
          aria-label={t("dismissReward")}
          className="ml-1 shrink-0 rounded-md px-1.5 py-0.5 text-sm leading-none opacity-60 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
