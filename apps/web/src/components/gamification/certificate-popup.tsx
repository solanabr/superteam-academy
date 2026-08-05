"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { celebrate } from "@/lib/gamification/celebration";
import { cn } from "@/lib/utils";

/**
 * V9 Certificate Minted popup — uses .popup-grad.cert pattern
 * from the design system (pop-spring animation, Solana gradient border).
 */

interface CertificateEvent {
  certificateId: string;
  uid: number;
}

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

  const handleMinted = useCallback((e: Event) => {
    const detail = (e as CustomEvent<CertificateEvent>).detail;
    setEvents((prev) => [...prev, detail]);
    // Full celebration — a credential mint is the rarest milestone (LX-B11).
    // celebrate() dedupes against the manual-mint path and respects
    // prefers-reduced-motion.
    celebrate("credential-mint");
    setTimeout(() => {
      setEvents((prev) => prev.filter((ev) => ev.uid !== detail.uid));
    }, 7000);
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
