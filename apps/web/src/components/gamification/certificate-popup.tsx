"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { celebrate } from "@/lib/gamification/celebration";
import { cn } from "@/lib/utils";

/**
 * V9 Certificate Minted popup — uses .popup-grad.cert pattern
 * from the design system (pop-spring animation, Solana gradient border).
 *
 * History: the 24-08 choreography rework made a mint WAIT for the reward queue
 * to drain, because one-card-at-a-time sequencing otherwise buried it.
 *
 * OWNER REVERSAL 2026-09-18: rewards stack concurrently now, so there is
 * nothing to wait for. A mint renders immediately and sits ABOVE the reward
 * stack — it is the loudest moment on the platform and it gets the top slot
 * with its confetti. Several mints stack the same way, newest on top. The 8s
 * duplicate-mint dedupe stays where it was, in celebration.ts.
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

  // Timers are kept so a card's beat survives re-renders and is cleared on
  // unmount.
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => {
    const timers = timersRef.current;
    return () => timers.forEach(clearTimeout);
  }, []);

  const handleMinted = useCallback((e: Event) => {
    const detail = (e as CustomEvent<CertificateEvent>).detail;
    setEvents((prev) => [...prev, detail]);
    // Full celebration — a credential mint is the rarest milestone (LX-B11).
    // celebrate() dedupes against the manual-mint path (8s window) and
    // respects prefers-reduced-motion.
    celebrate("credential-mint");
    timersRef.current.push(
      setTimeout(() => {
        setEvents((prev) => prev.filter((other) => other.uid !== detail.uid));
      }, CERTIFICATE_POPUP_DURATION_MS)
    );
  }, []);

  useEffect(() => {
    window.addEventListener("superteam:certificate-minted", handleMinted);
    return () =>
      window.removeEventListener("superteam:certificate-minted", handleMinted);
  }, [handleMinted]);

  if (events.length === 0) return null;

  function handleClick(ev: CertificateEvent) {
    setEvents((prev) => prev.filter((e) => e.uid !== ev.uid));
    router.push(`/${locale}/certificates/${ev.certificateId}`);
  }

  return (
    <div
      className={cn("flex flex-col items-end gap-2", className)}
      aria-live="polite"
    >
      {/* Newest on top, like the reward stack below it. */}
      {[...events].reverse().map((ev) => (
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
