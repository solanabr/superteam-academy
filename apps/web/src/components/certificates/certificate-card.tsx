"use client";

import { useTranslations } from "next-intl";
import type { Certificate } from "@superteam-lms/types";
import { CERTIFICATE_STYLES as CS, cx } from "@/lib/styles/styleClasses";
import { truncateAddress } from "@/lib/utils";

interface CertificateCardProps {
  certificate: Certificate;
  recipientName?: string;
  /** Learning path + difficulty, e.g. "Anchor Development · Intermediate" */
  subtitle?: string;
  /** "compact" for profile grid (no actions), "full" for my-certificates list */
  variant?: "compact" | "full";
  className?: string;
}

export function CertificateCard({
  certificate,
  recipientName,
  subtitle,
  variant = "full",
  className,
}: CertificateCardProps) {
  const t = useTranslations("certificates");
  const mintAddress = certificate.mintAddress;
  const isCompact = variant === "compact";
  const wrapClass = isCompact ? CS.compact.wrap : CS.wrap;

  const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK ?? "devnet";
  const cluster = network === "mainnet" ? "mainnet-beta" : network;
  const explorerUrl = mintAddress
    ? `https://explorer.solana.com/address/${mintAddress}?cluster=${cluster}`
    : null;

  return (
    <div className={cx(wrapClass, className)}>
      <div className={CS.inner}>
        <div className={CS.body}>
          {/* Eyebrow — "Certificate of Completion" */}
          <div className={CS.eyebrow}>{t("title")}</div>

          {/* Course title */}
          <div className={CS.course}>{certificate.courseTitle}</div>

          {/* Subtitle — learning path · difficulty */}
          {subtitle && <div className={CS.subtitle}>{subtitle}</div>}

          {/* Divider — gradient line */}
          <div className={CS.divider} />

          {/* Meta row — 3 columns: Issued to, Date, Mint */}
          <div className={CS.metaRow}>
            {recipientName && (
              <div className={CS.metaItem}>
                <div className={CS.metaKey}>{t("recipient")}</div>
                <div className={CS.metaVal}>{recipientName}</div>
              </div>
            )}
            <div className={CS.metaItem}>
              <div className={CS.metaKey}>
                {isCompact
                  ? t("completed")
                  : t("completedOn", { date: "" }).trimEnd()}
              </div>
              <div className={CS.metaVal}>
                {certificate.mintedAt.toLocaleDateString()}
              </div>
            </div>
            <div className={CS.metaItem}>
              <div className={CS.metaKey}>
                {isCompact ? t("mint") : t("mintAddress")}
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

          {/* Footer — proof pill + network */}
          <div className={CS.foot}>
            {explorerUrl ? (
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={CS.proofPill}
                onClick={(e) => e.stopPropagation()}
              >
                <span className={CS.proofDot} />
                {t("onChain")}
              </a>
            ) : (
              <div className={CS.proofPill}>
                <span className={CS.proofDot} />
                {t("minting")}
              </div>
            )}
            <div className={CS.network}>
              Solana {cluster.charAt(0).toUpperCase() + cluster.slice(1)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
