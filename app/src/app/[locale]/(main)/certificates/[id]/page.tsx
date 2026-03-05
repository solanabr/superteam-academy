"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Award,
  ExternalLink,
  Share2,
  Download,
  Twitter,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useMintCertificate } from "@/hooks/use-mint-certificate";
import { getCourseBySlug } from "@/services/cms";
import type { CertificateData } from "@/types/certificate";

const SOLSCAN_DEVNET = "https://solscan.io";
const PROFILE_NAME_KEY = "st-academy:profile-name";

function getProfileName(): string {
  try {
    return localStorage.getItem(PROFILE_NAME_KEY) ?? "";
  } catch {
    return "";
  }
}

export default function CertificatePage() {
  const params = useParams<{ id: string }>();
  const courseSlug = params.id;
  const t = useTranslations("certificate");
  const { connected, publicKey } = useAuth();
  const {
    getCertificate,
    mint,
    loading: minting,
    error: mintError,
  } = useMintCertificate();
  const [cert, setCert] = useState<CertificateData | null>(null);
  const [profileName, setProfileName] = useState("");

  const [courseTitle, setCourseTitle] = useState("");
  const [courseTrack, setCourseTrack] = useState<string | undefined>();

  useEffect(() => {
    if (!connected) return;
    setCert(getCertificate(courseSlug));
    setProfileName(getProfileName());
  }, [connected, courseSlug, getCertificate]);

  // Load course info for minting when cert doesn't exist yet
  useEffect(() => {
    getCourseBySlug(courseSlug).then((course) => {
      if (course) {
        setCourseTitle(course.title);
        setCourseTrack(course.track);
      }
    });
  }, [courseSlug]);

  const walletAddr = publicKey?.toBase58() ?? "";
  const shortWallet =
    walletAddr.length > 8
      ? `${walletAddr.slice(0, 4)}...${walletAddr.slice(-4)}`
      : walletAddr;

  const recipientName = profileName || shortWallet || "Builder";
  const completedDate = cert
    ? new Date(cert.mintedAt).toLocaleDateString()
    : "—";
  const verifyUrl = cert?.txSig
    ? `${SOLSCAN_DEVNET}/tx/${cert.txSig}?cluster=devnet`
    : cert?.assetId
      ? `${SOLSCAN_DEVNET}/address/${cert.assetId}?cluster=devnet`
      : null;

  if (!connected) {
    return (
      <div className="container max-w-3xl py-12 text-center">
        <Award className="mx-auto h-12 w-12 text-muted-foreground/40" />
        <p className="mt-4 text-muted-foreground">{t("connectWalletFirst")}</p>
      </div>
    );
  }

  if (!cert) {
    return (
      <div className="container max-w-3xl py-12 text-center">
        <Award className="mx-auto h-12 w-12 text-muted-foreground/40" />
        <h2 className="mt-4 text-xl font-bold text-foreground">
          {courseTitle || courseSlug}
        </h2>
        <p className="mt-2 text-muted-foreground">{t("noCertificatesYet")}</p>
        <Button
          onClick={async () => {
            const title = courseTitle || courseSlug;
            const result = await mint(courseSlug, title, courseTrack);
            if (result) setCert(result);
          }}
          disabled={minting}
          className="mt-6 gap-2 bg-[hsl(var(--brand-logo-yellow))] text-[hsl(0,0%,9%)] font-semibold hover:bg-[hsl(var(--brand-logo-yellow)/0.85)]"
        >
          {minting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("minting")}
            </>
          ) : (
            <>
              <Award className="h-4 w-4" />
              {t("mintButton")}
            </>
          )}
        </Button>
        {mintError && (
          <p className="mt-2 text-xs text-red-500">{t("mintError")}</p>
        )}
      </div>
    );
  }

  return (
    <div className="container max-w-3xl py-12">
      {/* ---------- Certificate Card ---------- */}
      <Card className="relative overflow-hidden border-none shadow-2xl">
        {/* Top gradient bar */}
        <div className="gradient-solana h-2 w-full" />

        {/* Decorative double border */}
        <div className="mx-4 mt-4 mb-0 rounded-xl border-[3px] border-double border-[hsl(var(--brand-logo-green))]">
          <div className="rounded-lg border border-[hsl(var(--brand-logo-green)/0.3)] p-8 sm:p-12">
            {/* Corner ornaments */}
            <div className="pointer-events-none absolute top-10 left-10 h-8 w-8 border-t-2 border-l-2 border-[hsl(var(--brand-logo-green)/0.4)] rounded-tl-sm" />
            <div className="pointer-events-none absolute top-10 right-10 h-8 w-8 border-t-2 border-r-2 border-[hsl(var(--brand-logo-green)/0.4)] rounded-tr-sm" />
            <div className="pointer-events-none absolute bottom-10 left-10 h-8 w-8 border-b-2 border-l-2 border-[hsl(var(--brand-logo-green)/0.4)] rounded-bl-sm" />
            <div className="pointer-events-none absolute bottom-10 right-10 h-8 w-8 border-b-2 border-r-2 border-[hsl(var(--brand-logo-green)/0.4)] rounded-br-sm" />

            {/* Award icon */}
            <div className="flex justify-center">
              <div className="gradient-solana flex h-20 w-20 items-center justify-center rounded-full shadow-lg">
                <Award className="h-10 w-10 text-white" strokeWidth={1.5} />
              </div>
            </div>

            {/* Title */}
            <h1 className="mt-6 text-center text-sm font-semibold uppercase tracking-[0.3em] text-[hsl(var(--brand-logo-green))]">
              {t("title")}
            </h1>

            {/* Decorative divider */}
            <div className="my-4 flex items-center justify-center gap-3">
              <span className="h-px w-16 bg-[hsl(var(--brand-logo-green)/0.3)]" />
              <span className="h-1.5 w-1.5 rotate-45 bg-[hsl(var(--brand-logo-green))]" />
              <span className="h-px w-16 bg-[hsl(var(--brand-logo-green)/0.3)]" />
            </div>

            {/* Congratulations heading */}
            <h2 className="text-center text-3xl font-bold tracking-tight text-[hsl(var(--brand-logo-green))] sm:text-4xl">
              {t("congratulations")}
            </h2>

            {/* Course name */}
            <p className="mt-3 text-center text-xl font-medium text-foreground/80 sm:text-2xl">
              {cert.courseTitle}
            </p>

            {/* Wider divider */}
            <div className="my-6 flex items-center justify-center gap-3">
              <span className="h-px w-24 bg-[hsl(var(--brand-logo-green)/0.25)]" />
              <span className="h-1 w-1 rotate-45 bg-[hsl(var(--brand-logo-green)/0.5)]" />
              <span className="h-px w-24 bg-[hsl(var(--brand-logo-green)/0.25)]" />
            </div>

            {/* Certifies that + recipient */}
            <p className="text-center text-base text-muted-foreground">
              {t("certDesc")}
            </p>
            <p className="mt-2 text-center text-2xl font-bold text-foreground sm:text-3xl">
              {recipientName}
            </p>

            {/* Issued to / Completed on */}
            <div className="mt-6 flex flex-col items-center gap-1">
              <p className="text-sm text-muted-foreground">
                {t("issuedTo")}{" "}
                <strong className="text-foreground">{recipientName}</strong>
              </p>
              <p className="text-sm text-muted-foreground">
                {t("completedOn")}{" "}
                <strong className="text-foreground">{completedDate}</strong>
              </p>
            </div>

            {/* Bottom divider */}
            <div className="my-6 flex items-center justify-center gap-3">
              <span className="h-px w-16 bg-[hsl(var(--brand-logo-green)/0.3)]" />
              <span className="h-1.5 w-1.5 rotate-45 bg-[hsl(var(--brand-logo-green))]" />
              <span className="h-px w-16 bg-[hsl(var(--brand-logo-green)/0.3)]" />
            </div>

            {/* Track */}
            {cert.track && (
              <p className="text-center text-sm font-medium text-muted-foreground">
                {t("track")}:{" "}
                <span className="text-[hsl(var(--brand-logo-green))]">
                  {cert.track}
                </span>
              </p>
            )}
          </div>
        </div>

        {/* Bottom gradient bar */}
        <div className="gradient-solana mx-4 mt-0 mb-4 h-1 rounded-b-xl" />
      </Card>

      {/* ---------- NFT Details Card ---------- */}
      <Card className="mt-6 overflow-hidden">
        <div className="gradient-solana h-1 w-full" />
        <CardContent className="space-y-4 p-6">
          <h3 className="text-lg font-semibold text-[hsl(var(--brand-logo-green))]">
            {t("nftDetails")}
          </h3>

          {/* Transaction / Asset ID */}
          {cert.txSig && (
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Transaction
              </p>
              <code className="block rounded-lg border bg-muted/50 px-4 py-2.5 font-mono text-sm text-foreground break-all">
                {cert.txSig}
              </code>
            </div>
          )}

          {cert.assetId && (
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t("mintAddress")}
              </p>
              <code className="block rounded-lg border bg-muted/50 px-4 py-2.5 font-mono text-sm text-foreground break-all">
                {cert.assetId}
              </code>
            </div>
          )}

          {/* Mint button when pending */}
          {!cert.isOnChain && (
            <div className="space-y-2">
              <Button
                onClick={async () => {
                  const updated = await mint(
                    cert.courseSlug,
                    cert.courseTitle,
                    cert.track,
                  );
                  if (updated) setCert(updated);
                }}
                disabled={minting}
                className="w-full gap-2 bg-[hsl(var(--brand-logo-yellow))] text-[hsl(0,0%,9%)] font-semibold hover:bg-[hsl(var(--brand-logo-yellow)/0.85)] sm:w-auto"
              >
                <Award className="h-4 w-4" />
                {minting ? t("minting") : t("mintButton")}
              </Button>
              {mintError && (
                <p className="text-xs text-red-500">{t("mintError")}</p>
              )}
            </div>
          )}

          {/* Track */}
          {cert.track && (
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t("track")}
              </p>
              <p className="text-sm font-medium text-foreground">
                {cert.track}
              </p>
            </div>
          )}

          {/* View on Solscan */}
          {verifyUrl && (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
            >
              <a href={verifyUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                {t("viewOnSolscan")}
              </a>
            </Button>
          )}
        </CardContent>
      </Card>

      {/* ---------- Share & Download Actions ---------- */}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {verifyUrl && (
          <Button
            asChild
            variant="outline"
            className="border-[hsl(var(--brand-logo-green)/0.4)] hover:bg-[hsl(var(--brand-logo-green)/0.1)]"
          >
            <a href={verifyUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              {t("viewOnSolscan")}
            </a>
          </Button>
        )}
        <Button
          variant="outline"
          className="border-[hsl(var(--brand-logo-green)/0.4)] hover:bg-[hsl(var(--brand-logo-green)/0.1)]"
        >
          <Twitter className="mr-2 h-4 w-4" />
          {t("shareOnX")}
        </Button>
        <Button
          variant="outline"
          className="border-[hsl(var(--brand-logo-green)/0.4)] hover:bg-[hsl(var(--brand-logo-green)/0.1)]"
        >
          <Share2 className="mr-2 h-4 w-4" />
          {t("share")}
        </Button>
        <Button className="gradient-solana text-white shadow-md hover:opacity-90">
          <Download className="mr-2 h-4 w-4" />
          {t("download")}
        </Button>
      </div>
    </div>
  );
}
