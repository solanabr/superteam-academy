"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { Copy, Check } from "@phosphor-icons/react";
import type { Certificate } from "@superteam-lms/types";
import { Button } from "@/components/ui/button";
import { CertificateCard } from "@/components/certificates/certificate-card";
import { createClient } from "@/lib/supabase/client";
import { getCoursesByIds } from "@/lib/sanity/queries";
import { CERTIFICATE_STYLES as CS } from "@/lib/styles/styleClasses";
import { truncateAddress } from "@/lib/utils";

interface CertDetail {
  cert: Certificate;
  recipientName: string;
  subtitle: string;
  mintAddress: string;
  metadataUri: string;
  network: string;
}

function useCertificateData(certId: string) {
  const [data, setData] = useState<CertDetail | null>(null);
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

        // Fetch learning path + difficulty from Sanity
        const courses = await getCoursesByIds([cert.course_id]);
        const course = courses[0];
        const parts: string[] = [];
        if (course?.learningPath) parts.push(course.learningPath);
        if (course?.difficulty) {
          parts.push(
            course.difficulty.charAt(0).toUpperCase() +
              course.difficulty.slice(1)
          );
        }

        setData({
          cert: {
            id: cert.id,
            userId: cert.user_id,
            courseId: cert.course_id,
            courseTitle: cert.course_title,
            mintAddress: cert.mint_address ?? "",
            metadataUri: cert.metadata_uri ?? "",
            mintedAt: new Date(cert.minted_at),
          },
          recipientName: profile?.username ?? "Builder",
          subtitle: parts.join(" · "),
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

function CopyableValue({ value, full }: { value: string; full: string }) {
  const t = useTranslations("certificates");
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(full);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className="group inline-flex items-center gap-1.5 font-mono text-xs font-medium text-text-2 transition-colors hover:text-text"
    >
      {value}
      {copied ? (
        <Check size={12} weight="bold" className="text-success" />
      ) : (
        <Copy
          size={12}
          weight="bold"
          className="opacity-0 transition-opacity group-hover:opacity-100"
        />
      )}
      {copied && (
        <span className="text-[10px] font-semibold text-success">
          {t("copied")}
        </span>
      )}
    </button>
  );
}

export default function CertificateViewPage() {
  const t = useTranslations("certificates");
  const params = useParams();
  const certId = typeof params.id === "string" ? params.id : "";
  const { data, notFound: certNotFound } = useCertificateData(certId);
  const v = CS.verify;

  if (certNotFound) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center">
        <h1 className="font-display text-2xl font-black">{t("notFound")}</h1>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="sol-spinner" />
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  const { cert, recipientName, subtitle, mintAddress, metadataUri, network } =
    data;
  const explorerUrl = mintAddress
    ? `https://explorer.solana.com/address/${mintAddress}?cluster=${network}`
    : "";

  function handleShareX() {
    const pageUrl = window.location.href;
    const text = encodeURIComponent(
      `I just earned my "${cert.courseTitle}" certificate on @SuperteamBR Academy! 🎓\n\nVerify on-chain:`
    );
    const url = encodeURIComponent(pageUrl);
    window.open(
      `https://x.com/intent/tweet?text=${text}&url=${url}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  async function handleCopyLink() {
    await navigator.clipboard.writeText(window.location.href);
  }

  return (
    <div className={v.page}>
      <h1 className={v.pageTitle}>{t("title")}</h1>

      {/* Certificate card — same design as list page */}
      <div className="cert-wrap-static">
        <CertificateCard
          certificate={cert}
          recipientName={recipientName}
          subtitle={subtitle}
          variant="full"
        />
      </div>

      {/* Action buttons */}
      <div className={v.actions}>
        {explorerUrl && (
          <Button variant="default" size="sm" asChild>
            <a href={explorerUrl} target="_blank" rel="noopener noreferrer">
              {t("viewOnExplorer")} &rarr;
            </a>
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={handleShareX}>
          {t("share")}
        </Button>
        <Button variant="outline" size="sm" onClick={handleCopyLink}>
          {t("copyLink")}
        </Button>
      </div>

      {/* NFT Details card — copyable values */}
      <div className={v.nftCard}>
        <div className={v.nftTitle}>{t("nftDetails")}</div>
        <div className={v.nftRow}>
          <span className={v.nftLabel}>{t("mintAddress")}</span>
          <CopyableValue
            value={truncateAddress(mintAddress)}
            full={mintAddress}
          />
        </div>
        <div className={v.nftRow}>
          <span className={v.nftLabel}>{t("metadataUri")}</span>
          <CopyableValue
            value={truncateAddress(metadataUri)}
            full={metadataUri}
          />
        </div>
        <div className={v.nftRow}>
          <span className={v.nftLabel}>{t("network")}</span>
          <span className={v.nftValue}>
            {network.charAt(0).toUpperCase() + network.slice(1)}
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
