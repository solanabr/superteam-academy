"use client";

import { useTranslations } from "next-intl";
import { SealCheck } from "@phosphor-icons/react";

interface VerifiedBadgeProps {
  /** Tailwind size classes; defaults to the inline-with-text size. */
  className?: string;
}

/**
 * Verified-teacher mark (#997).
 *
 * The badge is admin-granted (`profiles.verified`, service_role writes only) —
 * a self-service badge would mean nothing.
 *
 * Deliberately not icon-only to assistive tech: the label carries the meaning,
 * because "verified" is a claim about trust and a screen-reader user must get
 * it too. `role="img"` keeps it a single labelled object rather than letting
 * the SVG leak through.
 */
export function VerifiedBadge({ className }: VerifiedBadgeProps) {
  const t = useTranslations("profile");

  return (
    <span
      role="img"
      aria-label={t("verifiedTeacher")}
      title={t("verifiedTeacher")}
      className="inline-flex shrink-0 align-middle text-primary"
    >
      <SealCheck
        size={16}
        weight="fill"
        className={className}
        aria-hidden="true"
      />
    </span>
  );
}
