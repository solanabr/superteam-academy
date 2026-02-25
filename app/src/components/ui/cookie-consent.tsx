"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

const CONSENT_KEY = "sa_cookie_consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const t = useTranslations("cookieConsent");

  useEffect(() => {
    if (!localStorage.getItem(CONSENT_KEY)) setVisible(true);
  }, []);

  if (!visible) return null;

  const respond = (accepted: boolean) => {
    localStorage.setItem(CONSENT_KEY, accepted ? "granted" : "denied");
    setVisible(false);
    if (accepted && typeof window !== "undefined") {
      if (window.gtag) {
        window.gtag("consent", "update", { analytics_storage: "granted" });
      }
      window.dispatchEvent(new Event("analytics-consent-granted"));
    }
  };

  return (
    <div
      role="dialog"
      aria-label={t("ariaLabel")}
      className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-lg rounded-lg border border-[var(--c-border-subtle)] bg-[var(--c-bg-card)] p-4 shadow-lg sm:left-auto sm:right-6 sm:max-w-sm"
    >
      <p className="mb-3 text-sm text-[var(--c-text-2)]">
        {t("description")}
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => respond(true)}
          className="rounded bg-[#00FFA3] px-4 py-1.5 text-xs font-medium text-black transition-opacity hover:opacity-90"
        >
          {t("accept")}
        </button>
        <button
          onClick={() => respond(false)}
          className="rounded border border-[var(--c-border-subtle)] px-4 py-1.5 text-xs font-medium text-[var(--c-text-2)] transition-colors hover:text-[var(--c-text)]"
        >
          {t("decline")}
        </button>
      </div>
    </div>
  );
}

/** Check whether the user has granted cookie consent. */
export function hasAnalyticsConsent(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(CONSENT_KEY) === "granted";
}
