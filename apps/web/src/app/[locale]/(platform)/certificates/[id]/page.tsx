"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SolanaLogo } from "@/components/icons/solana-logo";
import { createClient } from "@/lib/supabase/client";
import { CERTIFICATE_STYLES as CS, cx } from "@/lib/styles/styleClasses";

function truncateAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

interface CertificateData {
  id: string;
  courseTitle: string;
  recipientName: string;
  recipientWallet: string;
  completionDate: string;
  mintAddress: string;
  metadataUri: string;
  network: string;
}

function useCertificateData(certId: string) {
  const [data, setData] = useState<CertificateData | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = createClient();

        const { data: cert } = await supabase
          .from("certificates")
          .select("*")
          .eq("id", certId)
          .single();

        if (!cert) {
          setNotFound(true);
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("username, wallet_address")
          .eq("id", cert.user_id)
          .single();

        setData({
          id: cert.id,
          courseTitle: cert.course_title,
          recipientName: profile?.username ?? "Builder",
          recipientWallet: profile?.wallet_address
            ? truncateAddress(profile.wallet_address)
            : "",
          completionDate: new Date(cert.minted_at).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          mintAddress: cert.mint_address ?? "",
          metadataUri: cert.metadata_uri ?? "",
          network: "devnet",
        });
      } catch {
        setNotFound(true);
      }
    }

    fetchData();
  }, [certId]);

  return { data, notFound };
}

export default function CertificateViewPage() {
  const t = useTranslations("certificates");
  const params = useParams();
  const certId = typeof params.id === "string" ? params.id : "";
  const { data: cert, notFound: certNotFound } = useCertificateData(certId);
  const v = CS.verify;

  if (certNotFound) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center">
        <h1 className="font-display text-2xl font-black">{t("notFound")}</h1>
      </div>
    );
  }

  if (!cert) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  // Bind to a non-null const so closures can see it without TS complaining
  const certData = cert;
  const explorerUrl = `https://explorer.solana.com/address/${certData.mintAddress}?cluster=${certData.network}`;

  async function handleCopyLink() {
    await navigator.clipboard.writeText(window.location.href);
  }

  function handleDownload() {
    window.print();
  }

  function handleShareTwitter() {
    const text = encodeURIComponent(
      `I just earned my "${certData.courseTitle}" certificate on Solarium! Verify on-chain: ${explorerUrl}`
    );
    window.open(
      `https://twitter.com/intent/tweet?text=${text}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  return (
    <div className={v.page}>
      <h1 className={v.pageTitle}>{t("title")}</h1>

      {/* Certificate card — static (no hover lift) */}
      <div className={CS.wrap}>
        <div className={cx(CS.inner, v.inner)}>
          {/* Solana icon */}
          <div className={v.icon}>
            <SolanaLogo className={v.iconSvg} variant="brand" />
          </div>

          {/* Heading + gradient bar */}
          <div className={v.heading}>{t("title")}</div>
          <div className={v.gradientBar} />

          {/* Recipient */}
          <div className={v.label}>{t("recipient")}</div>
          <div className={v.recipient}>{certData.recipientName}</div>
          {certData.recipientWallet && (
            <div className={v.wallet}>{certData.recipientWallet}</div>
          )}

          {/* Completion date */}
          <div className={v.date}>
            {t("completedOn", { date: certData.completionDate })}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className={v.actions}>
        <Button variant="default" size="sm" asChild>
          <a href={explorerUrl} target="_blank" rel="noopener noreferrer">
            {t("viewOnExplorer")} &rarr;
          </a>
        </Button>
        <Button variant="outline" size="sm" onClick={handleShareTwitter}>
          {t("share")}
        </Button>
        <Button variant="outline" size="sm" onClick={handleCopyLink}>
          {t("copyLink")}
        </Button>
        <Button variant="outline" size="sm" onClick={handleDownload}>
          {t("download")}
        </Button>
      </div>

      {/* NFT Details card */}
      <div className={v.nftCard}>
        <div className={v.nftTitle}>{t("nftDetails")}</div>
        <div className={v.nftRow}>
          <span className={v.nftLabel}>{t("mintAddress")}</span>
          <span className={cx(v.nftValue, v.nftValueMono)}>
            {truncateAddress(certData.mintAddress)}
          </span>
        </div>
        <div className={v.nftRow}>
          <span className={v.nftLabel}>{t("metadataUri")}</span>
          <span className={cx(v.nftValue, v.nftValueMono)}>
            {truncateAddress(certData.metadataUri)}
          </span>
        </div>
        <div className={v.nftRow}>
          <span className={v.nftLabel}>{t("network")}</span>
          <span className={v.nftValue}>
            {certData.network.charAt(0).toUpperCase() +
              certData.network.slice(1)}
          </span>
        </div>
        <div className={v.nftRow}>
          <span className={v.nftLabel}>{t("standard")}</span>
          <span className={v.nftValue}>Metaplex Core</span>
        </div>
        <div className={v.nftRow}>
          <span className={v.nftLabel}>{t("collection")}</span>
          <span className={v.nftValue}>{t("collection")}</span>
        </div>
      </div>
    </div>
  );
}
