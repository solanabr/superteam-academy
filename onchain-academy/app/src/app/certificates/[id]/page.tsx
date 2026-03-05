"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  ExternalLink,
  ShieldCheck,
  Share2,
  Award,
  Download,
  CheckCircle2,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { learningProgressService } from "@/services/learning-progress-service";
import { findMockCredential } from "@/data/mock-credentials";
import type { Credential } from "@/types/domain";
import { useLocale } from "@/providers/locale-provider";

export default function CertificatePage(): React.JSX.Element {
  const { t } = useLocale();
  const params = useParams<{ id: string }>();
  const { publicKey } = useWallet();
  const [credential, setCredential] = useState<Credential | null>(null);
  const [copied, setCopied] = useState(false);
  const certificateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!params.id) {
      setCredential(findMockCredential("") ?? null);
      return;
    }

    if (!publicKey) {
      setCredential(findMockCredential(params.id) ?? null);
      return;
    }

    void learningProgressService
      .getCredentials(publicKey.toBase58())
      .then((rows) => {
        const match =
          rows.find(
            (row) =>
              row.credentialId === params.id || row.mintAddress === params.id,
          ) ??
          findMockCredential(params.id) ??
          null;
        setCredential(match);
      })
      .catch(() => setCredential(findMockCredential(params.id) ?? null));
  }, [publicKey, params.id]);

  const trackName = credential?.title ?? params.id;
  const level = credential
    ? `${t("certificatePage.level")} ${credential.level}`
    : `${t("certificatePage.level")} 1`;
  const mintAddress = credential?.mintAddress ?? params.id;
  const dateStr = useMemo(
    () =>
      new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    [],
  );
  const explorerUrl =
    credential?.explorerUrl ??
    `https://explorer.solana.com/address/${mintAddress}?cluster=devnet`;

  function handleShare(): void {
    if (typeof window === "undefined") return;
    const url = window.location.href;
    const shareTitle = `${trackName} — Superteam Academy`;
    if (navigator.share) {
      void navigator.share({ title: shareTitle, url }).catch(() => {});
    } else {
      void navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }

  async function handleDownload(): Promise<void> {
    if (typeof window === "undefined" || !certificateRef.current) return;
    const node = certificateRef.current;

    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(node, {
        cacheBust: true,
        backgroundColor: "#0f1219",
        pixelRatio: 2,
      });
      const link = document.createElement("a");
      const safeTrack = trackName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      link.download = `superteam-certificate-${safeTrack || "track"}.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      // Keep a print fallback if image generation fails on older browsers.
      const prev = document.title;
      document.title = `${trackName} — Superteam Academy Credential`;
      window.print();
      document.title = prev;
    }
  }

  return (
    <>
      <style>{`
        @media print {
          body > * { display: none !important; }
          #certificate-print-target { display: flex !important; }
          #certificate-print-target * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <div className="max-w-4xl mx-auto space-y-10 animate-fade-in pb-20 pt-8 text-center sm:text-left">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <Link
              href="/profile"
              className="text-muted-foreground hover:text-foreground text-sm font-medium mb-4 inline-block transition-colors"
            >
              ← {t("certificatePage.backToProfile")}
            </Link>
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              {t("certificatePage.credential")}{" "}
              <span className="text-muted-foreground">
                #{params.id.slice(0, 8)}
              </span>
            </h1>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="bg-background/50 backdrop-blur"
              onClick={handleShare}
            >
              {copied ? (
                <Check className="h-4 w-4 mr-2 text-primary" />
              ) : (
                <Share2 className="h-4 w-4 mr-2" />
              )}
              {copied
                ? t("certificatePage.urlCopied")
                : t("certificatePage.share")}
            </Button>
            <Button
              variant="secondary"
              className="bg-secondary/10 text-secondary hover:bg-secondary/20"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4 mr-2" />{" "}
              {t("certificatePage.download")}
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-8">
          <div
            id="certificate-print-target"
            ref={certificateRef}
            className="relative w-full min-h-[420px] rounded-3xl border-2 border-primary/20 bg-[#0f1219] shadow-2xl flex flex-col items-center justify-between p-8 sm:p-14 text-center group overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-secondary/10 pointer-events-none" />
            <div className="relative z-10 w-full flex flex-col items-center flex-1">
              <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-background/50 backdrop-blur-md border border-border/50 flex items-center justify-center mb-5 shadow-2xl">
                <ShieldCheck className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
              </div>

              <span className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3">
                {t("certificatePage.completionTitle")}
              </span>
              <h2 className="font-display text-3xl sm:text-5xl font-black text-foreground mb-4 leading-tight">
                {trackName}
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground/80 max-w-lg mb-8">
                {t("certificatePage.certifies")}{" "}
                <strong className="text-foreground">
                  {publicKey
                    ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`
                    : t("certificatePage.walletHolder")}
                </strong>{" "}
                {t("certificatePage.completedTrack")}
              </p>

              <div className="w-full flex justify-between items-end border-t border-border/30 pt-6 px-4 sm:px-8 mt-auto">
                <div className="text-left space-y-1">
                  <span className="text-xs text-muted-foreground uppercase tracking-widest block">
                    {t("certificatePage.dateIssued")}
                  </span>
                  <span className="font-mono text-sm font-semibold">
                    {dateStr}
                  </span>
                </div>
                <div className="text-right space-y-1">
                  <span className="text-xs text-muted-foreground uppercase tracking-widest block">
                    {t("certificatePage.credentialId")}
                  </span>
                  <span className="font-mono text-sm font-semibold tracking-wider">
                    {params.id.slice(0, 8)}...
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <Card className="bg-background/40 backdrop-blur-md border-border/50 shadow-lg">
              <div className="p-6 border-b border-border/30">
                <h3 className="font-display text-lg font-semibold flex items-center gap-2">
                  <Award className="h-5 w-5 text-secondary" />{" "}
                  {t("certificatePage.credentialDetails")}
                </h3>
              </div>
              <div className="p-6 space-y-6">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground uppercase tracking-widest">
                    {t("certificatePage.track")}
                  </span>
                  <p className="font-semibold">
                    {credential?.track ?? t("certificatePage.unknown")}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground uppercase tracking-widest">
                    {t("certificatePage.level")}
                  </span>
                  <p className="font-semibold">{level}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground uppercase tracking-widest">
                    {t("certificatePage.mintAddress")}
                  </span>
                  <p className="font-mono text-xs break-all">{mintAddress}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground uppercase tracking-widest">
                    {t("certificatePage.verification")}
                  </span>
                  <p className="font-semibold flex items-center gap-2">
                    {credential?.verified ? (
                      <Badge
                        variant="outline"
                        className="text-primary border-primary/30"
                      >
                        {t("certificatePage.verified")}
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        {t("certificatePage.unverified")}
                      </Badge>
                    )}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="bg-background/40 backdrop-blur-md border-border/50 shadow-lg overflow-hidden relative">
              <div className="p-6 relative z-10 space-y-4">
                <div className="flex items-center gap-3 text-primary">
                  <CheckCircle2 className="h-5 w-5" />
                  <h3 className="font-display text-lg font-semibold text-foreground">
                    {t("certificatePage.onchainVerification")}
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t("certificatePage.verificationDesc")}
                </p>
                <Button className="w-full font-bold" asChild>
                  <a href={explorerUrl} target="_blank" rel="noreferrer">
                    {t("certificatePage.verifyExplorer")}{" "}
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </a>
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
