"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight } from "@phosphor-icons/react";
import { ColosseumSeal } from "@/components/layout/colosseum-seal";

/**
 * Solana Hackathon promo — a single centred banner on the landing page (owner
 * 2026-09-21, replacing the app-wide top strip). A dark card carrying the
 * "Crypto World's Fair" wordmark in white, with two CTAs: register for the
 * hackathon (external) and take the prep course (in-app).
 *
 * Theme-invariant on purpose: the card is its own near-black surface with white
 * content in both themes, so it reads the same on the light and dark landing.
 * The wordmark is a real `<Image>` (white-on-transparent PNG) with a text alt,
 * so it is the card's accessible title rather than decoration.
 */
const HACKATHON_URL = "https://hackathon.superteam.com.br/";
const COURSE_SLUG = "solana-hackathon-expert";

export function HackathonHero() {
  const t = useTranslations("hackathonBanner");
  const locale = useLocale();

  return (
    <section
      aria-label={t("label")}
      className="page-gutter container pt-6 sm:pt-8"
    >
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-5 rounded-2xl border-2 border-white/10 bg-[#0b0b0d] px-6 py-9 text-center text-white shadow-[0_12px_40px_-14px_rgba(0,0,0,0.65)] sm:px-10 sm:py-11">
        <ColosseumSeal className="h-9 w-9" />

        {/* The wordmark IS the card's title (white-on-transparent), so it keeps
            a real text alt rather than being hidden. Intrinsic 932×73; height
            drives the display size, width auto, never past the card. */}
        <Image
          src="/promo/crypto-worlds-fair-wordmark.png"
          alt="Crypto World's Fair"
          width={932}
          height={73}
          priority
          className="h-7 w-auto max-w-full sm:h-10"
        />

        <p className="max-w-md text-sm text-white/80 sm:text-base">
          {t("message")}
        </p>

        <div className="mt-1 flex flex-wrap items-center justify-center gap-3">
          {/* Primary: register for the hackathon (external). Solid white pill,
              the one strong CTA on the dark card. */}
          <a
            href={HACKATHON_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[#1c1917] shadow-[3px_3px_0_0_rgba(255,255,255,0.22)] transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {t("register")}
            <ArrowRight size={16} weight="bold" aria-hidden="true" />
          </a>

          {/* Secondary: the prep course (in-app, locale-aware). Outlined white. */}
          <Link
            href={`/${locale}/courses/${COURSE_SLUG}`}
            className="inline-flex items-center justify-center rounded-full border-2 border-white px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {t("takeCourse")}
          </Link>
        </div>
      </div>
    </section>
  );
}
