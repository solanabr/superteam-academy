"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Play, Sparkles, Flame, Trophy, Zap, Star, Target, Swords, Crown } from "lucide-react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { FloatingParticles } from "@/components/ui/floating-particles";
import { OrbitRing } from "@/components/ui/orbit-ring";
import { TextScramble } from "@/components/ui/text-scramble";
import { useRef, useEffect, useState } from "react";

/* ─── Animated XP Bar ─── */
function XPBar() {
  const [xp, setXp] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setXp(73), 1200);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-neon-green font-bold tracking-wider uppercase flex items-center gap-1">
          <Crown className="w-3 h-3 text-amber-400" /> Level 7
        </span>
        <span className="text-zinc-500 font-mono">7,340 / 10,000 XP</span>
      </div>
      <div className="h-2.5 rounded-full bg-white/5 overflow-hidden border border-white/5 relative">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${xp}%` }}
          transition={{ duration: 1.5, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="h-full rounded-full bg-gradient-to-r from-neon-green via-emerald-400 to-neon-cyan relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
        </motion.div>
        {[25, 50, 75].map(p => (
          <div key={p} className="absolute top-0 bottom-0 w-px bg-white/10" style={{ left: `${p}%` }} />
        ))}
      </div>
    </div>
  );
}

/* ─── Level Ring ─── */
function LevelRing() {
  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ duration: 0.8, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-20 h-20 flex-shrink-0"
    >
      <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r="35" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
        <motion.circle cx="40" cy="40" r="35" fill="none" stroke="url(#lvlGrad)" strokeWidth="4" strokeLinecap="round"
          strokeDasharray={2 * Math.PI * 35}
          initial={{ strokeDashoffset: 2 * Math.PI * 35 }}
          animate={{ strokeDashoffset: 2 * Math.PI * 35 * 0.27 }}
          transition={{ duration: 1.5, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
        />
        <defs>
          <linearGradient id="lvlGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00ffa3" />
            <stop offset="100%" stopColor="#00f0ff" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-black text-white">7</span>
        <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-bold">LVL</span>
      </div>
    </motion.div>
  );
}

/* ─── Streak Badge ─── */
function StreakBadge() {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.5, delay: 1.2, type: "spring", bounce: 0.5 }}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20"
    >
      <Flame className="w-4 h-4 text-orange-400" />
      <span className="text-sm font-black text-orange-400">12</span>
      <span className="text-[10px] text-orange-400/60 uppercase tracking-wider font-bold">day streak</span>
    </motion.div>
  );
}

/* ─── Achievement Toast ─── */
function AchievementToast() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), 3000);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, x: 60, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 0.5, type: "spring", bounce: 0.3 }}
          className="absolute -right-4 top-8 md:right-[-140px] md:top-20 z-20"
        >
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#0a0f1a]/95 border border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.15)] backdrop-blur-xl max-w-[220px]">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
              <Trophy className="w-5 h-5 text-black" />
            </div>
            <div>
              <div className="text-[10px] text-amber-400 font-black uppercase tracking-widest">Achievement!</div>
              <div className="text-xs text-white font-bold">First Steps 🎉</div>
              <div className="text-[10px] text-amber-400/60 font-bold">+50 XP</div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Typewriter Code ─── */
const codeLines = [
  { text: 'use ', color: '#ff79c6' },
  { text: 'anchor_lang::prelude::*;', color: '#8be9fd' },
  { text: '', color: '' },
  { text: '#[program]', color: '#50fa7b' },
  { text: 'pub mod ', color: '#ff79c6' },
  { text: 'superteam_academy', color: '#f1fa8c' },
  { text: ' {', color: '#f8f8f2' },
  { text: '    use super::*;', color: '#ff79c6' },
  { text: '', color: '' },
  { text: '    pub fn ', color: '#ff79c6' },
  { text: 'complete_quest', color: '#50fa7b' },
  { text: '(ctx: Context<Quest>) -> Result<()> {', color: '#f8f8f2' },
  { text: '        ctx.accounts.player.xp += 100;', color: '#f8f8f2' },
  { text: '        msg!("', color: '#f8f8f2' },
  { text: '⚔️ Quest complete! +100 XP', color: '#f1fa8c' },
  { text: '");', color: '#f8f8f2' },
  { text: '        Ok(())', color: '#f8f8f2' },
  { text: '    }', color: '#f8f8f2' },
  { text: '}', color: '#f8f8f2' },
];

function TypewriterCode() {
  const [visibleChars, setVisibleChars] = useState(0);
  const fullText = codeLines.map(l => l.text).join('\n');

  useEffect(() => {
    if (visibleChars >= fullText.length) return;
    const timeout = setTimeout(() => setVisibleChars(prev => prev + 1), 25);
    return () => clearTimeout(timeout);
  }, [visibleChars, fullText.length]);

  const renderCode = () => {
    let charIndex = 0;
    return codeLines.map((line, lineIdx) => {
      const lineStart = charIndex;
      charIndex += line.text.length + 1;
      if (lineStart >= visibleChars) return <div key={lineIdx} className="h-[1.5em]">&nbsp;</div>;
      const visibleText = line.text.slice(0, Math.max(0, visibleChars - lineStart));
      return (
        <div key={lineIdx} className="h-[1.5em] flex items-center">
          <span className="text-zinc-600 select-none w-8 text-right mr-4 text-xs">{lineIdx + 1}</span>
          <span style={{ color: line.color }}>{visibleText}</span>
          {visibleChars >= lineStart && visibleChars < lineStart + line.text.length + 1 && (
            <span className="inline-block w-[2px] h-[1em] bg-neon-green ml-[1px]" style={{ animation: 'typewriter-cursor 1s step-end infinite' }} />
          )}
        </div>
      );
    });
  };

  return (
    <pre className="font-mono text-sm leading-relaxed overflow-x-auto">
      <code>{renderCode()}</code>
    </pre>
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
    <section ref={containerRef} className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#020408] via-[#040810] to-[#020408]" />
        <div className="absolute top-1/3 left-1/4 w-[600px] h-[600px] bg-neon-green/8 rounded-full blur-[150px] animate-glow-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-neon-cyan/8 rounded-full blur-[120px] animate-glow-pulse" style={{ animationDelay: '1s' }} />
        <FloatingParticles className="z-[2]" particleCount={40} connectionDistance={100} />
        <div className="absolute inset-0 opacity-[0.04] z-[3]" style={{
          backgroundImage: `linear-gradient(rgba(0,255,163,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,163,0.3) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }} />
        <div className="absolute inset-0 grain-overlay z-[4]" />
      </div>

      {/* Single orbit ring */}
      <OrbitRing size={600} className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[5] opacity-15" duration={30} dotCount={4} color="#00ffa3" />

      {/* Content */}
      <motion.div style={{ y, opacity }} className="container px-4 md:px-6 relative z-10">
        <div className="flex flex-col items-center text-center max-w-5xl mx-auto space-y-6">
          {/* Status bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-wrap items-center gap-3"
          >
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/10 text-xs font-medium backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-neon-green" />
              <span className="text-neon-green font-bold">⚔️ Season 1 is Live</span>
              <span className="text-zinc-500">•</span>
              <span className="text-zinc-400">Free & Open Source</span>
            </div>
            <StreakBadge />
          </motion.div>

          {/* Main Headline */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}>
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-black tracking-tighter leading-[0.85]">
              <TextScramble text="Level Up Your" className="text-white block" speed={30} />
              <TextScramble text="Solana Skills" className="text-gradient-animated block mt-2" delay={600} speed={30} />
            </h1>
          </motion.div>

          {/* Subtitle */}
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
            className="text-base sm:text-lg md:text-xl text-zinc-400 max-w-2xl leading-relaxed"
          >
            Complete <span className="text-neon-green font-bold">quests</span>. Earn <span className="text-amber-400 font-bold">XP</span>.
            Unlock <span className="text-neon-cyan font-bold">soulbound loot</span>. Climb the <span className="text-neon-purple font-bold">leaderboard</span>.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
          >
            <Link href="/auth" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto h-14 px-10 text-base font-black bg-gradient-to-r from-neon-green to-emerald-400 text-black hover:shadow-[0_0_40px_rgba(0,255,163,0.4)] transition-all duration-300 group rounded-xl">
                🎮 Start Your Quest
                <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-10 text-base border-white/10 hover:bg-white/5 text-white rounded-xl group">
              <Play className="mr-2 w-4 h-4 text-neon-green" />
              Watch Demo
            </Button>
          </motion.div>

          {/* Code Editor Card */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-3xl mt-8 md:mt-12 relative"
          >
            <AchievementToast />

            <div className="relative group">
              <div className="absolute -inset-4 bg-gradient-to-r from-neon-green/15 via-neon-cyan/10 to-neon-purple/15 rounded-2xl blur-2xl opacity-40 group-hover:opacity-60 transition-opacity duration-500" />

              <div className="relative rounded-xl border border-white/10 bg-[#0d1117] shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden">
                {/* Editor Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[#161b22]">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                      <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                      <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                    </div>
                    <div className="px-3 py-1 rounded-md bg-white/5 text-xs text-zinc-400 font-mono border border-white/5">
                      ⚔️ Quest: Deploy Your First Program
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-[10px] text-amber-400 font-black">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      +100 XP
                    </div>
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-neon-green/10 border border-neon-green/20">
                      <Target className="w-3 h-3 text-neon-green" />
                      <span className="text-[10px] text-neon-green font-black">3/5 Tasks</span>
                    </div>
                  </div>
                </div>

                {/* Code */}
                <div className="p-6 text-left min-h-[280px]">
                  <TypewriterCode />
                </div>

                {/* Footer: XP Bar */}
                <div className="px-4 py-3 border-t border-white/5 bg-[#161b22]">
                  <div className="flex items-center gap-4">
                    <LevelRing />
                    <div className="flex-1 space-y-2">
                      <XPBar />
                      <div className="flex items-center gap-3 text-[10px] text-zinc-500">
                        <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-neon-green" /> 2,660 XP to Level 8</span>
                        <span>•</span>
                        <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-orange-400" /> 12 day streak</span>
                        <span>•</span>
                        <span className="flex items-center gap-1"><Trophy className="w-3 h-3 text-amber-400" /> 8 achievements</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }} className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-2">
          <div className="w-1 h-2 bg-neon-green rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  );
}
