"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { celebrate } from "@/lib/gamification/celebration";
import { useQuestName } from "@/lib/gamification/use-quest-name";
import { cn } from "@/lib/utils";

/**
 * The reward popup queue — the single presentation surface for the recurring
 * reward moments: level-up, daily-quest completion and the LX-B15 surprise
 * bonus.
 *
 * Owner reversal 2026-08-01: these three shipped as small success toasts (the
 * level-up got nothing at all after #955/#957 removed its popup). The owner
 * found that too cheap for what the moments represent — "the popups were so
 * cool", "those toasts are so cheap" — so all three now render the pop-spring
 * `.popup-grad` card the achievement and certificate popups use. This
 * supersedes the earlier PED-10 minimal-celebration reading; see the tier map
 * in lib/gamification/celebration.ts.
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

const LEVEL_UP_EVENT = "superteam:level-up";
const QUEST_REWARD_EVENT = "superteam:quest-reward";
const SURPRISE_BONUS_EVENT = "superteam:surprise-bonus";

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
    icon: string;
    label: string;
    name: string;
    xp: number | null;
  } {
    switch (item.kind) {
      case "level-up":
        return {
          icon: "↑",
          label: t("levelUp"),
          name: t("levelUpMessage", { level: item.level }),
          xp: null,
        };
      case "daily-quest":
        return {
          icon: "🎯",
          label: t("questComplete"),
          name: questName(item.questId),
          xp: item.xpReward,
        };
      case "surprise-bonus":
        return {
          icon: "✨",
          label: t("surpriseBonusTitle"),
          name: t("surpriseBonusMessage"),
          xp: item.amount,
        };
    }
  }

  if (!current) return null;

  const dismiss = () =>
    setQueue((prev) => prev.filter((item) => item.uid !== current.uid));

  const { icon, label, name, xp } = describe(current);

  return (
    <div
      className={cn("flex flex-col gap-2", className)}
      aria-live="polite"
      aria-label={label}
    >
      {/* v9 .popup-grad — Solana gradient border, pop-spring animation */}
      <div key={current.uid} className="popup-grad achievement">
        <div className="popup-grad-inner">
          {/* v9 .popup-icon-ring — 44px circle, Solana gradient, 2.5px padding */}
          <div className="popup-icon-ring">
            <div className="popup-icon-inner" aria-hidden="true">
              {icon}
            </div>
          </div>
          <div className="flex-1">
            {/* v9 .popup-label — mono 10px uppercase primary */}
            <div className="popup-label">{label}</div>
            {/* v9 .popup-name — Nunito 800, 15px */}
            <div className="popup-name">{name}</div>
          </div>
          {xp !== null && xp > 0 && (
            <div className="popup-xp ml-2 !animate-none">
              <span className="popup-xp-amount">+{xp} XP</span>
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
    </div>
  );
}
