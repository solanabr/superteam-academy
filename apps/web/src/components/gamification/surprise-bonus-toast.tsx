"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { dispatchToast } from "@/components/ui/toast-container";

const SURPRISE_BONUS_EVENT = "superteam:surprise-bonus";

/**
 * Announce a granted surprise XP bonus (LX-B15). Fired from the Realtime
 * gamification hook AFTER the bonus lands server-side — never before, so the
 * reward stays genuinely unexpected. Localization lives in the mounted
 * listener below, keeping the hook itself provider-free.
 */
export function dispatchSurpriseBonus(amount: number): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(SURPRISE_BONUS_EVENT, { detail: { amount } })
  );
}

/**
 * Renders nothing; listens for surprise-bonus events and shows an informational
 * toast (the LX-B15 "none" celebration tier — a calm success toast, never
 * confetti). Mount once inside the intl provider.
 */
export function SurpriseBonusToastListener() {
  const t = useTranslations("gamification");

  useEffect(() => {
    const handler = (e: Event) => {
      const { amount } = (e as CustomEvent<{ amount: number }>).detail;
      dispatchToast(t("surpriseBonus", { amount }), "success");
    };
    window.addEventListener(SURPRISE_BONUS_EVENT, handler);
    return () => window.removeEventListener(SURPRISE_BONUS_EVENT, handler);
  }, [t]);

  return null;
}
