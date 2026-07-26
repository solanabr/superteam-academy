"use client";

import { useTranslations } from "next-intl";
import { ArrowUpRight, Coins } from "@phosphor-icons/react";
import { trackEvent } from "@/lib/analytics";

/**
 * Earn handoff card — the bridge from a freshly minted credential to paid
 * work on Superteam Earn (LX-E4).
 *
 * Curated CATEGORY links only: bounty listings are ephemeral, so this card
 * must never deep-link a specific bounty. Fires the `earn_handoff_click`
 * analytics event (metric E8) on every click-through, carrying the category,
 * the surface it was clicked from, and the course id when known.
 */

const EARN_CATEGORIES = [
  {
    key: "development",
    href: "https://superteam.fun/earn/category/development/",
  },
  { key: "content", href: "https://superteam.fun/earn/category/content/" },
  { key: "grants", href: "https://superteam.fun/earn/grants/" },
] as const;

type EarnCategory = (typeof EARN_CATEGORIES)[number]["key"];

interface EarnHandoffCardProps {
  /** Surface the card is rendered on — recorded on the E8 event. */
  source: "mint_success" | "certificate_page";
  courseId?: string;
}

export function EarnHandoffCard({ source, courseId }: EarnHandoffCardProps) {
  const t = useTranslations("earnHandoff");

  function handleClick(category: EarnCategory): void {
    trackEvent("earn_handoff_click", {
      category,
      source,
      ...(courseId ? { courseId } : {}),
    });
  }

  return (
    <section
      aria-labelledby="earn-handoff-title"
      className="rounded-xl bg-cert-gradient p-[1.5px] shadow-[var(--shadow-card)]"
    >
      <div className="rounded-[11px] bg-card px-5 py-4">
        <div className="flex items-center gap-2">
          <Coins
            size={20}
            weight="duotone"
            className="shrink-0 text-secondary"
            aria-hidden="true"
          />
          <h2
            id="earn-handoff-title"
            className="font-display text-sm font-bold text-text"
          >
            {t("title")}
          </h2>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-text-2">
          {t("description")}
        </p>
        <p className="mt-1.5 text-xs leading-relaxed text-text-3">
          {t("grantNote")}
        </p>
        <ul className="mt-3 flex flex-wrap gap-2" aria-label={t("linksLabel")}>
          {EARN_CATEGORIES.map(({ key, href }, index) => (
            <li key={key}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleClick(key)}
                className={
                  index === 0
                    ? "inline-flex items-center gap-1 rounded-md bg-primary px-3.5 py-1.5 font-display text-xs font-bold text-white shadow-push transition-all duration-100 hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-[3px] active:shadow-push-active"
                    : "inline-flex items-center gap-1 rounded-md border border-border bg-bg px-3.5 py-1.5 font-display text-xs font-bold text-text transition-colors hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                }
              >
                {t(key)}
                <ArrowUpRight size={12} weight="bold" aria-hidden="true" />
                <span className="sr-only">({t("opensInNewTab")})</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
