"use client";

import { useId } from "react";
import { useLocale, useTranslations } from "next-intl";
import { LinkedinLogo, XLogo } from "@phosphor-icons/react";
import {
  CREDENTIAL_ISSUER_NAME,
  buildLinkedInAddToProfileUrl,
  buildXShareIntentUrl,
  trackCredentialShareClick,
} from "@/lib/credentials/share";
import type { CredentialShareSource } from "@/lib/credentials/share";

/**
 * Post-mint share nudge (LX-E3). Secondary to the EarnHandoffCard — the
 * Earn bridge stays the most prominent post-mint element (PED-16).
 *
 * Owner decision on #552: LinkedIn is Add-to-Profile ONLY (profile entry,
 * the evidence-backed action); the social-share channel is X.
 */

interface CredentialShareNudgeProps {
  source: CredentialShareSource;
  courseId: string;
  courseTitle: string;
  /** certificates.id — keys the public /certificates/[id] URL. */
  certificateId: string;
  /** Credential NFT mint address; null while the webhook mint is settling. */
  mintAddress: string | null;
  mintedAt: Date;
}

const linkClass =
  "inline-flex items-center gap-1.5 rounded-md border border-border bg-bg px-3.5 py-1.5 font-display text-xs font-bold text-text transition-colors hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export function CredentialShareNudge({
  source,
  courseId,
  courseTitle,
  certificateId,
  mintAddress,
  mintedAt,
}: CredentialShareNudgeProps) {
  const t = useTranslations("certificates");
  const locale = useLocale();
  // Unique per instance — the nudge can render once per course on the dashboard
  const titleId = useId();

  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_APP_URL ?? "");
  const certUrl = `${origin}/${locale}/certificates/${certificateId}`;

  const linkedInUrl = buildLinkedInAddToProfileUrl({
    name: courseTitle,
    organizationName: CREDENTIAL_ISSUER_NAME,
    issueYear: mintedAt.getFullYear(),
    issueMonth: mintedAt.getMonth() + 1,
    certUrl,
    certId: mintAddress ?? undefined,
  });
  const xShareUrl = buildXShareIntentUrl(
    t("shareXText", { courseTitle }),
    certUrl
  );

  return (
    <section
      aria-labelledby={titleId}
      className="rounded-xl border border-border bg-card px-5 py-4 shadow-[var(--shadow-card)]"
    >
      <h2 id={titleId} className="font-display text-xs font-bold text-text">
        {t("shareNudgeTitle")}
      </h2>
      <ul className="mt-2.5 flex flex-wrap gap-2">
        <li>
          <a
            href={linkedInUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              trackCredentialShareClick("linkedin_add", source, courseId)
            }
            className={linkClass}
          >
            <LinkedinLogo size={14} weight="bold" aria-hidden="true" />
            {t("addToLinkedIn")}
            <span className="sr-only">({t("opensInNewTab")})</span>
          </a>
        </li>
        <li>
          <a
            href={xShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackCredentialShareClick("x", source, courseId)}
            className={linkClass}
          >
            <XLogo size={14} weight="bold" aria-hidden="true" />
            {t("share")}
            <span className="sr-only">({t("opensInNewTab")})</span>
          </a>
        </li>
      </ul>
    </section>
  );
}
