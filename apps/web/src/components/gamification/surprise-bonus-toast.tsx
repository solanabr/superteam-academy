"use client";

const SURPRISE_BONUS_EVENT = "superteam:surprise-bonus";

/**
 * Announce a granted surprise XP bonus (LX-B15). Fired from the Realtime
 * gamification hook AFTER the bonus lands server-side — never before, so the
 * reward stays genuinely unexpected. Localization lives in the presentation
 * layer, keeping the hook itself provider-free.
 *
 * Presentation moved from a success toast to the reward popup queue on
 * 2026-08-01 (owner: toasts read as too cheap for the moment) — see
 * components/gamification/reward-popup.tsx. Only the rendering changed: this
 * dispatcher and the claimSurpriseBonus dedupe both sides share are untouched.
 */
export function dispatchSurpriseBonus(amount: number): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(SURPRISE_BONUS_EVENT, { detail: { amount } })
  );
}
