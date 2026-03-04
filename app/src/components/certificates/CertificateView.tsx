"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useWallet } from "@solana/wallet-adapter-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, Share2, Printer, Award, AlertCircle, Twitter, Linkedin, Download, CheckCircle2, Copy, Check } from "lucide-react";
import html2canvas from "html2canvas-pro";
import { type HeliusAsset } from "@/lib/solana/helius";
import { SOLANA_NETWORK } from "@/lib/solana/constants";
import { toast } from "sonner";
import { CertificateDownload } from "@/components/certificates/CertificateDownload";

interface Props {
  assetId: string;
}

export function CertificateView({ assetId }: Props) {
  const t = useTranslations("certificate");
  const tc = useTranslations("common");
  const { publicKey } = useWallet();
  const [asset, setAsset] = useState<HeliusAsset | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const certificateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch the asset metadata via DAS API using getAssetsByOwner won't work without owner —
    // use getAsset directly if available, else fall back to showing assetId-based info.
    async function loadAsset() {
      try {
        const res = await fetch("/api/helius/asset", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assetId }),
        });
        if (!res.ok) {
          setNotFound(true);
          return;
        }
        const result = await res.json() as HeliusAsset | null;
        if (result) {
          setAsset(result);
        } else {
          setNotFound(true);
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    loadAsset();
  }, [assetId]);

  const handleDownloadImage = async () => {
    if (!certificateRef.current) return;
    const canvas = await html2canvas(certificateRef.current, {
      backgroundColor: null,
      scale: 2,
    });
    const link = document.createElement("a");
    link.download = `superteam-certificate-${asset?.id ?? "credential"}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const handleDownload = () => {
    if (!certificateRef.current) return;
    const printRoot = document.createElement("div");
    printRoot.id = "certificate-print-root";
    printRoot.innerHTML = certificateRef.current.outerHTML;
    document.body.appendChild(printRoot);
    const handler = () => document.body.removeChild(printRoot);
    window.addEventListener("afterprint", handler, { once: true });
    window.print();
    toast.success(t("downloadReady"));
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: t("title"), url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success(tc("linkCopied"));
      }
    } catch {
      // User cancelled share dialog or clipboard write failed
    }
  };

  const handleShareTwitter = () => {
    const url = window.location.href;
    const text = encodeURIComponent(
      "I just earned a Superteam Academy credential on Solana! 🎓 #Solana #Web3 #SuperteamAcademy"
    );
    const encodedUrl = encodeURIComponent(url);
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${encodedUrl}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const handleShareLinkedIn = () => {
    const url = encodeURIComponent(window.location.href);
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const courseName =
    asset?.content.metadata.attributes?.find((a) => a.trait_type === "Course")?.value ??
    asset?.content.metadata.name ??
    t("fallbackCourseName");

  const mintDate =
    asset?.content.metadata.attributes?.find((a) => a.trait_type === "Issued At")?.value ??
    null;

  const track =
    asset?.content.metadata.attributes?.find((a) => a.trait_type === "Track")?.value ?? null;

  const xpAwarded =
    asset?.content.metadata.attributes?.find((a) => a.trait_type === "XP")?.value ?? null;

  const metadataUri = asset?.content?.json_uri ?? null;
  const nftImage = asset?.content?.links?.image ?? null;
  const [uriCopied, setUriCopied] = useState(false);

  const handleCopyUri = async () => {
    if (!metadataUri) return;
    try {
      await navigator.clipboard.writeText(metadataUri);
      setUriCopied(true);
      setTimeout(() => setUriCopied(false), 2000);
    } catch {
      // Clipboard not available
    }
  };

  const ownerAddress = asset?.ownership?.owner ?? null;
  const truncatedOwner = ownerAddress
    ? `${ownerAddress.slice(0, 4)}...${ownerAddress.slice(-4)}`
    : null;
  const isOwner =
    ownerAddress !== null &&
    publicKey !== null &&
    publicKey?.toBase58() === ownerAddress;

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <Skeleton className="h-96 w-full rounded-2xl" />
        <div className="mt-6 flex justify-center gap-3">
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-28" />
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <AlertCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" aria-hidden="true" />
        <h2 className="text-xl font-semibold">{t("notFound")}</h2>
        <p className="mt-2 text-sm text-muted-foreground font-mono">{assetId}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Card className="overflow-hidden">
        {/* Certificate visual */}
        <div ref={certificateRef} className="relative bg-gradient-to-br from-primary/20 via-secondary/10 to-accent/20 p-12 text-center">
          {/* Decorative rings */}
          <div className="absolute inset-0 overflow-hidden opacity-10">
            <div className="absolute -left-16 -top-16 h-64 w-64 rounded-full border-4 border-primary" />
            <div className="absolute -bottom-16 -right-16 h-64 w-64 rounded-full border-4 border-secondary" />
          </div>

          {nftImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={nftImage}
              alt={courseName}
              className="relative mx-auto mb-4 h-24 w-24 rounded-xl object-cover shadow-lg ring-2 ring-primary/30"
            />
          ) : (
            <Award className="relative mx-auto mb-4 h-20 w-20 text-primary drop-shadow-lg" aria-hidden="true" />
          )}

          <p className="relative text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            {tc("appName")}
          </p>
          <h1 className="relative mt-2 text-3xl font-bold">{t("title")}</h1>
          <p className="relative mt-3 text-xl text-foreground/80">{courseName}</p>

          {truncatedOwner && (
            <p className="relative mt-3 text-sm font-medium text-muted-foreground font-mono">
              {t("awardedTo")}: {truncatedOwner}
            </p>
          )}

          <div className="relative mt-6 flex flex-wrap justify-center gap-2">
            {track && (
              <Badge variant="outline">
                {t("track")}: {track}
              </Badge>
            )}
            {xpAwarded && <Badge variant="outline">{xpAwarded} XP</Badge>}
            <Badge variant="outline" className="font-mono text-xs">
              {assetId.slice(0, 8)}...{assetId.slice(-8)}
            </Badge>
          </div>

          {mintDate && (
            <p className="relative mt-4 text-sm text-muted-foreground">
              {t("mintDate")}: {mintDate}
            </p>
          )}
        </div>

        {/* Ownership details */}
        {ownerAddress && (
          <div className="border-t px-6 py-4 space-y-2">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {t("ownership")}
            </p>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-muted-foreground">{t("ownedBy")}:</span>
              <span className="font-mono">{ownerAddress.slice(0, 8)}...{ownerAddress.slice(-8)}</span>
              {isOwner && (
                <Badge variant="secondary" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                  {t("youOwnThis")}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <a
                href={`https://explorer.solana.com/address/${assetId}?cluster=${SOLANA_NETWORK}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
              >
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
                {t("verifiedOnChain")}
              </a>
            </div>
          </div>
        )}

        {/* Metadata URI */}
        {metadataUri && (
          <div className="border-t px-6 py-4 space-y-2">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {t("metadataSection")}
            </p>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-muted-foreground">{t("metadataUri")}:</span>
              <a
                href={metadataUri}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-primary underline-offset-4 hover:underline truncate max-w-[260px]"
                title={metadataUri}
              >
                {metadataUri.slice(0, 24)}...{metadataUri.slice(-12)}
              </a>
              <button
                type="button"
                onClick={handleCopyUri}
                aria-label={uriCopied ? tc("copied") : tc("copy")}
                className="inline-flex items-center gap-1 rounded border border-border px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                {uriCopied ? (
                  <>
                    <Check className="h-3 w-3" aria-hidden="true" />
                    {tc("copied")}
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" aria-hidden="true" />
                    {tc("copy")}
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Canvas-generated certificate download */}
        <div className="border-t px-6 py-5">
          <p className="mb-4 text-center text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t("download")}
          </p>
          <CertificateDownload
            courseName={courseName}
            ownerAddress={ownerAddress}
            completionDate={mintDate ?? null}
            xpEarned={xpAwarded ?? null}
            certificateUrl={typeof window !== "undefined" ? window.location.href : ""}
            filename={`superteam-certificate-${assetId}`}
          />
        </div>

        {/* Action buttons */}
        <CardContent className="flex flex-wrap justify-center gap-3 p-6">
          <Button variant="outline" className="gap-2" asChild>
            <a
              href={`https://explorer.solana.com/address/${assetId}?cluster=${SOLANA_NETWORK}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              {t("verifyOnChain")}
            </a>
          </Button>
          <Button variant="outline" className="gap-2" onClick={handleShare}>
            <Share2 className="h-4 w-4" aria-hidden="true" />
            {t("share")}
          </Button>
          <Button variant="outline" className="gap-2" onClick={handleShareTwitter}>
            <Twitter className="h-4 w-4" aria-hidden="true" />
            {t("shareOnX")}
          </Button>
          <Button variant="outline" className="gap-2" onClick={handleShareLinkedIn}>
            <Linkedin className="h-4 w-4" aria-hidden="true" />
            {t("shareOnLinkedIn")}
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleDownloadImage}
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            {t("downloadImage")}
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleDownload}
          >
            <Printer className="h-4 w-4" aria-hidden="true" />
            {t("print")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
