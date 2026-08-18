"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import { Copy, Check, Gift, Info, XLogo } from "@phosphor-icons/react";
import * as Tooltip from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";

interface ReferralStanding {
  userId: string;
  username: string;
  avatarUrl: string | null;
  points: number;
  rank: number;
}

interface ReferralSeason {
  number: number;
  startsAt: string;
  endsAt: string;
}

interface OwnReferralStats {
  code: string;
  seasonPoints: number;
  referredSignups: number;
}

/* ── Copy affordance with its own "copied" feedback ── */
function CopyButton({
  value,
  label,
  copiedLabel,
}: {
  value: string;
  label: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard denied — the surrounding inputs stay selectable by hand.
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md border border-border px-3 text-xs font-medium hover:bg-subtle"
    >
      {copied ? (
        <Check size={14} weight="bold" aria-hidden="true" />
      ) : (
        <Copy size={14} weight="bold" aria-hidden="true" />
      )}
      {copied ? copiedLabel : label}
    </button>
  );
}

/**
 * The sharing surface — a signed-in learner's link, code, and share actions.
 *
 * Rendered FIRST and INDEPENDENTLY of the standings fetch: the whole point of
 * the board is that a learner leaves with their link, so a failed or empty
 * standings read (season not yet provisioned, network blip) must never hide
 * it. That failure mode shipped once — an unapplied migration blanked the
 * entire tab, sharing surface included.
 */
function YourLinkCard() {
  const t = useTranslations("gamification");
  const locale = useLocale();
  const [stats, setStats] = useState<OwnReferralStats | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/referrals/me")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: OwnReferralStats) => {
        if (!cancelled) setStats(data);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (failed) {
    return (
      <div className="lb-league-head">
        <span className="lb-league-icon" aria-hidden="true">
          <Gift size={22} weight="fill" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="lb-league-tier">{t("yourReferralLink")}</p>
          <p className="lb-league-sub mt-1">{t("referralLinkUnavailable")}</p>
        </div>
      </div>
    );
  }

  const link = stats
    ? `${window.location.origin}/${locale}?ref=${stats.code}`
    : null;
  const shareHref =
    link !== null
      ? `https://twitter.com/intent/tweet?text=${encodeURIComponent(
          t("referralShareText", { link })
        )}`
      : null;

  return (
    <div className="lb-league-head">
      <span className="lb-league-icon" aria-hidden="true">
        <Gift size={22} weight="fill" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="lb-league-tier">{t("yourReferralLink")}</p>
        {stats && link && shareHref ? (
          <>
            {/* The full link — paste it anywhere (X, Discord, a QR code). */}
            <div className="mt-1.5 flex items-center gap-2">
              <input
                readOnly
                value={link}
                onFocus={(e) => e.currentTarget.select()}
                className="h-9 min-w-0 flex-1 rounded-md border border-border bg-subtle px-2 text-xs text-text-2"
                aria-label={t("yourReferralLink")}
              />
              <CopyButton
                value={link}
                label={t("copyLink")}
                copiedLabel={t("linkCopied")}
              />
            </div>
            {/* The bare code, for surfaces where a URL is clumsy — plus a
                one-tap X share with the link prefilled. */}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex h-9 items-center rounded-md border border-dashed border-border px-3 font-mono text-sm font-semibold tracking-[0.15em] text-text">
                {stats.code}
              </span>
              <CopyButton
                value={stats.code}
                label={t("copyCode")}
                copiedLabel={t("linkCopied")}
              />
              <a
                href={shareHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md border border-border px-3 text-xs font-medium no-underline hover:bg-subtle"
              >
                <XLogo size={14} weight="bold" aria-hidden="true" />
                {t("shareOnX")}
              </a>
            </div>
            <p className="lb-league-sub mt-2">
              {t("referralYourPoints", { points: stats.seasonPoints })} ·{" "}
              {t("referralYourSignups", { count: stats.referredSignups })}
            </p>
          </>
        ) : (
          <p className="lb-league-sub mt-1">…</p>
        )}
      </div>
    </div>
  );
}

/* ── Signed-out variant — say HOW to get a link instead of showing nothing ── */
function SignInForLinkCard() {
  const t = useTranslations("gamification");
  return (
    <div className="lb-league-head">
      <span className="lb-league-icon" aria-hidden="true">
        <Gift size={22} weight="fill" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="lb-league-tier">{t("yourReferralLink")}</p>
        <p className="lb-league-sub mt-1">{t("referralSignIn")}</p>
      </div>
    </div>
  );
}

/* ── Info affordance explaining referral scoring ── */
function ReferralScoringInfo() {
  const t = useTranslations("gamification");
  return (
    <Tooltip.Provider delayDuration={0} skipDelayDuration={150}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button
            type="button"
            className="lb-league-info"
            aria-label={t("referralScoringInfoLabel")}
          >
            <Info size={18} weight="bold" aria-hidden="true" />
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            className="lb-tooltip"
            sideOffset={6}
            side="bottom"
            align="end"
            collisionPadding={12}
          >
            {t("referralScoringInfo")}
            <Tooltip.Arrow className="fill-[var(--card)]" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}

/* ── Season referral standings — third board on /leaderboard ── */
export function ReferralBoard({ currentUserId }: { currentUserId: string }) {
  const t = useTranslations("gamification");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const [standings, setStandings] = useState<ReferralStanding[] | null>(null);
  const [season, setSeason] = useState<ReferralSeason | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/referrals/leaderboard")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then(
        (data: {
          season: ReferralSeason | null;
          standings: ReferralStanding[];
        }) => {
          if (cancelled) return;
          setSeason(data.season);
          setStandings(data.standings);
        }
      )
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const seasonEnds = season
    ? new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
        new Date(season.endsAt)
      )
    : null;

  return (
    <>
      {/* The sharing surface leads, unconditionally — see YourLinkCard. */}
      {currentUserId ? <YourLinkCard /> : <SignInForLinkCard />}

      {season && (
        <div className="lb-league-head">
          <span className="lb-league-icon" aria-hidden="true">
            <Gift size={22} weight="fill" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="lb-league-tier">
              {t("referralSeason", { number: season.number })}
              <ReferralScoringInfo />
            </p>
            <p className="lb-league-sub">
              {seasonEnds
                ? t("referralSeasonEnds", { date: seasonEnds })
                : null}{" "}
              · {t("referralSeasonRewards")}
            </p>
          </div>
        </div>
      )}

      {failed || (standings !== null && standings.length === 0) ? (
        <div className="lb-empty">
          <Gift size={48} weight="duotone" aria-hidden="true" />
          <p>{t("referralNoEntries")}</p>
        </div>
      ) : standings === null ? (
        <div className="flex items-center justify-center py-20">
          <div className="sol-spinner" />
          <span className="sr-only">{tCommon("loading")}</span>
        </div>
      ) : (
        <div className="lb-list">
          {standings.map((entry, i) => (
            <Link
              key={entry.userId}
              href={`/${locale}/profile/${encodeURIComponent(entry.username)}`}
              className="block no-underline"
            >
              <div
                className={cn("lb-row", entry.userId === currentUserId && "me")}
                style={{ "--i": i } as React.CSSProperties}
              >
                <span
                  className="lb-rank"
                  aria-label={t("rankLabel", { rank: entry.rank })}
                >
                  {entry.rank}
                </span>
                <div className="lb-av" aria-hidden="true">
                  {entry.avatarUrl ? (
                    <Image
                      src={entry.avatarUrl}
                      alt=""
                      width={36}
                      height={36}
                      unoptimized
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    <span>{entry.username.slice(0, 2).toUpperCase()}</span>
                  )}
                </div>
                <div className="lb-info">
                  <div className="lb-name">
                    <span className="truncate">{entry.username}</span>
                    {entry.userId === currentUserId && (
                      <span className="lb-me-tag">{t("you")}</span>
                    )}
                  </div>
                </div>
                <div className="lb-right">
                  <span className="lb-xp">
                    {t("referralPoints", { points: entry.points })}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
