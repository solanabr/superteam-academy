"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { Zap, ArrowRight, Play, Star, Users, BookOpen, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

/* ── Animated counter hook ── */
function useCounter(end: number, duration = 1500, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [end, duration, start]);
  return count;
}

const floatingCards = [
  {
    icon: "🔥",
    title: "Daily Streak",
    value: "14 Days",
    subtitle: "Keep it up, builder!",
    color: "#FF6B35",
    pos: { left: "2%", top: "34%", transform: undefined },
  },
  {
    icon: "⚡",
    title: "XP Earned",
    value: "+75 XP",
    subtitle: "Proof of History lesson",
    color: "#9945FF",
    pos: { left: "2%", top: "63%", transform: undefined },
  },
  {
    icon: "🏆",
    title: "Achievement Unlocked",
    value: "Week Warrior",
    subtitle: "7-day streak · rare",
    color: "#14F195",
    pos: { right: "2%", top: "34%", transform: undefined },
  },
  {
    icon: "🎓",
    title: "Credential Minted",
    value: "Level 3 NFT",
    subtitle: "Solana Fundamentals",
    color: "#00C2FF",
    pos: { right: "2%", top: "63%", transform: undefined },
  },
];

const stats = [
  { label: "Developers", end: 5000, suffix: "+", icon: Users, color: "#9945FF" },
  { label: "Courses", end: 24, suffix: "", icon: BookOpen, color: "#14F195" },
  { label: "XP Awarded", end: 2100000, suffix: "", display: "2.1M", icon: Zap, color: "#00C2FF" },
  { label: "Countries", end: 28, suffix: "", icon: Star, color: "#FF6B35" },
];

export function Hero() {
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const yRaw = useTransform(scrollY, [0, 400], [0, -80]);
  const y = useSpring(yRaw, { stiffness: 100, damping: 30 });
  const opacity = useTransform(scrollY, [0, 280], [1, 0]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const c0 = useCounter(stats[0].end, 1800, mounted);
  const c1 = useCounter(stats[1].end, 1200, mounted);
  const c3 = useCounter(stats[3].end, 1500, mounted);

  function formatStat(i: number, val: number) {
    if (stats[i].display) return stats[i].display!;
    if (stats[i].end >= 1000) return val.toLocaleString();
    return String(val);
  }

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-16 noise-overlay"
    >
      {/* Aurora background */}
      <div className="absolute inset-0 aurora-bg" />

      {/* Dot grid */}
      <div
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.15) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Ambient glow orbs */}
      <div className="absolute top-1/3 -left-1/4 w-[700px] h-[700px] rounded-full bg-[#9945FF]/8 blur-[140px] animate-pulse-slow pointer-events-none" />
      <div className="absolute bottom-1/4 -right-1/4 w-[600px] h-[600px] rounded-full bg-[#14F195]/8 blur-[140px] animate-pulse-slow pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-[#9945FF]/4 blur-[120px] pointer-events-none" />

      {/* Floating particles */}
      {mounted && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 16 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: i % 3 === 0 ? "3px" : "2px",
                height: i % 3 === 0 ? "3px" : "2px",
                left: `${10 + (i * 5.5) % 80}%`,
                top: `${15 + (i * 7.3) % 70}%`,
                backgroundColor: i % 2 === 0 ? "rgba(153,69,255,0.5)" : "rgba(20,241,149,0.4)",
              }}
              animate={{ y: [0, -24, 0], opacity: [0.3, 0.9, 0.3] }}
              transition={{ duration: 4 + (i % 4), repeat: Infinity, delay: i * 0.35 }}
            />
          ))}
        </div>
      )}

      {/* Main content */}
      <motion.div
        style={{ y, opacity }}
        className="relative z-10 text-center px-4 sm:px-6 max-w-5xl mx-auto w-full"
      >
        {/* Eyebrow badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-center mb-8"
        >
          <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#9945FF]/30 bg-[#9945FF]/8 backdrop-blur-sm text-sm">
            <span className="flex items-center gap-1.5">
              <span className="live-dot w-1.5 h-1.5 rounded-full bg-[#14F195] text-[#14F195]" />
              <span className="text-[#14F195] text-xs font-semibold">LIVE</span>
            </span>
            <span className="w-px h-3 bg-white/20" />
            <span className="text-white/60 text-xs">🏆 The #1 Solana Learning Platform in LATAM</span>
          </div>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-extrabold tracking-tight mb-6 leading-[1.05]"
        >
          <span className="block text-foreground">Master Solana</span>
          <span
            className="block mt-1"
            style={{
              background: "linear-gradient(135deg, #9945FF 0%, #14F195 50%, #00C2FF 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            From Zero to dApp
          </span>
        </motion.h1>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Interactive courses, soulbound XP tokens, and Metaplex Core NFT credentials.
          Build real dApps from day one — the most immersive Solana experience in Latin America.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16"
        >
          <Button asChild variant="gradient" size="xl" className="w-full sm:w-auto group relative overflow-hidden">
            <Link href="/courses">
              <span className="relative z-10 flex items-center gap-2">
                Start Learning Free
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
          </Button>
          <Button asChild variant="glass" size="xl" className="w-full sm:w-auto group">
            <Link href="/courses">
              <Play className="h-4 w-4 text-[#14F195] group-hover:scale-125 transition-transform" fill="#14F195" />
              Watch Demo
            </Link>
          </Button>
        </motion.div>

        {/* Animated Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/[0.06] rounded-2xl overflow-hidden border border-white/[0.06] max-w-2xl mx-auto"
        >
          {[c0, c1, 0, c3].map((count, i) => {
            const StatIcon = stats[i].icon;
            return (
              <div
                key={stats[i].label}
                className="flex flex-col items-center gap-1 py-4 px-3 bg-background/60 backdrop-blur-sm"
              >
                <div className="flex items-center gap-1.5">
                  <StatIcon className="h-3.5 w-3.5" style={{ color: stats[i].color }} />
                  <span className="text-xl sm:text-2xl font-bold text-foreground tabular-nums">
                    {formatStat(i, count)}{stats[i].suffix}
                  </span>
                </div>
                <span className="text-[11px] text-muted-foreground/70">{stats[i].label}</span>
              </div>
            );
          })}
        </motion.div>

        {/* Social proof */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex items-center justify-center gap-2 mt-6"
        >
          <div className="flex -space-x-2">
            {["DG", "MC", "CR", "AL", "RA"].map((initials, i) => (
              <div
                key={i}
                className="w-6 h-6 rounded-full border-2 border-background flex items-center justify-center text-[8px] font-bold text-white"
                style={{
                  background: `hsl(${260 + i * 30}, 70%, 60%)`,
                  zIndex: 5 - i,
                }}
              >
                {initials}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            <strong className="text-foreground">4.9</strong> from 1,240+ builders
          </span>
        </motion.div>
      </motion.div>

      {/* Floating UI cards — anchored to side edges, never overlap text */}
      {mounted && (
        <div className="hidden lg:block absolute inset-0 pointer-events-none z-10">
          {floatingCards.map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{
                opacity: 1,
                scale: 1,
                y: [0, -8, 0],
              }}
              transition={{
                opacity: { duration: 0.5, delay: 0.7 + i * 0.15 },
                scale: { duration: 0.5, delay: 0.7 + i * 0.15 },
                y: { duration: 5 + i * 0.4, repeat: Infinity, delay: i * 0.6, ease: "easeInOut" },
              }}
              style={{
                position: "absolute",
                left: card.pos.left,
                right: card.pos.right,
                top: card.pos.top,
                transform: card.pos.transform,
              }}
            >
              <div
                className="p-3.5 w-48 shadow-card rounded-2xl border backdrop-blur-xl"
                style={{
                  backgroundColor: "rgba(10, 10, 18, 0.40)",
                  borderColor: `${card.color}35`,
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-lg shrink-0"
                    style={{ backgroundColor: `${card.color}20` }}
                  >
                    {card.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-white/80 uppercase tracking-wider">{card.title}</p>
                    <p className="text-sm font-bold text-white leading-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">{card.value}</p>
                    <p className="text-[10px] text-white/70 mt-0.5">{card.subtitle}</p>
                  </div>
                </div>
                <div className="mt-2.5 flex items-center gap-1.5">
                  <TrendingUp className="w-3 h-3" style={{ color: card.color }} />
                  <div className="flex-1 h-1 rounded-full bg-white/15">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: card.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${65 + i * 12}%` }}
                      transition={{ delay: 0.8 + i * 0.1, duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/40">Scroll</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          className="w-px h-8 bg-gradient-to-b from-transparent via-muted-foreground/30 to-transparent"
        />
      </motion.div>
    </section>
  );
}
