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
import {
  celebrate,
  prefersReducedMotion,
} from "@/lib/gamification/celebration";
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
 * The reward popup stack — the single presentation surface for every recurring
 * reward moment: level-up, daily-quest completion and achievement unlocks.
 *
 * Owner reversal 2026-08-01: these shipped as small success toasts (the
 * level-up got nothing at all after #955/#957 removed its popup). The owner
 * found that too cheap for what the moments represent, so they render
 * pop-spring popup cards. This supersedes the earlier PED-10
 * minimal-celebration reading; see the tier map in lib/gamification/celebration.ts.
 *
 * CHOREOGRAPHY REWORK 24-08 (superseded, kept for the history): a first lesson
 * could stack six to eight reward surfaces across ~25 seconds, so this
 * component became a FIFO queue — one card on stage at a time, achievement
 * unlocks folded into it, two individual cards then a summary card for the
 * rest, and the certificate popup deferred until the queue drained.
 *
 * OWNER REVERSAL 2026-09-18 — READ BEFORE "FIXING" THIS BACK TO A QUEUE.
 * The owner reversed the sequencing on purpose: rewards render CONCURRENTLY as
 * a vertical stack, newest on top, each card with its own 3.5s beat (paused
 * while hovered or focused) and its own ✕. What survived from 24-08:
 * achievement unlocks stay on this one surface, and the level-up card still
 * de-dupes in place. What went: the 2-cards-then-summary collapse, and the
 * certificate deferral (a mint now renders immediately, above this stack).
 * Nothing waits for anything else — past MAX_VISIBLE_REWARD_CARDS the OLDEST
 * card leaves early rather than a queue forming behind it.
 *
 * REMOVED 24-08: the LX-B15 surprise bonus. The owner cut the feature outright —
 * its server roll, its dispatcher and its card are gone. Historical
 * `surprise_bonus:` rows still render in the dashboard activity feed.
 *
 * What did NOT change: confetti is still reserved by LX-B11 for deploy +
 * credential mint. Every event routed here resolves to the "popup" tier, which
 * celebrate() guarantees is confetti-free.
 */

/** How long one reward card stays up before it dismisses itself. */
export const REWARD_POPUP_DURATION_MS = 3500;

/**
 * Cards on screen at once. One past the cap pushes the OLDEST card out early —
 * the stack never becomes a queue.
 *
 * Phones get a lower cap: a card is near full width there, so five of them are
 * a wall over the lesson. Measured in the 18-09 browser probe at 375x812:
 * 5 cards = 37% of the viewport, 3 = ~27%.
 */
export const MAX_VISIBLE_REWARD_CARDS = 5;
export const MAX_VISIBLE_REWARD_CARDS_MOBILE = 3;

/** Same breakpoint as the layout's `sm:` (Tailwind default). */
const MOBILE_QUERY = "(max-width: 639px)";

/** Leave animation; a dismissed card is unmounted after it. */
export const REWARD_LEAVE_MS = 180;

type RewardItem =
  | { kind: "level-up"; uid: number; level: number; leaving?: boolean }
  | {
      kind: "daily-quest";
      uid: number;
      questId: string;
      xpReward: number;
      leaving?: boolean;
    }
  | {
      kind: "achievement";
      uid: number;
      achievementId: string;
      name: string;
      xpReward: number;
      leaving?: boolean;
    };

interface TokenInfo {
  glyph: string;
  name: string;
  solTier: boolean;
  category: string;
}

// Module-level so uids stay unique across an effect re-run or a remount —
// a collision would let the dismiss filter drop the wrong stack entry.
let uidCounter = 0;

export function RewardPopupQueue({ className }: { className?: string }) {
  const t = useTranslations("gamification");
  const questName = useQuestName();
  const router = useRouter();
  const params = useParams();
  const locale = typeof params.locale === "string" ? params.locale : "en";

  const [items, setItems] = useState<RewardItem[]>([]);

  // Read through a ref so the cap can change with the viewport without
  // re-subscribing the event listeners. jsdom and SSR have no matchMedia:
  // the desktop cap is the default there.
  const capRef = useRef(MAX_VISIBLE_REWARD_CARDS);
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const mql = window.matchMedia(MOBILE_QUERY);
    const apply = () => {
      capRef.current = mql.matches
        ? MAX_VISIBLE_REWARD_CARDS_MOBILE
        : MAX_VISIBLE_REWARD_CARDS;
    };
    apply();
    mql.addEventListener("change", apply);
    return () => mql.removeEventListener("change", apply);
  }, []);

  const remove = useCallback((uid: number) => {
    setItems((prev) => prev.filter((i) => i.uid !== uid));
  }, []);

  /** Unmount after the leave animation (reduced motion: on the next tick). */
  const scheduleUnmount = useCallback(
    (uid: number) => {
      const delay = prefersReducedMotion() ? 0 : REWARD_LEAVE_MS;
      setTimeout(() => remove(uid), delay);
    },
    [remove]
  );

  // Mark, then unmount — so the cards above settle into the gap instead of
  // snapping. The global prefers-reduced-motion rule collapses the animation.
  const dismiss = useCallback(
    (uid: number) => {
      setItems((prev) =>
        prev.map((i) => (i.uid === uid ? { ...i, leaving: true } : i))
      );
      scheduleUnmount(uid);
    },
    [scheduleUnmount]
  );

  /**
   * Append (oldest first) and enforce the cap. Past MAX_VISIBLE_REWARD_CARDS
   * the OLDEST live card starts leaving immediately — nothing queues behind
   * the stack. A `leaving` card is on its way out and doesn't count.
   */
  const withCap = useCallback(
    (prev: RewardItem[], item: RewardItem): RewardItem[] => {
      const next = [...prev, item];
      const live = next.filter((i) => !i.leaving);
      if (live.length <= capRef.current) return next;
      const evicted = live[0];
      if (!evicted) return next;
      scheduleUnmount(evicted.uid);
      return next.map((i) =>
        i.uid === evicted.uid ? { ...i, leaving: true } : i
      );
    },
    [scheduleUnmount]
  );

  useEffect(() => {
    const nextUid = () => (uidCounter += 1);

    // One level-up card at a time: a burst of XP can cross two level
    // boundaries within a second, and two "Level Up" cards read as a bug. The
    // card on screen absorbs the higher level in place instead — this survived
    // the 2026-09-18 reversal to stacking on purpose.
    const onLevelUp = (e: Event) => {
      const { level } = (e as CustomEvent<{ level: number }>).detail;
      setItems((prev) => {
        const index = prev.findIndex(
          (item) => item.kind === "level-up" && !item.leaving
        );
        if (index === -1) {
          return withCap(prev, { kind: "level-up", uid: nextUid(), level });
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
      setItems((prev) =>
        withCap(prev, {
          kind: "daily-quest",
          uid: nextUid(),
          questId,
          xpReward,
        })
      );
    };
    const onAchievement = (e: Event) => {
      const { achievementId, name } = (
        e as CustomEvent<AchievementUnlockDetail>
      ).detail;
      setItems((prev) =>
        withCap(prev, {
          kind: "achievement",
          uid: nextUid(),
          achievementId,
          name,
          xpReward: 0,
        })
      );
    };
    // The XP amount arrives separately, on the achievement's xp_transactions
    // INSERT — enrich whichever card is on screen.
    const onAchievementXp = (e: Event) => {
      const { achievementId, amount } = (e as CustomEvent<AchievementXpDetail>)
        .detail;
      setItems((prev) =>
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
  }, [withCap]);

  // Content catalog by id — an achievement card renders its REAL patch token
  // (glyph + tier), and the content name beats the id-derived fallback the
  // Realtime handler sends. Fetched lazily on the first unlock; a failed fetch
  // leaves the fallback name and a starter glyph.
  const [catalog, setCatalog] = useState<Map<string, TokenInfo> | null>(null);
  const catalogRequested = useRef(false);
  const hasAchievement = items.some((item) => item.kind === "achievement");
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

  const goToAchievements = useCallback(() => {
    setItems([]);
    router.push(`/${locale}/profile#achievements`);
  }, [locale, router]);

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
        // shared stack.
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

  if (items.length === 0) return null;

  // Newest on top: the stack is bottom-anchored, so the newest card is FIRST in
  // DOM order. The live region carries no aria-label of its own, so a screen
  // reader reads the card that arrived, not a stand-in for the whole surface.
  const stack = [...items].reverse();

  return (
    <div
      className={cn("flex flex-col items-end gap-2", className)}
      aria-live="polite"
    >
      {stack.map((item) => (
        <RewardCard
          key={item.uid}
          kind={item.kind}
          leaving={item.leaving === true}
          dismissLabel={t("dismissReward")}
          xpLabel={t("xp")}
          viewLabel={t("viewAchievements")}
          onDismiss={() => dismiss(item.uid)}
          {...describe(item)}
        />
      ))}
    </div>
  );
}

/**
 * One card, owning its own beat. The timer lives here rather than in the parent
 * so a card's 3.5s is unaffected by anything arriving or leaving above it, and
 * so hovering (or focusing) a card holds it open — a learner reaching for the ✕
 * or the achievements link must not have it disappear mid-reach.
 */
function RewardCard({
  kind,
  accent,
  icon,
  label,
  name,
  xp,
  onOpen,
  onDismiss,
  leaving,
  dismissLabel,
  xpLabel,
  viewLabel,
}: {
  kind: "level-up" | "daily-quest" | "achievement";
  accent: string;
  icon: ReactNode;
  label: string;
  name: string;
  xp: number;
  onOpen: (() => void) | null;
  onDismiss: () => void;
  leaving: boolean;
  dismissLabel: string;
  xpLabel: string;
  viewLabel: string;
}) {
  const [paused, setPaused] = useState(false);
  const remainingRef = useRef(REWARD_POPUP_DURATION_MS);
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;

  // Routed through the tier module for uniformity; every kind reaching this
  // component resolves to the "popup" tier, which is guaranteed confetti-free
  // (asserted in celebration.test.ts).
  useEffect(() => {
    celebrate(kind);
  }, [kind]);

  useEffect(() => {
    if (paused || leaving) return;
    const startedAt = Date.now();
    const timer = setTimeout(() => dismissRef.current(), remainingRef.current);
    return () => {
      clearTimeout(timer);
      remainingRef.current = Math.max(
        0,
        remainingRef.current - (Date.now() - startedAt)
      );
    };
  }, [paused, leaving]);

  return (
    <div
      className={cn("rw-card", accent, leaving && "rw-leaving")}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {icon}
      {onOpen ? (
        <button
          type="button"
          onClick={onOpen}
          className="flex-1 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label={`${label}: ${name} — ${viewLabel}`}
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
          {xpLabel}
        </div>
      )}
      <button
        type="button"
        onClick={onDismiss}
        aria-label={dismissLabel}
        className="ml-1 shrink-0 rounded-md px-1.5 py-0.5 text-sm leading-none opacity-60 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        ✕
      </button>
    </div>
  );
}
