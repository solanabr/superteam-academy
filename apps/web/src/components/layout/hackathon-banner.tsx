"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, X } from "@phosphor-icons/react";

/**
 * Top-of-app promo strip for the Solana Hackathon (owner 2026-09-21): register
 * for the hackathon, and take the prep course on the Academy.
 *
 * Deep-green surface, so it is a LIGHT-surface case (the green IS the
 * background): cream/ink text on green, the primary CTA a solid cream pill that
 * reads as a raised control, the secondary an underlined text link. It sits at
 * the top of `main` — which already clears the fixed header — as a full-bleed
 * strip on every route.
 *
 * Dismissible and remembered per device: once closed it stays closed
 * (localStorage), so it never re-nags. Render is gated on that check running in
 * an effect (localStorage is not available during SSR and reading it in render
 * would desync hydration), so a dismisser never sees a flash of the bar.
 */
const DISMISS_KEY = "hackathon-banner-dismissed:v1";
const HACKATHON_URL = "https://hackathon.superteam.com.br/";
const COURSE_SLUG = "solana-hackathon-expert";

export function HackathonBanner() {
  const t = useTranslations("hackathonBanner");
  const locale = useLocale();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      setVisible(window.localStorage.getItem(DISMISS_KEY) !== "1");
    } catch {
      // Storage blocked (private mode, etc.) — show the bar; it just won't
      // remember a dismissal, which is the safe default for a promo.
      setVisible(true);
    }
  }, []);

  const dismiss = (): void => {
    setVisible(false);
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* best-effort — dismissal simply isn't remembered */
    }
  };

  if (!visible) return null;

  return (
    <aside
      aria-label={t("label")}
      className="w-full border-b-[2.5px] border-[var(--ink-line)] [background:var(--primary)] [color:var(--primary-fg)]"
    >
      <div className="page-gutter mx-auto flex max-w-[1600px] flex-wrap items-center gap-x-4 gap-y-2 py-2.5">
        <p className="text-sm font-semibold">
          <span aria-hidden="true" className="mr-1.5">
            🏆
          </span>
          {t("message")}
        </p>

        <div className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-2">
          {/* Primary: register for the hackathon (external). A solid cream pill
              with an ink keyline + hard offset shadow — the patch pattern that
              a deep-green surface calls for. */}
          <a
            href={HACKATHON_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border-[2px] border-[var(--ink-line)] bg-[var(--primary-fg)] px-3.5 py-1 text-sm font-bold text-[var(--text)] shadow-[2px_2px_0_0_var(--ink-line)] transition-transform hover:-translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary-fg)]"
          >
            {t("register")}
            <ArrowRight size={14} weight="bold" aria-hidden="true" />
          </a>

          {/* Secondary: the prep course (in-app, locale-aware). */}
          <Link
            href={`/${locale}/courses/${COURSE_SLUG}`}
            className="text-sm font-semibold underline decoration-2 underline-offset-2 hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary-fg)]"
          >
            {t("takeCourse")}
          </Link>
        </div>

        <button
          type="button"
          onClick={dismiss}
          aria-label={t("dismiss")}
          className="shrink-0 rounded-full p-1 opacity-80 transition-opacity hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary-fg)]"
        >
          <X size={16} weight="bold" aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
}
