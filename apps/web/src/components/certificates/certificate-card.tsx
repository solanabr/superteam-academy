"use client";

import { useTranslations } from "next-intl";
import type { Certificate } from "@superteam-lms/types";
import { SolanaLogo } from "@/components/icons/solana-logo";
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

  const v = variant === "compact" ? CS.compact : CS.full;

  return (
    <div className={cx(CS.outer, CS.outerClickable, className)}>
      <div className={cx(CS.inner, v.inner)}>
        {/* Solana icon */}
        <div className={v.icon}>
          <SolanaLogo className={v.iconSvg} variant="brand" />
        </div>

        {/* Title + course */}
        <div className={v.title}>{t("title")}</div>
        <div className={v.course}>{certificate.courseTitle}</div>

        {/* Details rows */}
        <div className={v.details}>
          {recipientName && (
            <div className={v.row}>
              <span className={v.label}>{t("recipient")}</span>
              <span className={v.value}>{recipientName}</span>
            </div>
          )}
          <div className={v.row}>
            <span className={v.label}>
              {variant === "compact"
                ? t("completed")
                : t("completedOn", { date: "" }).trimEnd()}
            </span>
            <span className={v.value}>
              {certificate.mintedAt.toLocaleDateString()}
            </span>
          </div>
          <div className={v.row}>
            <span className={v.label}>
              {variant === "compact" ? t("mint") : t("mintAddress")}
            </span>
            {mintAddress !== null ? (
              <span className={v.valueMono}>
                {truncateAddress(mintAddress)}
              </span>
            ) : (
              <span className="text-xs italic text-text-3">{t("minting")}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
