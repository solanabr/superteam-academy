import { useTranslations } from "next-intl";

/**
 * The header's pre-release marker (spec: Beta tag, option 1e / 2c).
 *
 * Built from the achievement-badge vocabulary — flat fill, full keyline, hard
 * offset shadow — so it reads as part of the same family as the patches, chips
 * and level bands rather than as a generic status pill. All colour lives in
 * `.beta-tag` (globals.css); geometry, type and spacing are identical in both
 * themes.
 *
 * A label, not a control: no hover, no focus, no press. It is a sibling of the
 * wordmark rather than a child of its link, so it is neither clickable nor part
 * of the link's accessible name — the word is real text and is announced after
 * the lockup on its own.
 */
export function BetaTag() {
  const t = useTranslations("common");
  return <span className="beta-tag">{t("beta")}</span>;
}
