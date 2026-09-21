"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight } from "@phosphor-icons/react";

/**
 * Solana Hackathon promo — a single full-bleed bar at the top of the landing
 * page (owner 2026-09-21). A thin near-black strip that spans border to border,
 * carrying the "Crypto World's Fair" wordmark in white, a one-line hook, and two
 * CTAs: register for the hackathon (external) and take the prep course (in-app).
 *
 * The dark surface is edge-to-edge; the inner content is gutter-padded and
 * capped so it never hugs the edges on an ultrawide screen. Theme-invariant
 * (near-black + white in both themes), so it reads the same on the light and
 * dark landing. The wordmark is a real `<Image>` with a text alt — it is the
 * bar's accessible title, not decoration.
 */
const HACKATHON_URL = "https://hackathon.superteam.com.br/";
const COURSE_SLUG = "solana-hackathon-expert";

export function HackathonHero() {
  const t = useTranslations("hackathonBanner");
  const locale = useLocale();

  return (
    <section
      aria-label={t("label")}
      className="w-full border-b border-white/10 bg-[#0b0b0d] text-white"
    >
      <div className="page-gutter mx-auto flex max-w-[1600px] flex-wrap items-center justify-center gap-x-6 gap-y-3 py-2.5 sm:justify-between">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          {/* The wordmark IS the bar's title (white-on-transparent). Intrinsic
              932×73; a small height keeps the bar thin, width auto, capped. */}
          <Image
            src="/promo/crypto-worlds-fair-wordmark.png"
            alt="Crypto World's Fair"
            width={932}
            height={73}
            priority
            className="h-5 w-auto max-w-full sm:h-6"
          />
          <p className="text-xs text-white/70 sm:text-sm">{t("message")}</p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2.5">
          {/* Primary: register for the hackathon (external). Solid white pill. */}
          <a
            href={HACKATHON_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-sm font-bold text-[#1c1917] transition-transform hover:-translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {t("register")}
            <ArrowRight size={14} weight="bold" aria-hidden="true" />
          </a>

          {/* Secondary: the prep course (in-app, locale-aware). Outlined white. */}
          <Link
            href={`/${locale}/courses/${COURSE_SLUG}`}
            className="inline-flex items-center justify-center rounded-full border-2 border-white px-4 py-1.5 text-sm font-bold text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {t("takeCourse")}
          </Link>
        </div>
      </div>
    </section>
  );
}
