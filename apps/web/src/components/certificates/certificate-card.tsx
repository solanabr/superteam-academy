"use client";

import { useTranslations } from "next-intl";
import type { Certificate } from "@superteam-lms/types";
import { Button } from "@/components/ui/button";
import { SolanaLogo } from "@/components/icons/solana-logo";
import { getExplorerUrl } from "@/lib/solana/mint-certificate";
import { CERTIFICATE_STYLES as CS, cx } from "@/lib/styles/styleClasses";

interface CertificateCardProps {
  certificate: Certificate;
  recipientName?: string;
  /** "compact" for profile grid (no actions), "full" for my-certificates (with actions) */
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
  const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK ?? "devnet";
  const mintAddress = certificate.mintAddress;
  const explorerUrl =
    mintAddress !== null ? getExplorerUrl(mintAddress, network) : null;

  const v = variant === "compact" ? CS.compact : CS.full;

  async function handleCopyLink() {
    if (explorerUrl) {
      await navigator.clipboard.writeText(explorerUrl);
    }
  }

  function handleShareTwitter() {
    if (!explorerUrl) return;
    const text = encodeURIComponent(
      `I just earned my "${certificate.courseTitle}" certificate on Superteam LMS! Verify on-chain: ${explorerUrl}`
    );
    window.open(
      `https://twitter.com/intent/tweet?text=${text}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

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

        {/* Actions — full variant only */}
        {variant === "full" && explorerUrl !== null && (
          <div className={CS.full.actions}>
            <Button variant="default" size="sm" className="flex-1" asChild>
              <a href={explorerUrl} target="_blank" rel="noopener noreferrer">
                {t("viewOnExplorer")} &rarr;
              </a>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleCopyLink}>
              {t("copyLink")}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleShareTwitter}>
              {t("share")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
