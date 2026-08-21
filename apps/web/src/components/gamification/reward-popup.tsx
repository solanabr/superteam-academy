"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Lightning } from "@phosphor-icons/react";
import { celebrate } from "@/lib/gamification/celebration";
import { useQuestName } from "@/lib/gamification/use-quest-name";
import { GlyphChip } from "@/components/gamification/glyph-chip";
import type { PatchCategory } from "@/components/gamification/patch-look";
import { cn } from "@/lib/utils";
import { LEVEL_UP_EVENT } from "./level-up-popup";
import { QUEST_REWARD_EVENT } from "./quest-reward-toast";
import { SURPRISE_BONUS_EVENT } from "./surprise-bonus-toast";

/**
 * The reward popup queue — the single presentation surface for the recurring
 * reward moments: level-up, daily-quest completion and the LX-B15 surprise
 * bonus.
 *
 * Owner reversal 2026-08-01: these three shipped as small success toasts (the
 * level-up got nothing at all after #955/#957 removed its popup). The owner
 * found that too cheap for what the moments represent — "the popups were so
 * cool", "those toasts are so cheap" — so all three render pop-spring popup
 * cards. This supersedes the earlier PED-10 minimal-celebration reading; see
 * the tier map in lib/gamification/celebration.ts.
 *
 * Rework 05-08 (owner-approved via mock): the cards moved off the Solana
 * gradient onto the house `.rw-card` — the gradient is reserved for the
 * certificate popup (on-chain artifact). XP rides the dq-reward-style
 * lightning chip.
 *
 * Glyph pass 21-08 (owner-approved): the icon is a 40px GlyphChip on all three
 * moments — gold ✓ for a completed quest, gold ★ for the surprise bonus, and a
 * round course-green chip carrying the new level number. That retires the last
 * two emoji on this surface and the LevelBadge copy, which duplicated the
 * header's badge at a moment when the header is already updating.
 *
 * What did NOT change: confetti is still reserved by LX-B11 for deploy +
 * credential mint. Every event routed here resolves to the "popup" tier, which
 * celebrate() guarantees is confetti-free.
 *
 * QUEUEING, not stacking: a single lesson completion can produce a level-up, a
 * quest award and a surprise bonus within the same second. Rendering them at
 * once buried the moment under a pile of cards, so this component shows the
 * head of the queue only and advances on a timer — each reward gets its own
 * beat. Dismissing early advances immediately.
 */

/** How long one reward holds the stage before the queue advances. */
export const REWARD_POPUP_DURATION_MS = 5000;

type RewardItem =
  | { kind: "level-up"; uid: number; level: number }
  | { kind: "daily-quest"; uid: number; questId: string; xpReward: number }
  | { kind: "surprise-bonus"; uid: number; amount: number };

// Module-level so uids stay unique across an effect re-run or a remount —
// a collision would let the dismiss filter drop the wrong queue entry.
let uidCounter = 0;

export function RewardPopupQueue({ className }: { className?: string }) {
  const t = useTranslations("gamification");
  const questName = useQuestName();

  const [queue, setQueue] = useState<RewardItem[]>([]);

  const enqueue = useCallback((item: RewardItem) => {
    setQueue((prev) => [...prev, item]);
  }, []);

  useEffect(() => {
    const nextUid = () => (uidCounter += 1);

    const onLevelUp = (e: Event) => {
      const { level } = (e as CustomEvent<{ level: number }>).detail;
      enqueue({ kind: "level-up", uid: nextUid(), level });
    };
    const onQuestReward = (e: Event) => {
      const { questId, xpReward } = (
        e as CustomEvent<{ questId: string; xpReward: number }>
      ).detail;
      enqueue({ kind: "daily-quest", uid: nextUid(), questId, xpReward });
    };
    const onSurpriseBonus = (e: Event) => {
      const { amount } = (e as CustomEvent<{ amount: number }>).detail;
      enqueue({ kind: "surprise-bonus", uid: nextUid(), amount });
    };

    window.addEventListener(LEVEL_UP_EVENT, onLevelUp);
    window.addEventListener(QUEST_REWARD_EVENT, onQuestReward);
    window.addEventListener(SURPRISE_BONUS_EVENT, onSurpriseBonus);
    return () => {
      window.removeEventListener(LEVEL_UP_EVENT, onLevelUp);
      window.removeEventListener(QUEST_REWARD_EVENT, onQuestReward);
      window.removeEventListener(SURPRISE_BONUS_EVENT, onSurpriseBonus);
    };
  }, [enqueue]);

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
    // (asserted in celebration.test.ts).
    celebrate(currentKind);
    const timer = setTimeout(() => {
      setQueue((prev) => prev.filter((item) => item.uid !== currentUid));
    }, REWARD_POPUP_DURATION_MS);
    return () => clearTimeout(timer);
  }, [currentUid, currentKind]);

  /** Per-kind copy. The switch is exhaustive — a new kind is a compile error. */
  function describe(item: RewardItem): {
    chip: { glyph: string; cat: PatchCategory; round?: boolean };
    label: string;
    name: string;
    xp: number | null;
  } {
    switch (item.kind) {
      case "level-up":
        return {
          chip: { glyph: String(item.level), cat: "course", round: true },
          label: t("levelUp"),
          name: t("levelUpMessage", { level: item.level }),
          xp: null,
        };
      case "daily-quest":
        return {
          chip: { glyph: "✓", cat: "reward" },
          label: t("questComplete"),
          name: questName(item.questId),
          xp: item.xpReward,
        };
      case "surprise-bonus":
        return {
          chip: { glyph: "★", cat: "reward" },
          label: t("surpriseBonusTitle"),
          name: t("surpriseBonusMessage"),
          xp: item.amount,
        };
    }
  }

  if (!current) return null;

  const dismiss = () =>
    setQueue((prev) => prev.filter((item) => item.uid !== current.uid));

  const { chip, label, name, xp } = describe(current);

  return (
    <div
      className={cn("flex flex-col gap-2", className)}
      aria-live="polite"
      aria-label={label}
    >
      {/* House card, per-moment accent (rework 05-08). 21-08: the icon is a
          40px GlyphChip on all three moments — the emoji ring and the
          LevelBadge both predate the glyph language and were the last two
          icon idioms left on this surface. */}
      <div
        key={current.uid}
        className={cn(
          "rw-card",
          current.kind === "level-up" ? "level" : "gold"
        )}
      >
        <GlyphChip
          glyph={chip.glyph}
          cat={chip.cat}
          size={40}
          round={chip.round}
        />
        <div className="flex-1">
          <div className="rw-kicker">{label}</div>
          <div className="rw-name">{name}</div>
        </div>
        {xp !== null && xp > 0 && (
          <div className="rw-xp">
            <Lightning size={12} weight="fill" aria-hidden="true" />+{xp}{" "}
            {t("xp")}
          </div>
        )}
        <button
          type="button"
          onClick={dismiss}
          aria-label={t("dismissReward")}
          className="ml-1 shrink-0 rounded-md px-1.5 py-0.5 text-sm leading-none opacity-60 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
