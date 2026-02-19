"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { SolanaLogo } from "@/components/icons/solana-logo";
import { CERTIFICATE_STYLES as CS, cx } from "@/lib/styles/styleClasses";

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
        <button
          key={ev.uid}
          onClick={() => handleClick(ev)}
          className={cx(CS.outer, CS.outerClickable, "animate-pop")}
        >
          <div className={cx(CS.inner, "flex items-center gap-3 px-4 py-3")}>
            <SolanaLogo className="h-5 w-5 shrink-0" variant="brand" />
            <div className="flex flex-col items-start">
              <span className="font-display text-sm font-extrabold text-text">
                {t("certificateMinted")}
              </span>
              <span className="font-body text-xs font-medium text-primary">
                {t("viewCertificate")} →
              </span>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
