"use client";

import { useTranslations } from "next-intl";

/**
 * The rank marker shared by every `.lb-row` list — the global board's ranked
 * rows and the cohort league's rows.
 *
 * Shared rather than duplicated because the two halves have to agree: the
 * 40cd9caf spec gives ranks 1-3 a notched tab AND a solid card, and gives
 * everything below a bare numeral AND a dashed outline. The dashed treatment
 * only reads as "below the podium" while the solid top three are there to
 * contrast against. The cohort row shipped with neither half, so on the League
 * tab — which has no separate podium and renders rank 1 downward as rows —
 * every row went dashed and the board read as broken (owner, 21-08).
 */

/** Only the top three carry a rank tab; everything below is a bare numeral. */
export const ORDINAL: Record<number, string | undefined> = {
  1: "ST",
  2: "ND",
  3: "RD",
};

export function isTopRank(rank: number): boolean {
  return ORDINAL[rank] !== undefined;
}

/**
 * `data-top` for a row's wrapper. Empty string (not `true`) because the CSS
 * matches on attribute presence, and `undefined` omits it entirely.
 */
export function topRankAttr(rank: number): "" | undefined {
  return isTopRank(rank) ? "" : undefined;
}

export function RankMarker({ rank }: { rank: number }) {
  const t = useTranslations("gamification");

  if (!isTopRank(rank)) {
    return (
      <span className="lb-rank" aria-label={t("rankLabel", { rank })}>
        {rank}
      </span>
    );
  }

  return (
    <div
      className="rank-tab"
      data-rank={rank}
      aria-label={t("rankLabel", { rank })}
    >
      <span className="rank-tab-num">{rank}</span>
      <span className="rank-tab-ord" aria-hidden="true">
        {ORDINAL[rank]}
      </span>
    </div>
  );
}
