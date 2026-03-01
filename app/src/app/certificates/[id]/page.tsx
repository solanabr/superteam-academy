"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { MeshGradient } from "@/components/MeshGradient";
import {
  ArrowLeft, Shield, Check, Share2, Download,
  ExternalLink, Zap, Calendar, Trophy
} from "lucide-react";
import { useI18n } from "@/components/I18nProvider";

const CERTIFICATES: Record<string, {
  id: string;
  titleKey: string;
  descKey: string;
  trackKey: string;
  level: number;
  earnedAt: string;
  xp: number;
  mintAddress: string;
}> = {
  "dev-fundamentals": {
    id: "dev-fundamentals",
    titleKey: "courses.anchor-fundamentals.title",
    descKey: "courses.anchor-fundamentals.desc",
    trackKey: "courses.track.development",
    level: 3,
    earnedAt: "2026-01-15",
    xp: 1200,
    mintAddress: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
  },
  "anchor-fundamentals": {
    id: "anchor-fundamentals",
    titleKey: "courses.anchor-fundamentals.title",
    descKey: "courses.anchor-fundamentals.desc",
    trackKey: "courses.track.development",
    level: 1,
    earnedAt: "2026-01-15",
    xp: 1200,
    mintAddress: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
  },
};

export default function CertificatePage() {
  const params = useParams();
  const { t } = useI18n();
  const { connected } = useWallet();

  const certificate = CERTIFICATES[params.id as string];

  if (!certificate) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4">{t("certificate.notFound")}</h1>
          <Link href="/profile" className="text-white/60 hover:text-white">
            {t("certificate.backToProfile")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white relative">
      <MeshGradient />

      <main className="pt-14 relative z-10">
        <div className="max-w-3xl mx-auto px-6 py-12">
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("certificate.backToProfile")}
          </Link>

          {/* Certificate Card */}
          <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 border border-white/20 rounded-2xl p-8 mb-8">
            <div className="text-center mb-8">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-6">
                <Shield className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-semibold mb-2">{t(certificate.titleKey)}</h1>
              <p className="text-white/60">{t(certificate.descKey)}</p>
            </div>

            <div className="flex justify-center flex-wrap gap-8 mb-8">
              <div className="text-center">
                <div className="text-2xl font-semibold mb-1">{t("certificate.level", { level: certificate.level })}</div>
                <div className="text-white/40 text-sm">{t("certificate.levelLabel")}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold mb-1">{certificate.xp}</div>
                <div className="text-white/40 text-sm">{t("certificate.xpEarned")}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold mb-1">{certificate.earnedAt}</div>
                <div className="text-white/40 text-sm">{t("certificate.dateEarned")}</div>
              </div>
            </div>

            <div className="border-t border-white/10 pt-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/40">{t("certificate.mintAddress")}</span>
                <span className="font-mono text-xs">{certificate.mintAddress.slice(0, 8)}...{certificate.mintAddress.slice(-8)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-4 justify-center">
            <button className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-xl font-bold hover:bg-white/90 transition-colors">
              <Share2 className="w-4 h-4" />
              {t("certificate.share")}
            </button>
            <button className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-xl font-bold hover:bg-white/10 transition-colors">
              <Download className="w-4 h-4" />
              {t("certificate.download")}
            </button>
            <a
              href={`https://explorer.solana.com/address/${certificate.mintAddress}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-xl font-bold hover:bg-white/10 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              {t("certificate.verifyOnChain")}
            </a>
          </div>

          {/* Verification */}
          <div className="mt-12 bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
            <h2 className="text-xl font-bold mb-4">{t("certificate.verificationTitle")}</h2>
            <p className="text-white/60 mb-6 leading-relaxed">
              {t("certificate.verificationDesc")}
            </p>
            <div className="bg-black/50 rounded-xl p-4 font-mono text-sm break-all border border-white/5 mb-6 text-white/80">
              {certificate.mintAddress}
            </div>
            <div className="flex items-center gap-3 text-green-400 font-medium">
              <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                <Check className="w-4 h-4" />
              </div>
              {t("certificate.verifiedOnSolana")}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
