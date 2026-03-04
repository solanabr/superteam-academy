"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useI18n } from "@/components/providers/I18nProvider";
import { getOnChainReadService } from "@/lib/services/onchain-read";
import Link from "next/link";
import { use } from "react";
import type { Credential } from "@/lib/types/learning";

export default function CertificateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user, profile } = useAuth();
  const { t } = useI18n();
  const [credential, setCredential] = useState<Credential | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const certRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchCredential() {
      setLoading(true);
      setError(null);

      const onChainService = getOnChainReadService();

      try {
        const cred = await onChainService.getCredentialByMint(id);

        if (cred) {
          setCredential(cred);
        } else {
          setCredential({
            mintAddress: id,
            trackName: "Course Credential",
            level: 1,
            imageUrl: "",
            metadata: {},
            verifyUrl: `https://explorer.solana.com/address/${id}?cluster=devnet`,
          });
          setError("Certificate data not found on-chain. Showing placeholder.");
        }
      } catch (err) {
        console.error("Error fetching credential:", err);
        setError("Failed to verify certificate on-chain.");
        setCredential({
          mintAddress: id,
          trackName: "Course Credential",
          level: 1,
          imageUrl: "",
          metadata: {},
          verifyUrl: `https://explorer.solana.com/address/${id}?cluster=devnet`,
        });
      } finally {
        setLoading(false);
      }
    }

    fetchCredential();
  }, [id]);

  const displayName =
    profile?.display_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Learner";

  const handleDownload = useCallback(async () => {
    if (!certRef.current) return;
    setDownloading(true);

    try {
      // Use html2canvas-like approach via canvas API
      const el = certRef.current;
      const canvas = document.createElement("canvas");
      const scale = 2;
      canvas.width = el.offsetWidth * scale;
      canvas.height = el.offsetHeight * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Draw a simplified certificate to canvas
      ctx.scale(scale, scale);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, el.offsetWidth, el.offsetHeight);

      // Gradient background
      const grad = ctx.createLinearGradient(0, 0, el.offsetWidth, el.offsetHeight);
      grad.addColorStop(0, "#ffffff");
      grad.addColorStop(0.5, "#fafafa");
      grad.addColorStop(1, "#eef2ff");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, el.offsetWidth, el.offsetHeight);

      // Border
      ctx.strokeStyle = "#e5e5e5";
      ctx.lineWidth = 2;
      ctx.strokeRect(10, 10, el.offsetWidth - 20, el.offsetHeight - 20);

      // Title
      ctx.fillStyle = "#171717";
      ctx.font = "bold 24px system-ui";
      ctx.textAlign = "center";
      ctx.fillText("Caminho.", el.offsetWidth / 2, 60);

      ctx.font = "12px system-ui";
      ctx.fillStyle = "#a3a3a3";
      ctx.fillText("CERTIFICATE OF COMPLETION", el.offsetWidth / 2, 90);

      // Line
      ctx.strokeStyle = "#d4d4d4";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(el.offsetWidth / 2 - 40, 100);
      ctx.lineTo(el.offsetWidth / 2 + 40, 100);
      ctx.stroke();

      // Name
      ctx.fillStyle = "#525252";
      ctx.font = "14px system-ui";
      ctx.fillText("This certifies that", el.offsetWidth / 2, 130);

      ctx.fillStyle = "#171717";
      ctx.font = "bold 28px system-ui";
      ctx.fillText(displayName, el.offsetWidth / 2, 165);

      // Course
      ctx.fillStyle = "#525252";
      ctx.font = "14px system-ui";
      ctx.fillText("has successfully completed", el.offsetWidth / 2, 200);

      ctx.fillStyle = "#171717";
      ctx.font = "bold 20px system-ui";
      ctx.fillText(credential?.trackName || "Course", el.offsetWidth / 2, 230);

      ctx.fillStyle = "#737373";
      ctx.font = "14px system-ui";
      ctx.fillText(`Level ${credential?.level || 1}`, el.offsetWidth / 2, 255);

      // Date
      ctx.fillStyle = "#a3a3a3";
      ctx.font = "12px system-ui";
      ctx.fillText(
        new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
        el.offsetWidth / 2,
        290
      );

      // Download
      const link = document.createElement("a");
      link.download = `caminho-certificate-${credential?.trackName?.replace(/\s+/g, "-").toLowerCase() || "course"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("Error downloading certificate:", err);
    } finally {
      setDownloading(false);
    }
  }, [credential, displayName]);

  const handleShare = useCallback(() => {
    const url = window.location.href;
    const text = `I just earned a certificate for "${credential?.trackName}" on Caminho Academy! 🎓`;

    // Try native share first
    if (navigator.share) {
      navigator.share({ title: "Caminho Certificate", text, url }).catch(() => {});
      return;
    }

    // Fallback: copy to clipboard
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [credential]);

  const handleShareTwitter = useCallback(() => {
    const url = window.location.href;
    const text = `I just earned a certificate for "${credential?.trackName}" on @CaminhoAcademy! 🎓🚀`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      "_blank"
    );
  }, [credential]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-neutral-300 dark:border-neutral-600 border-t-neutral-900 dark:border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!credential) {
    return (
      <div className="max-w-3xl mx-auto min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-500 dark:text-neutral-400">Certificate not found</p>
          <Link
            href="/certificates"
            className="mt-4 inline-block px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-full text-sm font-semibold"
          >
            Back to Certificates
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
      {/* Back Link */}
      <Link
        href="/certificates"
        className="inline-flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
        Back to Certificates
      </Link>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-2xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20">
          <p className="text-sm text-amber-800 dark:text-amber-200">{error}</p>
        </div>
      )}

      {/* Certificate Visual */}
      <div className="relative" ref={certRef}>
        <div className="p-10 md:p-16 rounded-3xl border-2 border-neutral-200 dark:border-neutral-700 bg-gradient-to-br from-white via-neutral-50 to-[#a5b4fc]/10 dark:from-neutral-900 dark:via-neutral-900 dark:to-indigo-950/20 overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]">
            <div className="w-full h-full" style={{
              backgroundImage: "repeating-linear-gradient(45deg, currentColor 0, currentColor 1px, transparent 0, transparent 50%)",
              backgroundSize: "20px 20px",
            }} />
          </div>

          <div className="relative text-center space-y-6">
            {/* Logo */}
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl font-semibold tracking-tight">Caminho.</span>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.3em] text-neutral-400 font-semibold">
                {t("certificate.title")}
              </p>
              <div className="w-16 h-[1px] bg-neutral-300 dark:bg-neutral-600 mx-auto" />
            </div>

            {/* Recipient */}
            <div className="space-y-1">
              <p className="text-sm text-neutral-500 dark:text-neutral-400">This certifies that</p>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">{displayName}</h2>
            </div>

            {/* Course */}
            <div className="space-y-1">
              <p className="text-sm text-neutral-500 dark:text-neutral-400">has successfully completed</p>
              <h3 className="text-xl font-semibold">{credential.trackName}</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">Level {credential.level}</p>
            </div>

            {/* Date */}
            <p className="text-sm text-neutral-400">
              {t("certificate.completedOn", {
                date: new Date().toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                }),
              })}
            </p>

            {/* On-chain badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Verified On-Chain</span>
            </div>
          </div>
        </div>
      </div>

      {/* On-chain Details */}
      <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-4">
        <h3 className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">On-Chain Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-neutral-400 mb-1">{t("certificate.mintAddress")}</p>
            <p className="text-sm font-mono text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800 px-3 py-2 rounded-lg truncate">
              {credential.mintAddress}
            </p>
          </div>
          <div>
            <p className="text-xs text-neutral-400 mb-1">Network</p>
            <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800 px-3 py-2 rounded-lg">
              Solana Devnet
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <a
          href={credential.verifyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-5 py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-full text-xs font-semibold hover:bg-neutral-700 dark:hover:bg-neutral-200 transition-all inline-flex items-center gap-2"
        >
          {t("certificate.verifyOnChain")}
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="px-5 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-full text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:border-neutral-400 dark:hover:border-neutral-500 transition-colors inline-flex items-center gap-2 disabled:opacity-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
          {downloading ? "Downloading..." : t("certificate.download")}
        </button>
        <button
          onClick={handleShare}
          className="px-5 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-full text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:border-neutral-400 dark:hover:border-neutral-500 transition-colors inline-flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" x2="12" y1="2" y2="15"/></svg>
          {copied ? "Link copied!" : t("certificate.share")}
        </button>
        <button
          onClick={handleShareTwitter}
          className="px-5 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-full text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:border-neutral-400 dark:hover:border-neutral-500 transition-colors inline-flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
          Share on X
        </button>
      </div>
    </div>
  );
}
