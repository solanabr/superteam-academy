"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { celebrate } from "@/lib/gamification/celebration";
import { useRewardQueueBusy } from "@/lib/gamification/reward-queue-state";
import { cn } from "@/lib/utils";

/**
 * V9 Certificate Minted popup — uses .popup-grad.cert pattern
 * from the design system (pop-spring animation, Solana gradient border).
 *
 * Deferral (choreography rework 24-08): a credential mint arrives on its own
 * Realtime insert, which routinely lands while the reward queue is still playing
 * a level-up or an achievement — so the platform's loudest moment played UNDER a
 * stack of smaller cards. A mint now waits for the queue to drain before it
 * renders and before the confetti fires.
 */

interface CertificateEvent {
  certificateId: string;
  uid: number;
}

/** How long a certificate card holds the stage. */
export const CERTIFICATE_POPUP_DURATION_MS = 7000;

let counter = 0;

export function dispatchCertificateMinted(certificateId: string): void {
  if (typeof window === "undefined") return;
  counter++;
  window.dispatchEvent(
    new CustomEvent("superteam:certificate-minted", {
      detail: { certificateId, uid: counter },
    })
  );
}

export function CertificatePopup({ className }: { className?: string }) {
  const t = useTranslations("gamification");
  const router = useRouter();
  const params = useParams();
  const locale = typeof params.locale === "string" ? params.locale : "en";

  const [events, setEvents] = useState<CertificateEvent[]>([]);
  /** Mints observed while the reward queue was still running. */
  const [deferred, setDeferred] = useState<CertificateEvent[]>([]);
  const rewardQueueBusy = useRewardQueueBusy();

  const handleMinted = useCallback((e: Event) => {
    const detail = (e as CustomEvent<CertificateEvent>).detail;
    setDeferred((prev) => [...prev, detail]);
  }, []);

  useEffect(() => {
    window.addEventListener("superteam:certificate-minted", handleMinted);
    return () =>
      window.removeEventListener("superteam:certificate-minted", handleMinted);
  }, [handleMinted]);

  // Dismiss timers start when the card actually appears, so a deferred mint
  // still gets its full beat. Held in a ref because the release effect re-runs
  // as soon as it drains `deferred` — a cleanup there would cancel the timers it
  // just scheduled.
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => {
    const timers = timersRef.current;
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (rewardQueueBusy || deferred.length === 0) return;
    setDeferred([]);
    setEvents((prev) => [...prev, ...deferred]);
    // Full celebration — a credential mint is the rarest milestone (LX-B11).
    // celebrate() dedupes against the manual-mint path and respects
    // prefers-reduced-motion.
    celebrate("credential-mint");
    for (const ev of deferred) {
      timersRef.current.push(
        setTimeout(() => {
          setEvents((prev) => prev.filter((e) => e.uid !== ev.uid));
        }, CERTIFICATE_POPUP_DURATION_MS)
      );
    }
  }, [rewardQueueBusy, deferred]);

  if (events.length === 0) return null;

  function handleClick(ev: CertificateEvent) {
    setEvents((prev) => prev.filter((e) => e.uid !== ev.uid));
    router.push(`/${locale}/certificates/${ev.certificateId}`);
  }

  return (
    <div
      className={cn("flex flex-col gap-2", className)}
      aria-live="polite"
      aria-label={t("certificateMinted")}
    >
      {events.map((ev) => (
        /* v9 .popup-grad.cert — Solana gradient border, pop-spring animation */
        <button
          key={ev.uid}
          onClick={() => handleClick(ev)}
          className="popup-grad cert cursor-pointer border-none bg-transparent p-0 text-left transition-opacity hover:opacity-90"
          aria-label={t("certificateMinted")}
        >
          <div className="popup-grad-inner">
            {/* Rework 05-08: the icon is the certificate artifact in
                miniature — gradient frame, seal, text lines. */}
            <div className="rw-diploma" aria-hidden="true">
              <div className="rw-diploma-in">
                <span>◎</span>
                <i />
                <i />
              </div>
            </div>
            <div>
              <div className="rw-kicker">{t("certificateMinted")}</div>
              <div className="rw-name">{t("viewCertificate")} →</div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
