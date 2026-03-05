"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { useMintCertificate } from "@/hooks/use-mint-certificate";
import type { CertificateData } from "@/types/certificate";
import {
  Award,
  Loader2,
  CheckCircle2,
  X as XIcon,
  ExternalLink,
} from "lucide-react";

const SOLSCAN_DEVNET = "https://solscan.io";
const PROFILE_NAME_KEY = "st-academy:profile-name";

function getProfileName(): string {
  try {
    return localStorage.getItem(PROFILE_NAME_KEY) ?? "";
  } catch {
    return "";
  }
}

interface CertificateMintModalProps {
  courseSlug: string;
  courseTitle: string;
  track?: string;
  isOpen: boolean;
  onClose: () => void;
  /** If provided, skips mint and shows certificate details directly */
  existingCert?: CertificateData | null;
}

export function CertificateMintModal({
  courseSlug,
  courseTitle,
  track,
  isOpen,
  onClose,
  existingCert,
}: CertificateMintModalProps) {
  const t = useTranslations("certificate");
  const { mint, loading, getCertificate } = useMintCertificate();
  const [mintedCert, setMintedCert] = useState<CertificateData | null>(null);
  const [mintError, setMintError] = useState(false);

  // Resolve which cert to display: prop > just-minted > load from storage
  const cert = existingCert ?? mintedCert;

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setMintedCert(null);
      setMintError(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleMint = async () => {
    setMintError(false);
    const result = await mint(courseSlug, courseTitle, track);
    if (result) {
      setMintedCert(result);
    } else {
      setMintError(true);
    }
  };

  const profileName = getProfileName();
  const solscanTxUrl = cert?.txSig
    ? `${SOLSCAN_DEVNET}/tx/${cert.txSig}?cluster=devnet`
    : null;
  const solscanAssetUrl = cert?.assetId
    ? `${SOLSCAN_DEVNET}/account/${cert.assetId}?cluster=devnet`
    : null;

  // Show certificate details view
  if (cert) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        onClick={onClose}
      >
        <div
          className="relative w-full max-w-md rounded-2xl border-2 border-[hsl(var(--brand-logo-yellow))] bg-card p-8 shadow-xl dark:border-[#008c4C]"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted"
          >
            <XIcon className="h-5 w-5" />
          </button>

          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[hsl(var(--brand-logo-yellow))]/20 dark:bg-[#008c4C]/10">
              <Award className="h-8 w-8 text-[hsl(var(--brand-logo-yellow))] dark:text-[#008c4C]" />
            </div>

            <h3 className="mb-1 text-xl font-bold text-[hsl(var(--brand-logo-yellow))] dark:text-[#008c4C]">
              {t("title")}
            </h3>
            <p className="mb-4 text-lg font-semibold text-foreground">
              {cert.courseTitle}
            </p>
          </div>

          <div className="space-y-3 rounded-lg bg-muted/50 p-4 text-sm">
            {profileName && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("issuedTo")}</span>
                <span className="font-medium text-foreground">
                  {profileName}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("completedOn")}</span>
              <span className="font-medium text-foreground">
                {new Date(cert.mintedAt).toLocaleDateString()}
              </span>
            </div>
            {cert.track && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("track")}</span>
                <span className="font-medium text-foreground">
                  {cert.track}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <span
                className={`font-medium ${cert.isOnChain ? "text-emerald-600" : "text-muted-foreground"}`}
              >
                {cert.isOnChain ? "On-chain cNFT" : t("localCertificate")}
              </span>
            </div>
            {cert.txSig && (
              <div className="flex justify-between gap-2">
                <span className="shrink-0 text-muted-foreground">Tx</span>
                <code className="truncate rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
                  {cert.txSig}
                </code>
              </div>
            )}
          </div>

          <div className="mt-4 space-y-2">
            {/* Solscan link */}
            {(solscanTxUrl || solscanAssetUrl) && (
              <Button asChild variant="outline" className="w-full gap-2">
                <a
                  href={solscanTxUrl ?? solscanAssetUrl ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4" />
                  {t("viewOnSolscan")}
                </a>
              </Button>
            )}

            {/* View full certificate page */}
            <Button
              asChild
              className="w-full gap-2 bg-[hsl(var(--brand-logo-yellow))] text-[hsl(var(--brand-dark))] hover:bg-[hsl(var(--brand-logo-yellow))]/90 dark:bg-[#008c4C] dark:text-white dark:hover:bg-[#006b3a]"
            >
              <Link href={`/certificates/${courseSlug}`}>
                {t("viewCertificate")}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show mint view (not yet minted)
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border-2 border-[hsl(var(--brand-logo-yellow))] bg-card p-8 shadow-xl dark:border-[#008c4C]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted"
        >
          <XIcon className="h-5 w-5" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[hsl(var(--brand-logo-yellow))]/20 dark:bg-[#008c4C]/10">
            <Award className="h-10 w-10 text-[hsl(var(--brand-logo-yellow))] dark:text-[#008c4C]" />
          </div>

          <h3 className="mb-2 text-2xl font-bold text-[hsl(var(--brand-logo-yellow))] dark:text-[#008c4C]">
            {t("congratsTitle")}
          </h3>

          <p className="mb-6 text-sm text-muted-foreground">
            {t("congratsDescription", { course: courseTitle })}
          </p>

          {mintError && (
            <p className="mb-4 text-sm text-red-500">{t("mintError")}</p>
          )}

          <Button
            onClick={handleMint}
            disabled={loading}
            className="w-full bg-[hsl(var(--brand-logo-yellow))] text-[hsl(var(--brand-dark))] hover:bg-[hsl(var(--brand-logo-yellow))]/90 dark:bg-[#008c4C] dark:text-white dark:hover:bg-[#006b3a]"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("minting")}
              </>
            ) : (
              t("mintButton")
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
