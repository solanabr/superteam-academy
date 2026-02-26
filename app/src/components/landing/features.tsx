"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import {
  Code2,
  Trophy,
  Zap,
  Globe,
  Shield,
  BookOpen,
  Users,
  Sparkles,
  Fingerprint,
  Check,
  ArrowUpRight,
} from "lucide-react";

/* ─── Bento Grid — 2025 trend: mixed card sizes ─── */

function CodeMockup() {
  const lines = [
    { code: "use anchor_lang::prelude::*;", color: "#9945FF" },
    { code: "", color: "" },
    { code: "#[program]", color: "#14F195" },
    { code: "pub mod academy {", color: "#e2e8f0" },
    { code: "  use super::*;", color: "#94a3b8" },
    { code: "  pub fn complete_lesson(", color: "#e2e8f0" },
    { code: "    ctx: Context<CompletLesson>,", color: "#94a3b8" },
    { code: "    lesson_idx: u8,", color: "#94a3b8" },
    { code: "  ) -> Result<()> {", color: "#e2e8f0" },
    { code: "    // Award 75 XP on-chain ✨", color: "#14F195" },
    { code: "    ctx.accounts.mint_xp(75)", color: "#00C2FF" },
    { code: "  }", color: "#e2e8f0" },
    { code: "}", color: "#e2e8f0" },
  ];

  return (
    <div className="terminal-card w-full h-full">
      <div className="terminal-header">
        <div className="terminal-dot bg-red-500" />
        <div className="terminal-dot bg-yellow-500" />
        <div className="terminal-dot bg-green-500" />
        <span className="ml-2 text-xs text-white/40">lesson_program.rs</span>
      </div>
      <div className="p-4 space-y-0.5 overflow-hidden">
        {lines.map((line, i) => (
          <motion.p
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 * i, duration: 0.3 }}
            className="text-xs leading-5 font-mono whitespace-pre"
            style={{ color: line.color || "transparent" }}
          >
            <span className="text-white/20 mr-3 select-none text-[10px]">{String(i + 1).padStart(2, " ")}</span>
            {line.code || "\u00A0"}
          </motion.p>
        ))}
      </div>
    </div>
  );
}

function XPMeter() {
  const [hovered, setHovered] = useState(false);
  const xpData = [
    { label: "Mon", xp: 75 },
    { label: "Tue", xp: 150 },
    { label: "Wed", xp: 225 },
    { label: "Thu", xp: 100 },
    { label: "Fri", xp: 275 },
    { label: "Sat", xp: 200 },
    { label: "Sun", xp: 325 },
  ];
  const max = Math.max(...xpData.map((d) => d.xp));

  return (
    <div
      className="w-full h-full flex flex-col"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-white/50 mb-1">XP This Week</p>
          <p className="text-2xl font-bold gradient-text">+1,350 XP</p>
        </div>
        <div className="w-8 h-8 rounded-lg bg-[#14F195]/15 flex items-center justify-center">
          <Zap className="w-4 h-4 text-[#14F195]" />
        </div>
      </div>
      <div className="flex items-end gap-1.5 flex-1">
        {xpData.map((d, i) => (
          <div key={d.label} className="flex flex-col items-center gap-1 flex-1">
            <motion.div
              className="w-full rounded-t-sm relative overflow-hidden"
              initial={{ height: 0 }}
              animate={{ height: `${(d.xp / max) * 100}%` }}
              transition={{ delay: 0.1 * i, duration: 0.6, ease: "easeOut" }}
              style={{
                background: `linear-gradient(to top, #9945FF, #14F195)`,
                opacity: hovered ? 1 : 0.7,
              }}
            >
              <div className="absolute inset-0 shimmer" />
            </motion.div>
            <span className="text-[9px] text-white/30">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CredentialCard() {
  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#9945FF]/20 via-transparent to-[#14F195]/10" />
      {/* NFT Card */}
      <motion.div
        animate={{ y: [0, -6, 0], rotateY: [0, 3, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="relative w-36 glass-card p-4 shadow-glow-purple"
      >
        <div className="w-full h-20 rounded-lg bg-gradient-to-br from-[#9945FF] via-[#14F195]/50 to-[#00C2FF] mb-3 flex items-center justify-center">
          <Trophy className="w-8 h-8 text-white" />
        </div>
        <p className="text-[10px] text-white/50 mb-0.5">Metaplex Core NFT</p>
        <p className="text-xs font-bold text-white">Solana Master</p>
        <div className="flex items-center gap-1 mt-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#14F195] animate-pulse" />
          <span className="text-[9px] text-[#14F195]">Soulbound on Solana</span>
        </div>
      </motion.div>
      {/* Floating verified badge */}
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 3, repeat: Infinity, delay: 1, ease: "easeInOut" }}
        className="absolute top-4 right-4 flex items-center gap-1 bg-[#14F195]/20 border border-[#14F195]/40 rounded-full px-2 py-1"
      >
        <Check className="w-3 h-3 text-[#14F195]" />
        <span className="text-[9px] font-bold text-[#14F195]">Verified</span>
      </motion.div>
    </div>
  );
}

function StreakGrid() {
  const weeks = 13;
  const days = 7;
  return (
    <div className="flex gap-1">
      {Array.from({ length: weeks }).map((_, w) => (
        <div key={w} className="flex flex-col gap-1">
          {Array.from({ length: days }).map((_, d) => {
            const rand = Math.random();
            const intensity = rand > 0.5 ? rand : 0;
            return (
              <motion.div
                key={d}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: (w * days + d) * 0.005 }}
                className="w-2.5 h-2.5 rounded-sm"
                style={{
                  backgroundColor:
                    intensity > 0.7
                      ? `rgba(20,241,149,${intensity})`
                      : intensity > 0.4
                      ? `rgba(153,69,255,${intensity})`
                      : "rgba(255,255,255,0.06)",
                }}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

const smallFeatures = [
  {
    icon: Globe,
    title: "Multilingual",
    description: "Portuguese, Spanish & English. Content built for LATAM developers.",
    color: "#9945FF",
    tag: "PT-BR · ES · EN",
  },
  {
    icon: Fingerprint,
    title: "Multi-Wallet Auth",
    description: "Phantom, Solflare, Backpack, or Google — all linked to one profile.",
    color: "#14F195",
    tag: "Web3 Auth",
  },
  {
    icon: Users,
    title: "LATAM Community",
    description: "5,000+ builders competing weekly on-chain XP leaderboard.",
    color: "#00C2FF",
    tag: "Live Rankings",
  },
  {
    icon: Shield,
    title: "Open Source",
    description: "MIT licensed. Fork, extend, and build your community's platform.",
    color: "#FF6B35",
    tag: "GitHub",
    link: "github.com/solanabr",
  },
];

export function Features() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-grid opacity-[0.15]" />
      <div className="section-divider absolute top-0 left-0 right-0" />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="highlight-chip mx-auto mb-4">
            <Sparkles className="w-3 h-3" />
            Why Superteam Academy
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 tracking-tight">
            Everything you need to{" "}
            <span className="gradient-text">build on Solana</span>
          </h2>
          <p className="text-base text-muted-foreground max-w-xl mx-auto">
            From your first Rust program to a production DeFi protocol — tools, content,
            and community all in one platform.
          </p>
        </motion.div>

        {/* ─── Bento Grid ─── */}
        <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-4 auto-rows-auto">

          {/* 1. Code Editor — large hero card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bento-card card-shine md:col-span-4 lg:col-span-7 row-span-2 p-6 flex flex-col min-h-[340px]"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-[#9945FF]/15 flex items-center justify-center">
                <Code2 className="w-5 h-5 text-[#9945FF]" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-foreground">Interactive Code Editor</h3>
                <p className="text-xs text-muted-foreground">Monaco-powered, Rust & TypeScript</p>
              </div>
              <span className="ml-auto skill-tag border-[#9945FF]/30 text-[#9945FF] bg-[#9945FF]/10">
                Live Editor
              </span>
            </div>
            <div className="flex-1 min-h-0">
              <CodeMockup />
            </div>
          </motion.div>

          {/* 2. On-Chain Credentials */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="bento-card md:col-span-2 lg:col-span-5 p-5 min-h-[160px] overflow-hidden"
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#14F195]/15 flex items-center justify-center shrink-0">
                <Trophy className="w-4 h-4 text-[#14F195]" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">On-Chain Credentials</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Soulbound Metaplex Core NFTs</p>
              </div>
            </div>
            <div className="flex-1">
              <CredentialCard />
            </div>
          </motion.div>

          {/* 3. XP Rewards / Chart */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bento-card md:col-span-2 lg:col-span-5 p-5 min-h-[160px] flex flex-col"
          >
            <XPMeter />
          </motion.div>

          {/* 4. Project-Based Learning */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="bento-card md:col-span-3 lg:col-span-5 p-6"
          >
            <div className="w-9 h-9 rounded-xl bg-[#FF6B35]/15 flex items-center justify-center mb-4">
              <BookOpen className="w-5 h-5 text-[#FF6B35]" />
            </div>
            <h3 className="font-semibold text-sm mb-2">Project-Based Learning</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Every course ends with a real project — AMM, NFT marketplace, or DeFi protocol.
              Ship something to your portfolio.
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {["AMM", "Lending", "NFT Market", "Token-2022", "DeFi"].map((tag) => (
                <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-[#FF6B35]/10 border border-[#FF6B35]/25 text-[#FF6B35]">
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>

          {/* 5. Streak Gamification */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bento-card md:col-span-3 lg:col-span-7 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-500/15 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Gamified Streaks</h3>
                  <p className="text-xs text-muted-foreground">87-day record</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-orange-400">🔥 23</p>
                <p className="text-[10px] text-muted-foreground">current streak</p>
              </div>
            </div>
            <StreakGrid />
            <div className="flex gap-3 mt-3 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm inline-block" style={{background:"rgba(20,241,149,0.8)"}} /> Active</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm inline-block" style={{background:"rgba(153,69,255,0.6)"}} /> Challenge</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm inline-block" style={{background:"rgba(255,255,255,0.08)"}} /> None</span>
            </div>
          </motion.div>

          {/* 6. Small feature cards */}
          {smallFeatures.map((feat, i) => (
            <motion.div
              key={feat.title}
              initial={{ opacity: 0, y: 24 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.35 + i * 0.08 }}
              className="bento-card md:col-span-3 lg:col-span-3 p-5 group"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
                style={{ backgroundColor: `${feat.color}18` }}
              >
                <feat.icon className="w-4 h-4" style={{ color: feat.color }} />
              </div>
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-sm">{feat.title}</h3>
                {feat.link && (
                  <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                {feat.description}
              </p>
              <span
                className="text-[10px] font-medium px-2 py-0.5 rounded-full border"
                style={{ color: feat.color, backgroundColor: `${feat.color}12`, borderColor: `${feat.color}30` }}
              >
                {feat.tag}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
