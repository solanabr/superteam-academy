"use client";

import { useTranslations } from "next-intl";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useXpBalance } from "@/hooks/useXpBalance";
import { useStreak } from "@/hooks/useStreak";
import { useCredentials } from "@/hooks/useCredentials";
import { XPBar } from "@/components/gamification/XPBar";
import { StreakWidget } from "@/components/gamification/StreakWidget";
import { CredentialCard } from "@/components/solana/CredentialCard";
import { Link } from "@/i18n/navigation";
import { BookOpen, Award, Zap } from "lucide-react";

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const { publicKey, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const { data: xpData, loading: xpLoading } = useXpBalance();
  const { streak } = useStreak();
  const { credentials, loading: credsLoading } = useCredentials();

  if (!connected) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4">
        <span className="text-5xl">◎</span>
        <h2 className="font-mono text-xl font-bold text-[#EDEDED]">Connect your wallet</h2>
        <p className="text-sm text-[#666666] text-center max-w-sm">
          Connect your Solana wallet to view your dashboard, XP balance, and learning progress.
        </p>
        <button
          onClick={() => setVisible(true)}
          className="mt-2 bg-[#14F195] text-black font-mono font-semibold px-6 py-2.5 rounded hover:bg-[#0D9E61] transition-colors"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h1 className="font-mono text-3xl font-bold text-[#EDEDED]">{t("title")}</h1>
        {publicKey && (
          <p className="text-xs text-[#666666] font-mono mt-1">
            {publicKey.toBase58().slice(0, 20)}...
          </p>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {/* XP Card */}
        <div className="bg-[#111111] border border-[#1F1F1F] rounded p-5">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-4 w-4 text-[#14F195]" />
            <span className="text-xs font-mono text-[#666666] uppercase tracking-wider">XP Balance</span>
          </div>
          {xpLoading ? (
            <div className="h-8 bg-[#1A1A1A] rounded animate-pulse mb-3" />
          ) : xpData ? (
            <>
              <div className="font-mono text-3xl font-bold text-[#EDEDED] mb-1">
                {xpData.balance.toLocaleString()}
                <span className="text-sm text-[#666666] ml-1">XP</span>
              </div>
              <XPBar xpData={xpData} showLabel={true} />
            </>
          ) : (
            <div className="font-mono text-3xl font-bold text-[#EDEDED]">0 XP</div>
          )}
        </div>

        {/* Streak Card */}
        <div className="bg-[#111111] border border-[#1F1F1F] rounded p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm">🔥</span>
            <span className="text-xs font-mono text-[#666666] uppercase tracking-wider">Streak</span>
          </div>
          <StreakWidget streak={streak} />
          <p className="text-[10px] text-[#666666] font-mono mt-2">
            Longest: {streak.longestStreak} days
          </p>
        </div>

        {/* Credentials Card */}
        <div className="bg-[#111111] border border-[#1F1F1F] rounded p-5">
          <div className="flex items-center gap-2 mb-3">
            <Award className="h-4 w-4 text-[#9945FF]" />
            <span className="text-xs font-mono text-[#666666] uppercase tracking-wider">Credentials</span>
          </div>
          {credsLoading ? (
            <div className="h-8 bg-[#1A1A1A] rounded animate-pulse" />
          ) : (
            <div className="font-mono text-3xl font-bold text-[#EDEDED]">
              {credentials.length}
              <span className="text-sm text-[#666666] ml-1">NFTs</span>
            </div>
          )}
          <p className="text-[10px] text-[#666666] font-mono mt-2">
            Soulbound on Solana
          </p>
        </div>
      </div>

      {/* Continue Learning */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-mono text-lg font-semibold text-[#EDEDED]">
            {t("continueLearning")}
          </h2>
          <Link href="/courses" className="text-xs text-[#666666] hover:text-[#EDEDED] font-mono transition-colors">
            Browse all →
          </Link>
        </div>
        <div className="bg-[#111111] border border-[#1F1F1F] rounded p-6 text-center">
          <BookOpen className="h-8 w-8 text-[#333333] mx-auto mb-3" />
          <p className="text-sm text-[#666666] font-mono mb-4">
            {t("noActivity")}
          </p>
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 bg-[#14F195] text-black font-mono font-semibold text-sm px-5 py-2 rounded hover:bg-[#0D9E61] transition-colors"
          >
            Browse Courses
          </Link>
        </div>
      </div>

      {/* Credentials grid */}
      {credentials.length > 0 && (
        <div>
          <h2 className="font-mono text-lg font-semibold text-[#EDEDED] mb-4">
            {t("credentials")}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {credentials.map((cred) => (
              <CredentialCard key={cred.id} credential={cred} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
