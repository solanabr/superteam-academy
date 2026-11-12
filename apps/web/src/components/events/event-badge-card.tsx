"use client";

import { useLocale, useTranslations } from "next-intl";
import { ArrowSquareOut } from "@phosphor-icons/react";
import type { EventBadge } from "@/lib/events/events";
import { eventImageSrc } from "@/lib/events/images";
import { explorerUrl } from "@/lib/solana/network";

interface EventBadgeCardProps {
  badge: Pick<
    EventBadge,
    "achievementId" | "name" | "description" | "imageUrl" | "startsAt"
  > & { assetAddress?: string | null };
  /** Show "Minting…" while the NFT hasn't landed yet (own profile, redeem page). */
  showPending?: boolean;
}

/** One attended event: its artwork (or generated badge), name and date. */
export function EventBadgeCard({
  badge,
  showPending = false,
}: EventBadgeCardProps) {
  const t = useTranslations("events");
  const locale = useLocale();
  const date = new Date(badge.startsAt).toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <article className="flex h-full flex-col items-center gap-3 rounded-xl border border-border bg-card p-4 text-center shadow-card">
      {/* eslint-disable-next-line @next/next/no-img-element -- Supabase storage or our own generated badge; sizes are fixed */}
      <img
        src={eventImageSrc(badge)}
        alt=""
        width={96}
        height={96}
        loading="lazy"
        className="h-24 w-24 rounded-full border border-border object-cover"
      />
      <div className="min-w-0 space-y-1">
        <h3 className="font-display text-[15px] font-bold leading-tight">
          {badge.name}
        </h3>
        <p className="font-mono text-[11px] text-text-3">
          <time dateTime={badge.startsAt}>{date}</time>
        </p>
        {badge.description && (
          <p className="line-clamp-3 text-xs text-text-2">
            {badge.description}
          </p>
        )}
      </div>
      {badge.assetAddress ? (
        <a
          href={explorerUrl("address", badge.assetAddress)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto inline-flex items-center gap-1 text-[11px] font-semibold text-primary underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {t("viewNft")}
          <ArrowSquareOut size={12} weight="bold" aria-hidden="true" />
        </a>
      ) : (
        showPending && (
          <p className="mt-auto text-[11px] text-text-3">{t("minting")}</p>
        )
      )}
    </article>
  );
}
