"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { getXpBalance } from "@/lib/services/xp-service";
import { fetchCredentials } from "@/lib/services/credential-service";
import { getStreakData, StreakData } from "@/lib/services/streak-service";
import { CredentialNFT, TRACK_NAMES } from "@/types/academy";
import Link from "next/link";

export default function ProfilePage() {
  const { connected, publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const [xpBalance, setXpBalance] = useState(0);
  const [credentials, setCredentials] = useState<CredentialNFT[]>([]);
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (publicKey) {
      Promise.all([
        getXpBalance(publicKey).catch(() => 0),
        fetchCredentials(publicKey.toBase58()).catch(() => []),
      ]).then(([xp, creds]) => {
        setXpBalance(xp);
        setCredentials(creds);
        setStreak(getStreakData());
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [publicKey]);

  if (!connected || !publicKey) {
    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-24 text-center">
        <div className="glass-card p-12 max-w-md mx-auto">
          <div className="text-5xl mb-4">👤</div>
          <h1 className="text-2xl font-bold mb-3">Connect Your Wallet</h1>
          <p className="text-white/50 mb-6">
            Connect your Solana wallet to view your profile, XP balance, and credentials.
          </p>
          <button
            onClick={() => setVisible(true)}
            className="px-8 py-3 rounded-xl font-semibold text-sm
              bg-gradient-to-r from-[#9945FF] to-[#14F195] text-white
              hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-200"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  const shortAddr = `${publicKey.toBase58().slice(0, 6)}...${publicKey.toBase58().slice(-4)}`;
  const dayLabels = ["M", "T", "W", "T", "F", "S", "S"];

  return (
    <div className="relative min-h-screen">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-[#9945FF]/8 rounded-full blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Profile Header */}
        <div className="glass-card p-8 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#9945FF] to-[#14F195] flex items-center justify-center text-3xl font-bold">
              {publicKey.toBase58().slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-1">{shortAddr}</h1>
              <p className="text-sm text-white/40 font-mono">{publicKey.toBase58()}</p>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-[#14F195]" />
                  <span className="text-sm text-white/60">Devnet</span>
                </div>
                <a
                  href={`https://explorer.solana.com/address/${publicKey.toBase58()}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[#9945FF] hover:underline"
                >
                  View on Explorer ↗
                </a>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-[#14F195]">{xpBalance.toLocaleString()}</div>
              <div className="text-sm text-white/40">Total XP</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Streak Widget */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold mb-4">Learning Streak</h2>
            <div className="flex items-center gap-8 mb-6">
              <div>
                <div className="text-3xl font-bold text-[#14F195]">{streak?.currentStreak || 0}</div>
                <div className="text-xs text-white/40">Current Streak</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white/60">{streak?.longestStreak || 0}</div>
                <div className="text-xs text-white/40">Best Streak</div>
              </div>
            </div>
            <div className="flex gap-2">
              {dayLabels.map((day, i) => (
                <div key={i} className="flex-1 text-center">
                  <div className={`w-full aspect-square rounded-lg mb-1 ${
                    streak?.weeklyActivity[i]
                      ? "bg-[#14F195]/30 border border-[#14F195]/40"
                      : "bg-white/5 border border-white/5"
                  }`} />
                  <span className="text-[10px] text-white/30">{day}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-white/30 mt-3 italic">
              Streak tracking is frontend-only in this demo. Production would use backend storage.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold mb-4">Stats</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-white/[0.03]">
                <div className="text-2xl font-bold">{xpBalance > 0 ? "1" : "0"}</div>
                <div className="text-xs text-white/40 mt-1">Courses Enrolled</div>
              </div>
              <div className="p-4 rounded-lg bg-white/[0.03]">
                <div className="text-2xl font-bold">0</div>
                <div className="text-xs text-white/40 mt-1">Completed</div>
              </div>
              <div className="p-4 rounded-lg bg-white/[0.03]">
                <div className="text-2xl font-bold">{credentials.length}</div>
                <div className="text-xs text-white/40 mt-1">Credentials</div>
              </div>
              <div className="p-4 rounded-lg bg-white/[0.03]">
                <div className="text-2xl font-bold">0</div>
                <div className="text-xs text-white/40 mt-1">Achievements</div>
              </div>
            </div>
          </div>
        </div>

        {/* Credentials */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Credentials</h2>
          {credentials.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <div className="text-4xl mb-3">📜</div>
              <p className="text-white/50 mb-2">No credentials yet</p>
              <p className="text-sm text-white/30 mb-4">
                Complete courses to earn soulbound credential NFTs for each track.
              </p>
              <Link
                href="/courses"
                className="inline-block px-6 py-2 rounded-lg text-sm font-medium
                  bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 transition-colors"
              >
                Browse Courses
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {credentials.map((cred) => (
                <div key={cred.address} className="glass-card p-6 glow-purple">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#9945FF] to-[#14F195] flex items-center justify-center text-lg">
                      🏅
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold">{cred.name}</h3>
                      <p className="text-xs text-white/40">{TRACK_NAMES[cred.trackId]}</p>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-white/40 mt-2">
                    <span>{cred.coursesCompleted} courses</span>
                    <span className="text-[#14F195]">{cred.totalXp.toLocaleString()} XP</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
