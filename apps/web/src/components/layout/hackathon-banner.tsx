"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, X } from "@phosphor-icons/react";
import { ColosseumSeal } from "@/components/layout/colosseum-seal";

/**
 * Top-of-app promo strip for the Solana Hackathon (owner 2026-09-21): register
 * for the hackathon, and take the prep course on the Academy.
 *
 * Amber surface, to grab attention (owner 2026-09-21 — green blended in). The
 * bar is deliberately THEME-INVARIANT: amber (`--accent`) is bright in both
 * light and dark, so it carries a FIXED dark ink (#1c1917) for text, keyline
 * and shadow in both themes rather than the theme-flipping `--text`/`--ink-line`
 * tokens — those turn light on dark and made the white Register pill's label
 * invisible there. The primary CTA is a white pill with black ink (the patch
 * pattern), the secondary an underlined text link. It sits at the top of `main`
 * — which already clears the fixed header — as a full-bleed strip on every
 * route.
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
      className="w-full border-b-[2.5px] border-[#1c1917] text-[#1c1917] [background:var(--accent)]"
    >
      {/* Decorative "Crypto World's Fair" top piece — full-bleed painterly
          strip. object-cover keeps the lockup centred as the width changes;
          it carries no text the reader needs (that's the row below), so it is
          aria-hidden. */}
      <div className="relative h-9 w-full sm:h-12">
        <Image
          src="/promo/crypto-worlds-fair.png"
          alt=""
          aria-hidden="true"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
      </div>

      <div className="page-gutter mx-auto flex max-w-[1600px] flex-wrap items-center gap-x-4 gap-y-2 border-t-[2.5px] border-[#1c1917] py-2.5">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <ColosseumSeal className="h-6 w-6 shrink-0" />
          {t("message")}
        </p>

        <div className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-2">
          {/* Primary: register for the hackathon (external). A white pill with
              BLACK ink — keyline, label and hard offset shadow all fixed dark
              in both themes, so the label never disappears on the dark theme. */}
          <a
            href={HACKATHON_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border-[2px] border-[#1c1917] bg-white px-3.5 py-1 text-sm font-bold text-[#1c1917] shadow-[2px_2px_0_0_#1c1917] transition-transform hover:-translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1c1917]"
          >
            {t("register")}
            <ArrowRight size={14} weight="bold" aria-hidden="true" />
          </a>

          {/* Secondary: the prep course (in-app, locale-aware). */}
          <Link
            href={`/${locale}/courses/${COURSE_SLUG}`}
            className="text-sm font-semibold underline decoration-2 underline-offset-2 hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1c1917]"
          >
            {t("takeCourse")}
          </Link>
        </div>

        <button
          type="button"
          onClick={dismiss}
          aria-label={t("dismiss")}
          className="shrink-0 rounded-full p-1 opacity-80 transition-opacity hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1c1917]"
        >
          <X size={16} weight="bold" aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
}
