"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { HELIUS_URL } from "@/lib/constants";
import { truncateWallet } from "@/lib/format";
import { CardSkeleton } from "@/components/ui/skeleton";
import { motion } from "motion/react";
import { useCallback } from "react";

interface DASAsset {
  id: string;
  content?: {
    metadata?: {
      name?: string;
      symbol?: string;
      attributes?: Array<{ trait_type: string; value: string }>;
    };
  };
  ownership?: { owner?: string };
  creators?: Array<{ address: string }>;
}

function useCredential(assetId: string) {
  return useQuery({
    queryKey: ["credential", assetId],
    queryFn: async (): Promise<DASAsset | null> => {
      const res = await fetch(HELIUS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: "cert",
          method: "getAsset",
          params: { id: assetId },
        }),
      });
      const data = await res.json();
      return data.result ?? null;
    },
    enabled: !!assetId,
  });
}

export default function CertificatePage() {
  const params = useParams();
  const assetId = params.assetId as string;
  const t = useTranslations("certificate");
  const { data: credential, isLoading } = useCredential(assetId);

  const handleShare = useCallback(() => {
    if (navigator.share) {
      navigator.share({
        title: credential?.content?.metadata?.name ?? "Superteam Certificate",
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  }, [credential]);

  const handleDownload = useCallback(async () => {
    const el = document.getElementById("certificate-card");
    if (!el) return;
    const { toPng } = await import("html-to-image");
    const dataUrl = await toPng(el, { quality: 0.95 });
    const link = document.createElement("a");
    link.download = `certificate-${assetId.slice(0, 8)}.png`;
    link.href = dataUrl;
    link.click();
  }, [assetId]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <CardSkeleton />
      </div>
    );
  }

  if (!credential) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 text-center text-content-muted">
        Certificate not found
      </div>
    );
  }

  const attrs = credential.content?.metadata?.attributes ?? [];
  const name = credential.content?.metadata?.name ?? "Certificate";
  const owner = credential.ownership?.owner;
  const trackId = attrs.find((a) => a.trait_type === "track_id")?.value;
  const level = attrs.find((a) => a.trait_type === "level")?.value;
  const totalXp = attrs.find((a) => a.trait_type === "total_xp")?.value;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <motion.div
        id="certificate-card"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl border border-edge bg-surface p-px"
      >
        <div className="absolute inset-0 rounded-3xl bg-[conic-gradient(from_0deg,#9945FF,#14F195,#00C2FF,#9945FF)] opacity-20" />

        <div className="relative rounded-3xl bg-surface p-8 sm:p-12">
          <div className="mb-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-solana-purple">
              {t("soulbound")}
            </p>
            <h1 className="mt-3 text-2xl font-black text-content sm:text-3xl">{name}</h1>
            <p className="mt-2 text-sm text-solana-green">{t("verifiedOn")}</p>
          </div>

          <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {owner && (
              <div className="rounded-xl bg-card p-4">
                <p className="text-[10px] uppercase tracking-wider text-content-muted">{t("holder")}</p>
                <p className="mt-1 font-mono text-sm font-bold text-content-secondary">
                  {truncateWallet(owner, 6)}
                </p>
              </div>
            )}
            {trackId && (
              <div className="rounded-xl bg-card p-4">
                <p className="text-[10px] uppercase tracking-wider text-content-muted">{t("track")}</p>
                <p className="mt-1 font-mono text-sm font-bold text-content-secondary">{trackId}</p>
              </div>
            )}
            {level && (
              <div className="rounded-xl bg-card p-4">
                <p className="text-[10px] uppercase tracking-wider text-content-muted">Level</p>
                <p className="mt-1 font-mono text-sm font-bold text-content-secondary">{level}</p>
              </div>
            )}
            {totalXp && (
              <div className="rounded-xl bg-card p-4">
                <p className="text-[10px] uppercase tracking-wider text-content-muted">XP</p>
                <p className="mt-1 font-mono text-sm font-bold text-solana-green">{totalXp}</p>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleShare}
              className="flex-1 rounded-xl border border-edge py-3 text-sm font-semibold text-content-secondary transition-colors hover:text-content"
            >
              {t("share")}
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 rounded-xl bg-solana-gradient py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
            >
              {t("download")}
            </button>
          </div>

          <a
            href={`https://solscan.io/token/${assetId}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 block text-center text-xs text-solana-cyan hover:underline"
          >
            {t("viewOnExplorer")}
          </a>
        </div>
      </motion.div>
    </div>
  );
}
