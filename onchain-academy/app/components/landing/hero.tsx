"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  ArrowRight,
  Flame,
  Trophy,
  Zap,
  Star,
  Target,
  Crown,
  Shield,
  Swords,
  Gem,
  ChevronUp,
} from "lucide-react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { FloatingParticles } from "@/components/ui/floating-particles";
import { useRef, useEffect, useState } from "react";

/* ─── Animated Counter ─── */
function AnimatedCounter({ target, duration = 2, delay = 0.5, suffix = "" }: { target: number; duration?: number; delay?: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => {
      let start = 0;
      const step = target / (duration * 60);
      const interval = setInterval(() => {
        start += step;
        if (start >= target) {
          setCount(target);
          clearInterval(interval);
        } else {
          setCount(Math.floor(start));
        }
      }, 1000 / 60);
      return () => clearInterval(interval);
    }, delay * 1000);
    return () => clearTimeout(timer);
  }, [target, duration, delay]);
  return <>{count.toLocaleString()}{suffix}</>;
}

/* ─── XP Progress Ring ─── */
function XPProgressRing({ progress = 73, level = 7 }: { progress?: number; level?: number }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="relative w-32 h-32 flex-shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        {/* Background track */}
        <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="8" />
        {/* Tick marks */}
        {Array.from({ length: 24 }).map((_, i) => {
          const angle = (i / 24) * 360;
          const rad = (angle * Math.PI) / 180;
          const x1 = 60 + 46 * Math.cos(rad);
          const y1 = 60 + 46 * Math.sin(rad);
          const x2 = 60 + 44 * Math.cos(rad);
          const y2 = 60 + 44 * Math.sin(rad);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />;
        })}
        {/* Progress arc */}
        <motion.circle
          cx="60" cy="60" r={radius} fill="none" stroke="#00ffa3" strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - progress / 100) }}
          transition={{ duration: 2, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
        />
        {/* Glow filter */}
        <defs>
          <filter id="xpGlow">
            <feGaussianBlur stdDeviation="3" result="glow" />
            <feMerge><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <motion.circle
          cx="60" cy="60" r={radius} fill="none" stroke="#00ffa3" strokeWidth="4" strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - progress / 100) }}
          transition={{ duration: 2, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
          filter="url(#xpGlow)" opacity={0.5}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <Crown className="w-4 h-4 text-amber-400 mb-0.5" />
        <span className="text-3xl font-black text-white">{level}</span>
        <span className="text-[9px] text-zinc-500 uppercase tracking-[0.2em] font-bold">level</span>
      </div>
    </div>
  );
}

/* ─── Mini Leaderboard ─── */
const leaderboardData = [
  { rank: 1, name: "CryptoPilot", xp: "42,850", avatar: "🦊", change: "+3" },
  { rank: 2, name: "SolanaWiz", xp: "38,200", avatar: "🐉", change: "+1" },
  { rank: 3, name: "ChainMaster", xp: "35,600", avatar: "⚡", change: "-1" },
];

function MiniLeaderboard() {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="w-3.5 h-3.5 text-amber-400" />
        <span className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider">Top Questers</span>
      </div>
      {leaderboardData.map((player, idx) => (
        <motion.div
          key={player.rank}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 1.2 + idx * 0.15 }}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${idx === 0 ? "bg-amber-500/5 border border-amber-500/10" : "bg-white/[0.02] border border-transparent"
            }`}
        >
          <span className={`text-xs font-black w-5 text-center ${idx === 0 ? "text-amber-400" : idx === 1 ? "text-zinc-400" : "text-zinc-600"
            }`}>{player.rank}</span>
          <span className="text-sm">{player.avatar}</span>
          <span className="text-xs font-bold text-white flex-1">{player.name}</span>
          <span className="text-[10px] text-zinc-500 font-mono">{player.xp} XP</span>
          <span className="text-[10px] text-neon-green font-bold flex items-center">
            <ChevronUp className="w-3 h-3" />{player.change}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

/* ─── Active Quest Card ─── */
function ActiveQuestCard() {
  const [tasksDone, setTasksDone] = useState(0);
  useEffect(() => {
    const t1 = setTimeout(() => setTasksDone(1), 1800);
    const t2 = setTimeout(() => setTasksDone(2), 2600);
    const t3 = setTimeout(() => setTasksDone(3), 3400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const tasks = [
    "Initialize Anchor workspace",
    "Write program instruction",
    "Deploy to devnet",
    "Test with client SDK",
    "Submit for review",
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-neon-green/10 flex items-center justify-center border border-neon-green/20">
            <Swords className="w-4 h-4 text-neon-green" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Deploy Your First Program</div>
            <div className="text-[10px] text-zinc-500">Chapter 3 • Solana Basics</div>
          </div>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-amber-500/10 border border-amber-500/20">
          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
          <span className="text-[10px] text-amber-400 font-black">+250 XP</span>
        </div>
      </div>

      {/* Task list */}
      <div className="space-y-1.5">
        {tasks.map((task, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0.3 }}
            animate={{ opacity: idx < tasksDone ? 1 : idx === tasksDone ? 0.8 : 0.35 }}
            className="flex items-center gap-2.5 py-1"
          >
            <div className={`w-4 h-4 rounded-sm border flex items-center justify-center flex-shrink-0 transition-all duration-300 ${idx < tasksDone
                ? "bg-neon-green/20 border-neon-green/40"
                : idx === tasksDone
                  ? "border-neon-green/30 animate-pulse"
                  : "border-white/10"
              }`}>
              {idx < tasksDone && (
                <motion.svg
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ type: "spring", bounce: 0.5 }}
                  className="w-2.5 h-2.5 text-neon-green" viewBox="0 0 12 12" fill="none"
                >
                  <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </motion.svg>
              )}
              {idx === tasksDone && (
                <div className="w-1.5 h-1.5 rounded-full bg-neon-green" />
              )}
            </div>
            <span className={`text-xs ${idx < tasksDone ? "text-zinc-300 line-through" : idx === tasksDone ? "text-white font-medium" : "text-zinc-600"}`}>
              {task}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-zinc-500 font-mono">{tasksDone}/5 tasks</span>
          <span className="text-neon-green font-bold">{Math.round((tasksDone / 5) * 100)}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-neon-green"
            initial={{ width: 0 }}
            animate={{ width: `${(tasksDone / 5) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>
    </div>
  );
}

/* ─── Floating HUD Stat Badges ─── */
function FloatingBadge({ icon: Icon, label, value, color, className, delay }: {
  icon: any; label: string; value: string; color: string; className?: string; delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.6, delay, type: "spring", bounce: 0.3 }}
      className={`absolute z-20 ${className}`}
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: delay * 0.5 }}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#0a0f1a]/90 border border-white/[0.06] backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
      >
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
          <Icon className="w-3.5 h-3.5" style={{ color }} />
        </div>
        <div>
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold leading-none">{label}</div>
          <div className="text-sm font-black text-white leading-tight">{value}</div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Achievement Badges ─── */
const achievements = [
  { emoji: "⚔️", label: "First Quest", unlocked: true },
  { emoji: "🛡️", label: "Deployer", unlocked: true },
  { emoji: "🔥", label: "Streak Master", unlocked: true },
  { emoji: "💎", label: "Diamond Hands", unlocked: false },
  { emoji: "👑", label: "Top 10", unlocked: false },
];

function AchievementRow() {
  return (
    <div className="flex items-center gap-2">
      {achievements.map((ach, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 1.8 + idx * 0.1, type: "spring", bounce: 0.4 }}
          className={`w-9 h-9 rounded-lg flex items-center justify-center border text-sm ${ach.unlocked
              ? "bg-white/[0.04] border-white/10 hover:border-neon-green/30 transition-colors cursor-pointer"
              : "bg-white/[0.01] border-white/[0.04] opacity-30 grayscale"
            }`}
          title={ach.label}
        >
          {ach.emoji}
        </motion.div>
      ))}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.3 }}
        className="text-[10px] text-zinc-600 font-mono ml-1"
      >
        3/5
      </motion.div>
    </div>
  );
}

/* ─── Hex Grid Background ─── */
function HexGridBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg className="absolute inset-0 w-full h-full opacity-[0.025]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="hexGrid" width="56" height="100" patternUnits="userSpaceOnUse" patternTransform="scale(2)">
            <path d="M28 66L0 50L0 16L28 0L56 16L56 50L28 66L28 100" fill="none" stroke="#00ffa3" strokeWidth="0.5" />
            <path d="M28 0L28 -34L0 -50L-28 -34L-28 0L0 16" fill="none" stroke="#00ffa3" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hexGrid)" />
      </svg>
    </div>
  );
}

/* ─── Main Hero ─── */
export function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section ref={containerRef} className="relative min-h-screen flex items-center justify-center pt-20 pb-12 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[#020408]" />
        {/* Ambient glows — solid color, no gradient text */}
        <div className="absolute top-1/4 left-1/6 w-[500px] h-[500px] bg-neon-green/[0.04] rounded-full blur-[180px]" />
        <div className="absolute bottom-1/3 right-1/5 w-[400px] h-[400px] bg-neon-cyan/[0.03] rounded-full blur-[150px]" />
        <div className="absolute top-2/3 left-1/2 w-[300px] h-[300px] bg-neon-purple/[0.03] rounded-full blur-[120px]" />
        <HexGridBackground />
        <FloatingParticles className="z-[2]" particleCount={30} connectionDistance={80} />
        {/* Scanline effect */}
        <div className="absolute inset-0 z-[3] pointer-events-none opacity-[0.015]" style={{
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,163,0.1) 2px, rgba(0,255,163,0.1) 4px)",
        }} />
        <div className="absolute inset-0 grain-overlay z-[4]" />
      </div>

      {/* Floating HUD badges — desktop only */}
      <div className="hidden lg:block">
        <FloatingBadge icon={Flame} label="Streak" value="12 Days" color="#f97316" className="top-[18%] left-[6%]" delay={1.5} />
        <FloatingBadge icon={Target} label="Rank" value="#42" color="#00f0ff" className="top-[22%] right-[5%]" delay={1.8} />
        <FloatingBadge icon={Gem} label="Loot" value="3 NFTs" color="#9945ff" className="bottom-[28%] left-[4%]" delay={2.0} />
        <FloatingBadge icon={Shield} label="Quests" value="18 Done" color="#00ffa3" className="bottom-[24%] right-[6%]" delay={2.2} />
      </div>

      {/* Content */}
      <motion.div style={{ y, opacity }} className="container px-4 md:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center max-w-7xl mx-auto">

          {/* Left — Text & CTA */}
          <div className="space-y-8 text-center lg:text-left">
            {/* Season Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.08] backdrop-blur-sm"
            >
              <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
              <span className="text-xs text-neon-green font-bold">⚔️ Season 1 is Live</span>
              <span className="text-zinc-600">•</span>
              <span className="text-xs text-zinc-500">Free & Open Source</span>
            </motion.div>

            {/* Main Headline — NO gradient text */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="space-y-2"
            >
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-black tracking-tighter leading-[0.9]">
                <span className="text-white block">Level Up Your</span>
                <span className="text-neon-green text-glow block">Solana Skills</span>
              </h1>
            </motion.div>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-base sm:text-lg text-zinc-400 max-w-lg leading-relaxed mx-auto lg:mx-0"
            >
              The first <span className="text-white font-semibold">gamified learning platform</span> for Solana development.
              Complete quests, earn XP, collect soulbound loot, and compete on the leaderboard.
            </motion.p>

            {/* Live Stats row */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="flex items-center gap-6 justify-center lg:justify-start"
            >
              {[
                { label: "Learners", value: 2847, suffix: "+" },
                { label: "XP Earned", value: 584000, suffix: "" },
                { label: "Quests", value: 120, suffix: "+" },
              ].map((stat, idx) => (
                <div key={idx} className="text-center lg:text-left">
                  <div className="text-lg sm:text-xl font-black text-white">
                    <AnimatedCounter target={stat.value} delay={0.8 + idx * 0.2} suffix={stat.suffix} />
                  </div>
                  <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">{stat.label}</div>
                </div>
              ))}
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center gap-4"
            >
              <Link href="/auth" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto h-14 px-10 text-base font-black bg-neon-green text-black hover:bg-neon-green/90 hover:shadow-[0_0_40px_rgba(0,255,163,0.3)] transition-all duration-300 group rounded-xl relative overflow-hidden"
                >
                  {/* Pulse ring behind */}
                  <span className="absolute inset-0 rounded-xl border-2 border-neon-green/50 animate-ping opacity-20" />
                  <Swords className="mr-2 w-5 h-5" />
                  Enter the Arena
                  <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="/courses">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto h-14 px-10 text-base border-white/10 hover:bg-white/5 text-white rounded-xl group"
                >
                  <Zap className="mr-2 w-4 h-4 text-neon-green" />
                  Browse Quests
                </Button>
              </Link>
            </motion.div>
          </div>

          {/* Right — Quest Hub Card */}
          <motion.div
            initial={{ opacity: 0, y: 50, rotateY: -5 }}
            animate={{ opacity: 1, y: 0, rotateY: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div className="relative group">
              {/* Glow behind card */}
              <div className="absolute -inset-6 bg-neon-green/[0.06] rounded-3xl blur-3xl opacity-60 group-hover:opacity-80 transition-opacity duration-700" />

              <div className="relative rounded-2xl border border-white/[0.08] bg-[#080c14]/95 backdrop-blur-xl shadow-[0_24px_80px_rgba(0,0,0,0.5)] overflow-hidden">
                {/* Card Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                    </div>
                    <span className="text-xs text-zinc-500 font-mono">quest_hub.sol</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
                    <span className="text-[10px] text-neon-green font-bold uppercase tracking-wider">Live</span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 space-y-5">
                  {/* Profile Row + XP Ring */}
                  <div className="flex items-center gap-4">
                    <XPProgressRing progress={73} level={7} />
                    <div className="flex-1 space-y-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">Questers.sol</span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-neon-green/10 text-neon-green border border-neon-green/20">PRO</span>
                        </div>
                        <div className="text-[10px] text-zinc-500 font-mono mt-0.5">7,340 / 10,000 XP to Level 8</div>
                      </div>
                      {/* Inline stats */}
                      <div className="flex items-center gap-3 flex-wrap">
                        {[
                          { icon: Flame, text: "12 day streak", color: "text-orange-400" },
                          { icon: Trophy, text: "Rank #42", color: "text-amber-400" },
                          { icon: Zap, text: "18 quests", color: "text-neon-green" },
                        ].map((s, i) => (
                          <div key={i} className="flex items-center gap-1">
                            <s.icon className={`w-3 h-3 ${s.color}`} />
                            <span className="text-[10px] text-zinc-500 font-medium">{s.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-white/[0.05]" />

                  {/* Active Quest */}
                  <ActiveQuestCard />

                  {/* Divider */}
                  <div className="h-px bg-white/[0.05]" />

                  {/* Mini Leaderboard */}
                  <MiniLeaderboard />

                  {/* Achievement Badges */}
                  <div className="pt-1">
                    <div className="flex items-center gap-2 mb-2.5">
                      <Star className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider">Achievements</span>
                    </div>
                    <AchievementRow />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-2"
        >
          <div className="w-1 h-2 bg-neon-green rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  );
}
