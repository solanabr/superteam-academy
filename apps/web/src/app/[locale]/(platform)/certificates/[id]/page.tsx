"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { Copy, Check } from "@phosphor-icons/react";
import type { Certificate } from "@superteam-lms/types";
import { Button } from "@/components/ui/button";
import { CertificateCard } from "@/components/certificates/certificate-card";
import { EarnHandoffCard } from "@/components/certificates/earn-handoff-card";
import { createClient } from "@/lib/supabase/client";
import { getCoursesByIds } from "@/lib/content/client-queries";
import {
  CREDENTIAL_ISSUER_NAME,
  buildLinkedInAddToProfileUrl,
  buildXShareIntentUrl,
  trackCredentialShareClick,
} from "@/lib/credentials/share";
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

        if (!cert || !cert.user_id) {
          setNotFound(true);
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("username, wallet_address")
          .eq("id", cert.user_id)
          .single();

        // Fetch learning path + difficulty from the content bundle
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
            mintedAt: new Date(cert.minted_at ?? Date.now()),
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
  const tCommon = useTranslations("common");
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
        <span className="sr-only">{tCommon("loading")}</span>
      </div>
    );
  }

  const { cert, recipientName, subtitle, mintAddress, metadataUri, network } =
    data;
  const explorerUrl = mintAddress
    ? `https://explorer.solana.com/address/${mintAddress}?cluster=${network}`
    : "";

  // This page only renders content client-side (data arrives via useEffect),
  // so window is available whenever `data` is set.
  const pageUrl = typeof window !== "undefined" ? window.location.href : "";
  const xShareUrl = pageUrl
    ? buildXShareIntentUrl(
        t("shareXText", { courseTitle: cert.courseTitle }),
        pageUrl
      )
    : "";
  // Profile-entry deep link (LX-E3) — NOT a social share; the share channel
  // is X. All fields come from data already on this page.
  const linkedInAddUrl = pageUrl
    ? buildLinkedInAddToProfileUrl({
        name: cert.courseTitle,
        organizationName: CREDENTIAL_ISSUER_NAME,
        issueYear: cert.mintedAt.getFullYear(),
        issueMonth: cert.mintedAt.getMonth() + 1,
        certUrl: pageUrl,
        certId: mintAddress || undefined,
      })
    : "";

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
        {linkedInAddUrl && (
          <Button variant="outline" size="sm" asChild>
            <a
              href={linkedInAddUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                trackCredentialShareClick(
                  "linkedin_add",
                  "certificate_page",
                  cert.courseId
                )
              }
            >
              {t("addToLinkedIn")}
              <span className="sr-only">({t("opensInNewTab")})</span>
            </a>
          </Button>
        )}
        {xShareUrl && (
          <Button variant="outline" size="sm" asChild>
            <a
              href={xShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                trackCredentialShareClick(
                  "x",
                  "certificate_page",
                  cert.courseId
                )
              }
            >
              {t("share")}
              <span className="sr-only">({t("opensInNewTab")})</span>
            </a>
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={handleCopyLink}>
          {t("copyLink")}
        </Button>
      </div>

      {/* Bridge from credential to paid work on Superteam Earn (LX-E4) */}
      <div className="mt-6">
        <EarnHandoffCard source="certificate_page" courseId={cert.courseId} />
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
