"use client";

import { use, useState, useEffect } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { PlatformLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { heliusCredentialService } from "@/services";
import { trackLabels } from "@/lib/constants";
import type { Credential } from "@/types";
import {
  ArrowLeft,
  ExternalLink,
  Award,
  Share2,
  Download,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";

export default function CertificatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations("certificate");
  const [credential, setCredential] = useState<Credential | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [resolvedImageUrl, setResolvedImageUrl] = useState<string>("");

  useEffect(() => {
    heliusCredentialService
      .getCredentialByMint(id)
      .then((cred) => {
        setCredential(cred);
        // If credential has a metadata URI but no image from DAS,
        // fetch our metadata endpoint to get the image
        if (cred && !cred.imageUrl && cred.metadataUri) {
          const match = cred.metadataUri.match(/\/api\/metadata\/credential\/([^/?]+)/);
          if (match) {
            fetch(`/api/metadata/credential/${match[1]}`)
              .then((r) => r.json())
              .then((meta) => { if (meta.image) setResolvedImageUrl(meta.image); })
              .catch(() => {});
          }
        }
      })
      .catch(() => setCredential(null))
      .finally(() => setLoading(false));
  }, [id]);

  const copyMint = () => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const explorerUrl = `https://explorer.solana.com/address/${id}?cluster=devnet`;

  if (loading) {
    return (
      <PlatformLayout>
        <div className="container mx-auto px-4 py-12 max-w-2xl space-y-6">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="aspect-[4/3] rounded-xl" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
      </PlatformLayout>
    );
  }

  return (
    <PlatformLayout>
      <div className="container mx-auto px-4 py-8 lg:py-12 max-w-2xl">
        <Link
          href="/profile"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Profile
        </Link>

        {/* Certificate card */}
        <div data-certificate-card className="rounded-2xl border bg-card overflow-hidden">
          {/* Image / placeholder */}
          <div className="aspect-[16/9] bg-gradient-to-br from-primary/10 via-primary/5 to-transparent flex items-center justify-center relative">
            {(credential?.imageUrl || resolvedImageUrl) && !(credential?.imageUrl ?? "").endsWith("/og.png") ? (
              <Image
                src={credential?.imageUrl || resolvedImageUrl}
                alt={credential?.name ?? "Credential"}
                fill
                sizes="(max-width: 768px) 100vw, 700px"
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="text-center space-y-3">
                <Award className="h-16 w-16 mx-auto text-primary/30" />
                <p className="text-xl font-bold">{t("title")}</p>
                <p className="text-sm text-muted-foreground">Superteam Academy</p>
              </div>
            )}
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            <div>
              <h1 className="text-2xl font-bold">
                {credential?.name ?? t("title")}
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">
                {t("issuedTo")}: {credential?.owner ?? "—"}
              </p>
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-4">
              {credential?.trackId && (
                <div>
                  <p className="text-xs text-muted-foreground">{t("track")}</p>
                  <p className="text-sm font-medium">
                    {trackLabels[credential.trackId]}
                  </p>
                </div>
              )}
              {credential?.coursesCompleted !== undefined && (
                <div>
                  <p className="text-xs text-muted-foreground">
                    {t("coursesCompleted")}
                  </p>
                  <p className="text-sm font-medium">
                    {credential.coursesCompleted}
                  </p>
                </div>
              )}
              {credential?.totalXp !== undefined && (
                <div>
                  <p className="text-xs text-muted-foreground">
                    {t("totalXp")}
                  </p>
                  <p className="text-sm font-medium">
                    {credential.totalXp} XP
                  </p>
                </div>
              )}
            </div>

            <Separator />

            {/* Mint address */}
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                {t("mintAddress")}
              </p>
              <div className="flex items-center gap-2">
                <code className="text-xs font-mono bg-muted px-2 py-1 rounded flex-1 truncate">
                  {id}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={copyMint}
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <Button asChild className="gap-2">
                <a href={explorerUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  {t("verifyOnChain")}
                </a>
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => {
                  const url = `${window.location.origin}/certificates/${id}`;
                  if (navigator.share) {
                    navigator.share({
                      title: credential?.name ?? "Superteam Academy Credential",
                      text: `Check out my on-chain credential from Superteam Academy!`,
                      url,
                    });
                  } else {
                    navigator.clipboard.writeText(url);
                    toast.success("Link copied to clipboard");
                  }
                }}
              >
                <Share2 className="h-4 w-4" />
                {t("share")}
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => {
                  // Download certificate image if available, otherwise open explorer
                  if (credential?.imageUrl) {
                    const link = document.createElement("a");
                    link.href = credential.imageUrl;
                    link.download = `credential-${id.slice(0, 8)}.png`;
                    link.target = "_blank";
                    link.click();
                  } else {
                    window.open(explorerUrl, "_blank");
                    toast.info("View and save from Solana Explorer");
                  }
                }}
              >
                <Download className="h-4 w-4" />
                {t("download")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </PlatformLayout>
  );
}
