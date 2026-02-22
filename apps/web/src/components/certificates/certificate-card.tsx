"use client";

import { useTranslations } from "next-intl";
import type { Certificate } from "@superteam-lms/types";
import { CERTIFICATE_STYLES as CS, cx } from "@/lib/styles/styleClasses";

interface CertificateCardProps {
  certificate: Certificate;
  recipientName?: string;
  /** "compact" for profile grid (no actions), "full" for my-certificates list */
  variant?: "compact" | "full";
  className?: string;
}

function truncateAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function CertificateCard({
  certificate,
  recipientName,
  variant = "full",
  className,
}: CertificateCardProps) {
  const t = useTranslations("certificates");
  const mintAddress = certificate.mintAddress;
  const wrapClass = variant === "compact" ? CS.compact.wrap : CS.wrap;

  return (
    <div className={cx(wrapClass, className)}>
      <div className={CS.inner}>
        <div className={CS.body}>
          {/* Eyebrow */}
          <div className={CS.eyebrow}>{t("title")}</div>

          {/* Course title */}
          <div className={CS.course}>{certificate.courseTitle}</div>

          {/* Subtitle */}
          {recipientName && <div className={CS.subtitle}>{recipientName}</div>}

          {/* Divider */}
          <div className={CS.divider} />

          {/* Meta row */}
          <div className={CS.metaRow}>
            <div className={CS.metaItem}>
              <div className={CS.metaKey}>
                {variant === "compact"
                  ? t("completed")
                  : t("completedOn", { date: "" }).trimEnd()}
              </div>
              <div className={CS.metaVal}>
                {certificate.mintedAt.toLocaleDateString()}
              </div>
            </div>
            <div className={CS.metaItem}>
              <div className={CS.metaKey}>
                {variant === "compact" ? t("mint") : t("mintAddress")}
              </div>
              {mintAddress !== null ? (
                <div className={cx(CS.metaVal, "font-mono text-xs")}>
                  {truncateAddress(mintAddress)}
                </div>
              ) : (
                <div className="text-xs italic text-text-3">{t("minting")}</div>
              )}
            </div>
          </div>

          {/* Footer with proof pill */}
          <div className={CS.foot}>
            <div className={CS.proofPill}>
              <span className={CS.proofDot} />
              {t("onChain")}
            </div>
            <div className={CS.network}>Solana</div>
          </div>
        </div>
      </div>
    </div>
  );
}
