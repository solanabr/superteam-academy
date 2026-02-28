"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useEffect, useCallback, useState } from "react";
import { useTranslations } from "next-intl";

/* ─── Animated Glowing Grid ─── */
function AnimatedGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const spacing = 30;
    const cols = Math.ceil(w / spacing) + 1;
    const rows = Math.ceil(h / spacing) + 1;
    const time = Date.now() / 1000;

    ctx.clearRect(0, 0, w, h);

    // Base grid lines
    ctx.strokeStyle = "rgba(0, 255, 163, 0.06)";
    ctx.lineWidth = 0.5;

    for (let i = 0; i < cols; i++) {
      const x = i * spacing;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    for (let j = 0; j < rows; j++) {
      const y = j * spacing;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Glowing pulse lines — vertical
    const pulseCount = 6;
    for (let p = 0; p < pulseCount; p++) {
      const phase = time * 0.3 + p * 1.2;
      const colIdx = Math.floor(
        ((Math.sin(phase) * 0.5 + 0.5) * cols) % cols
      );
      const x = colIdx * spacing;

      const intensity = Math.sin(time * 1.2 + p * 1.8) * 0.5 + 0.5;
      const alpha = 0.08 + intensity * 0.18;

      const grad = ctx.createLinearGradient(x, 0, x, h);
      grad.addColorStop(0, "transparent");
      grad.addColorStop(0.3, `rgba(0, 255, 163, ${alpha})`);
      grad.addColorStop(0.5, `rgba(0, 255, 163, ${alpha * 1.5})`);
      grad.addColorStop(0.7, `rgba(0, 255, 163, ${alpha})`);
      grad.addColorStop(1, "transparent");

      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();

      ctx.shadowColor = "#00ffa3";
      ctx.shadowBlur = 15;
      ctx.strokeStyle = `rgba(0, 255, 163, ${alpha * 0.5})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Glowing pulse lines — horizontal
    for (let p = 0; p < 5; p++) {
      const phase = time * 0.25 + p * 1.6;
      const rowIdx = Math.floor(
        ((Math.cos(phase) * 0.5 + 0.5) * rows) % rows
      );
      const y = rowIdx * spacing;

      const intensity = Math.cos(time * 1.0 + p * 1.5) * 0.5 + 0.5;
      const alpha = 0.06 + intensity * 0.15;

      const grad = ctx.createLinearGradient(0, y, w, y);
      grad.addColorStop(0, "transparent");
      grad.addColorStop(0.2, `rgba(0, 255, 163, ${alpha})`);
      grad.addColorStop(0.5, `rgba(0, 255, 163, ${alpha * 1.3})`);
      grad.addColorStop(0.8, `rgba(0, 255, 163, ${alpha})`);
      grad.addColorStop(1, "transparent");

      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();

      ctx.shadowColor = "#00ffa3";
      ctx.shadowBlur = 12;
      ctx.strokeStyle = `rgba(0, 255, 163, ${alpha * 0.4})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Intersection glow dots
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const x = i * spacing;
        const y = j * spacing;
        const dist = Math.sin(time * 0.8 + i * 0.5 + j * 0.7) * 0.5 + 0.5;
        if (dist > 0.78) {
          const dotAlpha = (dist - 0.78) * 4.5;
          ctx.fillStyle = `rgba(0, 255, 163, ${dotAlpha * 0.35})`;
          ctx.shadowColor = "#00ffa3";
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(x, y, 1.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }
    }
  }, []);

  useEffect(() => {
    let raf: number;
    const loop = () => {
      draw();
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, [draw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      draw();
    };
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ opacity: 0.7 }}
    />
  );
}

/* ─── Floating Tech Badge ─── */
function TechBadge({
  icon,
  label,
  color,
  className,
  delay,
}: {
  icon: string;
  label: string;
  color: string;
  className?: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay, type: "spring", bounce: 0.3 }}
      className={`absolute z-20 hidden lg:flex ${className}`}
    >
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: delay * 0.5,
        }}
        className="flex items-center gap-2 px-3 py-1.5 border border-white/[0.08] bg-[#0a0f1a]/80 backdrop-blur-sm"
      >
        <span
          className="text-xs font-mono font-bold"
          style={{ color }}
        >
          {icon}
        </span>
        <span className="text-xs font-mono font-semibold tracking-wider text-zinc-300 uppercase">
          {label}
        </span>
      </motion.div>
    </motion.div>
  );
}

/* ─── Hero Visual ─── */
function HeroVisual() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.3 }}
      className="relative w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] mx-auto mb-4"
    >
      {/* Glow behind image */}
      <div className="absolute inset-0 bg-neon-green/[0.08] blur-[60px] scale-75" />
      <div className="absolute inset-0 bg-neon-cyan/[0.05] blur-[80px] scale-50 translate-y-4" />

      {/* Floating animation wrapper */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="relative w-full h-full"
      >
        <Image
          src="/hero-solana.png"
          alt="Solana Development"
          fill
          className="object-contain drop-shadow-[0_0_40px_rgba(0,255,163,0.15)]"
          style={{ mixBlendMode: "screen" }}
          priority
        />
      </motion.div>
    </motion.div>
  );
}

/* ─── Hacker Button with Text Scramble ─── */
const GLITCH_CHARS = "!@#$%^&*()_+-=[]{}|;:,.<>?/~`0123456789ABCDEF";

function HackerButton({ text }: { text: string }) {
  const [displayText, setDisplayText] = useState(text);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const scramble = useCallback(() => {
    let iteration = 0;
    const original = text;

    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      setDisplayText(
        original
          .split("")
          .map((char, idx) => {
            if (idx < iteration) return original[idx];
            return GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
          })
          .join("")
      );

      if (iteration >= original.length) {
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
      iteration += 1 / 2;
    }, 40);
  }, [text]);

  const reset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setDisplayText(text);
  }, [text]);

  return (
    <Button
      size="lg"
      className="btn-hacker h-12 px-8 text-sm font-bold uppercase tracking-widest bg-neon-green text-black hover:bg-neon-green/90 transition-all duration-300 rounded-none border border-neon-green font-mono"
      onMouseEnter={scramble}
      onMouseLeave={reset}
    >
      {displayText}
    </Button>
  );
}

/* ─── Typewriter Effect ─── */
function TypewriterText({ text, delay = 0 }: { text: string; delay?: number }) {
  const [displayed, setDisplayed] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      let i = 0;
      const interval = setInterval(() => {
        setDisplayed(text.slice(0, i + 1));
        i++;
        if (i >= text.length) {
          clearInterval(interval);
          setDone(true);
        }
      }, 80);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timeout);
  }, [text, delay]);

  useEffect(() => {
    const blink = setInterval(() => setShowCursor((v) => !v), 530);
    return () => clearInterval(blink);
  }, []);

  return (
    <span className="text-white font-black">
      {displayed}
      <span
        className={`inline-block w-[3px] h-[0.85em] bg-neon-green ml-1 align-middle transition-opacity duration-100 ${showCursor ? "opacity-100" : "opacity-0"
          } ${done ? "animate-pulse" : ""}`}
      />
    </span>
  );
}

/* ─── Animated Counter ─── */
function AnimatedCounter({
  target,
  suffix = "",
  label,
  duration = 2000,
  delay = 0,
}: {
  target: number;
  suffix?: string;
  label: string;
  duration?: number;
  delay?: number;
}) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(timeout);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [started, target, duration]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay / 1000 }}
      className="flex flex-col items-center gap-1"
    >
      <span className="text-xl sm:text-2xl font-mono font-black text-neon-green">
        {count.toLocaleString()}
        {suffix}
      </span>
      <span className="text-xs font-mono uppercase tracking-widest text-zinc-500">
        {label}
      </span>
    </motion.div>
  );
}

/* ─── Mouse-Reactive Glow ─── */
function MouseGlow() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
      setVisible(true);
    };
    const handleLeave = () => setVisible(false);
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseleave", handleLeave);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseleave", handleLeave);
    };
  }, []);

  return (
    <div
      className="pointer-events-none fixed z-[3] transition-opacity duration-300"
      style={{
        opacity: visible ? 1 : 0,
        left: pos.x - 200,
        top: pos.y - 200,
        width: 400,
        height: 400,
        background:
          "radial-gradient(circle, rgba(0,255,163,0.06) 0%, rgba(0,255,163,0.02) 40%, transparent 70%)",
        filter: "blur(10px)",
      }}
    />
  );
}

/* ─── Scrolling Code Lines (background decoration) ─── */
function ScrollingCode() {
  const lines = [
    'use solana_program::account_info::AccountInfo;',
    'use anchor_lang::prelude::*;',
    'pub fn initialize(ctx: Context<Initialize>) -> Result<()> {',
    '    let account = &mut ctx.accounts.data_account;',
    '    account.authority = ctx.accounts.user.key();',
    '    msg!("Program initialized successfully");',
    '    Ok(())',
    '}',
    '#[derive(Accounts)]',
    'pub struct Initialize<\'info> {',
    '    #[account(init, payer = user, space = 8 + 32)]',
    '    pub data_account: Account<\'info, DataAccount>,',
    '    #[account(mut)]',
    '    pub user: Signer<\'info>,',
    '    pub system_program: Program<\'info, System>,',
    '}',
  ];

  return (
    <div className="absolute left-4 top-[15%] bottom-[15%] w-[300px] hidden xl:block overflow-hidden opacity-[0.07] pointer-events-none z-[2]">
      <motion.div
        animate={{ y: [0, -400] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="space-y-1 font-mono text-[10px] text-neon-green whitespace-nowrap"
      >
        {[...lines, ...lines, ...lines].map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </motion.div>
    </div>
  );
}

/* ─── Main Hero ─── */
export function Hero() {
  const t = useTranslations("Hero");
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex items-center justify-center pt-20 pb-12 overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[#020408]" />
        <AnimatedGrid />
        {/* Ambient glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-neon-green/[0.03] blur-[180px]" />
        <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-neon-cyan/[0.02] blur-[120px]" />
        {/* Scanline overlay */}
        <div className="absolute inset-0 pointer-events-none z-[4] opacity-[0.03]" style={{
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,163,0.08) 2px, rgba(0,255,163,0.08) 4px)",
        }} />
        {/* Grain overlay */}
        <div className="absolute inset-0 grain-overlay z-[4]" />
      </div>

      {/* Scrolling code decoration */}
      <ScrollingCode />

      {/* Mouse-reactive glow */}
      <MouseGlow />

      {/* Floating tech badges */}
      <TechBadge
        icon="⚓"
        label="Anchor"
        color="#00ffa3"
        className="top-[30%] left-[8%]"
        delay={1.5}
      />
      <TechBadge
        icon="Rs"
        label="Rust"
        color="#f97316"
        className="top-[18%] right-[10%]"
        delay={1.8}
      />
      <TechBadge
        icon="Ts"
        label="TypeScript"
        color="#00f0ff"
        className="bottom-[32%] right-[10%]"
        delay={2.1}
      />
      <TechBadge
        icon="◎"
        label="Solana"
        color="#9945ff"
        className="bottom-[25%] left-[6%]"
        delay={2.4}
      />

      {/* Content */}
      <motion.div
        style={{ y, opacity }}
        className="container px-4 md:px-6 relative z-10"
      >
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
          {/* Hero Visual */}
          <HeroVisual />

          {/* Terminal prompt header */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex items-center gap-3 mb-6"
          >
            <span className="text-neon-green font-mono text-sm">{t("terminalPrefix")}</span>
            <span className="font-mono text-xs uppercase tracking-[0.3em] text-zinc-500">
              {t("terminalPrompt")}
            </span>
            <div className="w-2 h-2 bg-neon-green animate-pulse" />
          </motion.div>

          {/* Main Headline */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="space-y-2 mb-6"
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] font-mono">
              <span className="text-zinc-400 block">{t("headlinePrefix")}</span>
              <span className="relative inline-block px-3 py-1">
                {/* Corner brackets around the typed text */}
                <span className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-neon-green/50" />
                <span className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-neon-green/50" />
                <span className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-neon-green/50" />
                <span className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-neon-green/50" />
                <TypewriterText text={t("typewriterText")} delay={800} />
              </span>
            </h1>
          </motion.div>

          {/* Terminal-style Subtitle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-8"
          >
            <div className="text-sm sm:text-base text-zinc-500 max-w-lg leading-relaxed font-mono text-center">
              <span className="text-neon-green/60">{t("subtitleComment")} </span>
              {t("subtitle")}
            </div>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center gap-5 mb-12"
          >
            <Link href="/auth">
              <HackerButton text={t("ctaStart")} />
            </Link>
            <Link
              href="/courses"
              className="btn-slide-right relative flex items-center gap-2 text-sm text-zinc-400 hover:text-neon-green transition-colors duration-300 group uppercase tracking-wider font-semibold font-mono px-4 py-2 overflow-hidden border border-white/[0.08] hover:border-neon-green/40"
            >
              <span className="relative z-10">{t("ctaBrowse")}</span>
              <ArrowRight className="relative z-10 w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>

          {/* Animated Stats — in a bordered container */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.2 }}
            className="relative border border-white/[0.06] bg-[#0a0f1a]/60 backdrop-blur-sm px-8 py-5"
          >
            {/* Corner brackets */}
            <span className="absolute top-0 left-0 w-3 h-3 border-t border-l border-neon-green/30" />
            <span className="absolute top-0 right-0 w-3 h-3 border-t border-r border-neon-green/30" />
            <span className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-neon-green/30" />
            <span className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-neon-green/30" />

            <div className="text-[9px] text-zinc-600 font-mono uppercase tracking-[0.2em] text-center mb-3">
              <span className="text-neon-green/40">$ </span>{t("statsCommand")}
            </div>
            <div className="flex items-center gap-8 sm:gap-12">
              <AnimatedCounter target={1200} suffix="+" label={t("builders")} delay={1400} />
              <div className="w-px h-8 bg-white/[0.08]" />
              <AnimatedCounter target={50} suffix="+" label={t("courses")} delay={1600} />
              <div className="w-px h-8 bg-white/[0.08]" />
              <AnimatedCounter target={10} suffix="K+" label={t("programs")} delay={1800} />
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#020408] to-transparent z-10 pointer-events-none" />
    </section>
  );
}