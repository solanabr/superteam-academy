"use client";

import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";

const STATS = [
  { label: "Active Courses", value: "5" },
  { label: "Total Learners", value: "169" },
  { label: "XP Distributed", value: "284K" },
  { label: "Credentials Issued", value: "93" },
];

const FEATURES = [
  {
    icon: "🏆",
    title: "Soulbound XP",
    description: "Earn non-transferable XP tokens (Token-2022) as you complete lessons. Your progress is permanently recorded on Solana.",
  },
  {
    icon: "📜",
    title: "Verifiable Credentials",
    description: "Receive Metaplex Core NFT credentials that upgrade as you advance through tracks. Visible in any Solana wallet.",
  },
  {
    icon: "⛓️",
    title: "Fully On-Chain",
    description: "Enrollment, progress tracking, and credential issuance are all managed by a Solana program. No centralized databases.",
  },
  {
    icon: "🏅",
    title: "Achievement System",
    description: "Unlock achievements for milestones and special accomplishments. Each achievement is a unique NFT with XP rewards.",
  },
  {
    icon: "📊",
    title: "Global Leaderboard",
    description: "Compete with developers worldwide. Rankings are derived from on-chain XP token balances via the Helius DAS API.",
  },
  {
    icon: "💻",
    title: "Interactive Learning",
    description: "Built-in code editor for hands-on exercises. Write and test Solana programs directly in your browser.",
  },
];

const TRACKS = [
  { name: "Anchor Development", courses: 2, color: "from-purple-500 to-blue-500", emoji: "⚓" },
  { name: "DeFi Protocols", courses: 1, color: "from-green-500 to-teal-500", emoji: "💰" },
  { name: "NFT & Metaplex", courses: 1, color: "from-pink-500 to-rose-500", emoji: "🎨" },
  { name: "Client Development", courses: 1, color: "from-orange-500 to-amber-500", emoji: "🖥️" },
  { name: "Security & Auditing", courses: 1, color: "from-red-500 to-pink-500", emoji: "🔒" },
];

export default function HomePage() {
  const { connected } = useWallet();
  const { setVisible } = useWalletModal();

  return (
    <div className="relative">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#9945FF]/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-[#14F195]/8 rounded-full blur-[120px]" />
      </div>

      {/* Hero */}
      <section className="relative pt-20 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#9945FF]/10 border border-[#9945FF]/20 mb-8">
            <div className="w-2 h-2 rounded-full bg-[#14F195] animate-pulse" />
            <span className="text-sm text-[#14F195] font-medium">Live on Devnet</span>
          </div>
          
          <h1 className="text-5xl sm:text-7xl font-bold tracking-tight mb-6">
            Learn Solana.{" "}
            <span className="gradient-text">Earn XP.</span>
            <br />
            Collect <span className="gradient-text">Credentials.</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-white/50 max-w-2xl mx-auto mb-10">
            The decentralized learning platform where your progress lives on-chain.
            Master Solana development and build a verifiable portfolio of skills.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {connected ? (
              <Link
                href="/courses"
                className="px-8 py-3 rounded-xl font-semibold text-base
                  bg-gradient-to-r from-[#9945FF] to-[#14F195] text-white
                  hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-200
                  active:scale-95"
              >
                Browse Courses →
              </Link>
            ) : (
              <button
                onClick={() => setVisible(true)}
                className="px-8 py-3 rounded-xl font-semibold text-base
                  bg-gradient-to-r from-[#9945FF] to-[#14F195] text-white
                  hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-200
                  active:scale-95"
              >
                Connect Wallet to Start
              </button>
            )}
            <Link
              href="/leaderboard"
              className="px-8 py-3 rounded-xl font-semibold text-base
                bg-white/5 border border-white/10 text-white/80
                hover:bg-white/10 transition-all duration-200"
            >
              View Leaderboard
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative py-16 px-4 sm:px-6 lg:px-8 border-y border-white/5 bg-white/[0.02]">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold gradient-text mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-white/40">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Learning Tracks */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Learning Tracks</h2>
            <p className="text-white/50 max-w-lg mx-auto">
              Follow structured tracks to build expertise. Each track has a soulbound credential NFT that upgrades as you progress.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {TRACKS.map((track) => (
              <Link
                key={track.name}
                href="/courses"
                className="glass-card p-6 group cursor-pointer transition-all duration-300 hover:scale-[1.02]"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${track.color} flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform`}>
                  {track.emoji}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{track.name}</h3>
                <p className="text-sm text-white/40">{track.courses} course{track.courses > 1 ? "s" : ""} available</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8 bg-white/[0.01]">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Why Superteam Academy?</h2>
            <p className="text-white/50 max-w-lg mx-auto">
              Everything is on-chain. Your credentials are yours forever.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="glass-card p-6 transition-all duration-300"
              >
                <div className="text-3xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="glass-card p-12 glow-purple">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Ready to <span className="gradient-text">Level Up</span>?
            </h2>
            <p className="text-white/50 mb-8 max-w-md mx-auto">
              Connect your Solana wallet, enroll in a course, and start earning XP today.
            </p>
            <button
              onClick={() => connected ? undefined : setVisible(true)}
              className="px-8 py-3 rounded-xl font-semibold text-base
                bg-gradient-to-r from-[#9945FF] to-[#14F195] text-white
                hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-200
                active:scale-95"
            >
              {connected ? (
                <Link href="/courses">Start Learning →</Link>
              ) : (
                "Connect Wallet"
              )}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
