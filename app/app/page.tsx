"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Terminal, Zap, Trophy, Shield, Code, Globe, Users, Mail, Twitter, Github, ExternalLink } from "lucide-react";
import { mockCourses } from "@/lib/mockData";
import { DIFFICULTY_LABELS } from "@/lib/constants";

const tickerItems = [
  "SOLANA FUNDAMENTALS", "ANCHOR FRAMEWORK", "TOKEN-2022", "METAPLEX CORE",
  "DEFI PROTOCOLS", "NFT DEVELOPMENT", "SECURITY AUDITING", "ON-CHAIN CREDENTIALS",
  "SOULBOUND XP TOKENS", "SUPERTEAM BRAZIL", "OPEN SOURCE",
];

function Ticker() {
  const items = [...tickerItems, ...tickerItems];
  return (
    <div className="ticker-wrap py-3 my-0">
      <div className="ticker-content">
        {items.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-6 px-6 text-xs font-mono text-[#444] uppercase tracking-widest">
            <span className="w-1 h-1 rounded-full bg-[#9945ff] inline-block" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function GlitchText({ text }: { text: string }) {
  const [glitching, setGlitching] = useState(false);
  useEffect(() => {
    const interval = setInterval(() => {
      setGlitching(true);
      setTimeout(() => setGlitching(false), 200);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className={`relative inline-block ${glitching ? "glitch" : ""}`} data-text={text}>
      {text}
    </span>
  );
}

const stats = [
  { value: "12,400+", label: "Active learners", prefix: "01" },
  { value: "2.4M+", label: "XP distributed", prefix: "02" },
  { value: "8,900+", label: "Credentials issued", prefix: "03" },
  { value: "24+", label: "Courses available", prefix: "04" },
];

const features = [
  { icon: Terminal, label: "01", title: "Interactive Code Editor", desc: "Write, run, and test Solana programs in your browser. Real-time feedback, syntax highlighting, and test cases." },
  { icon: Zap, label: "02", title: "Soulbound XP Tokens", desc: "Every lesson completion mints Token-2022 XP directly to your wallet. Your progress is permanent and verifiable." },
  { icon: Trophy, label: "03", title: "On-Chain Credentials", desc: "Metaplex Core NFT credentials per learning track. Soulbound, upgradeable, wallet-visible across every Solana dApp." },
  { icon: Shield, label: "04", title: "Security First", desc: "Learn to identify and fix Solana vulnerabilities from day one. Real exploits, real patterns, real defenses." },
  { icon: Globe, label: "05", title: "3 Languages", desc: "Full platform support in Portuguese, Spanish, and English. Built for the Latin American Solana community and beyond." },
  { icon: Users, label: "06", title: "Open Source", desc: "MIT licensed and fully forkable. Built by Superteam Brazil, owned by the Solana ecosystem." },
];

const testimonials = [
  {
    quote: "Superteam Academy is the best way to learn Solana development. The on-chain credentials are a game changer.",
    author: "0xMaria",
    role: "Solana Developer",
    avatar: "0M",
  },
  {
    quote: "Finally a platform that teaches Anchor the right way. The interactive challenges are incredibly well designed.",
    author: "CryptoJoao",
    role: "DeFi Builder",
    avatar: "CJ",
  },
  {
    quote: "I went from zero to deploying my first dApp in 2 weeks. The XP system kept me motivated every single day.",
    author: "SolanaCarlos",
    role: "Full Stack Dev",
    avatar: "SC",
  },
];


const learningPaths = [
  {
    id: "fundamentals",
    title: "Solana Fundamentals",
    desc: "Zero to deployed dApp",
    courses: 4,
    xp: 5000,
    color: "#14f195",
    steps: ["Accounts", "Transactions", "Programs", "PDAs"],
  },
  {
    id: "anchor",
    title: "Anchor Developer",
    desc: "Build production programs",
    courses: 5,
    xp: 8000,
    color: "#9945ff",
    steps: ["Anchor Basics", "CPIs", "Token-2022", "Security"],
  },
  {
    id: "defi",
    title: "DeFi Architect",
    desc: "AMMs, lending, yield",
    courses: 6,
    xp: 12000,
    color: "#ff3366",
    steps: ["AMM Theory", "Liquidity Pools", "Yield Farming", "Auditing"],
  },
];

export default function HomePage() {
  const [time, setTime] = useState("");
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    const update = () => setTime(new Date().toISOString().split("T")[1].split(".")[0]);
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, []);

  function handleNewsletterSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail("");
    }
  }

  return (
    <div className="noise min-h-screen bg-[#020202] grid-overlay">

      {/* Status bar */}
      <div className="border-b border-[#1a1a1a] px-4 md:px-6 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3 md:gap-4 text-[10px] font-mono text-[#333] uppercase tracking-widest">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#14f195] blink" />
            DEVNET LIVE
          </span>
          <span className="hidden sm:block">PROGRAM: ACADBR...3UCF</span>
        </div>
        <div className="text-[10px] font-mono text-[#333] uppercase tracking-widest">
          {time} UTC
        </div>
      </div>

      {/* Hero */}
      <section className="px-4 md:px-6 pt-12 md:pt-16 pb-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 items-end">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex flex-wrap items-center gap-3 mb-6 md:mb-8">
                <span className="text-[10px] font-mono text-[#444] uppercase tracking-widest border border-[#1a1a1a] px-3 py-1">
                  SUPERTEAM ACADEMY v1.0
                </span>
                <span className="text-[10px] font-mono text-[#9945ff] uppercase tracking-widest">
                  SOLANA DEVNET
                </span>
              </div>

              <h1 className="font-display text-[64px] sm:text-[90px] lg:text-[150px] font-black leading-[0.85] tracking-tighter mb-6 md:mb-8 uppercase">
                <GlitchText text="LEARN" />
                <br />
                <span className="text-[#9945ff]">BUILD</span>
                <br />
                <span className="text-[#14f195]">EARN.</span>
              </h1>

              <p className="font-mono text-sm text-[#555] max-w-lg mb-8 md:mb-10 leading-relaxed">
                The most advanced on-chain learning platform for Solana builders.
                Complete interactive courses → earn soulbound XP tokens → collect
                verifiable NFT credentials. All on-chain. All permanent.
              </p>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                <Link href="/courses">
                  <motion.button
                    whileHover={{ x: 4 }}
                    className="group flex items-center gap-3 px-6 py-3 bg-[#9945ff] text-white font-mono text-xs uppercase tracking-widest hover:bg-[#8835ef] transition-colors w-full sm:w-auto justify-center"
                  >
                    START_LEARNING
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                </Link>
                <Link href="/leaderboard">
                  <button className="flex items-center gap-3 px-6 py-3 border border-[#1a1a1a] text-[#555] font-mono text-xs uppercase tracking-widest hover:border-[#333] hover:text-[#999] transition-colors w-full sm:w-auto justify-center">
                    VIEW_LEADERBOARD
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </Link>
              </div>
            </motion.div>
          </div>

          {/* Stats sidebar - desktop only */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="hidden lg:grid grid-rows-4 gap-px border border-[#1a1a1a]"
          >
            {stats.map((stat) => (
              <div key={stat.prefix} className="px-8 py-5 border-b border-[#1a1a1a] last:border-b-0 min-w-[200px]">
                <div className="text-[10px] font-mono text-[#333] mb-2 uppercase tracking-widest">
                  [{stat.prefix}]
                </div>
                <div className="text-2xl font-black font-display text-[#f5f5f0] mb-0.5">
                  {stat.value}
                </div>
                <div className="text-[10px] font-mono text-[#444] uppercase tracking-widest">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Ticker */}
      <Ticker />

      {/* Mobile stats */}
      <section className="lg:hidden px-4 py-6 grid grid-cols-2 gap-px bg-[#1a1a1a] border-b border-[#1a1a1a]">
        {stats.map((stat) => (
          <div key={stat.prefix} className="bg-[#020202] px-4 py-4">
            <div className="text-[10px] font-mono text-[#333] mb-1">[{stat.prefix}]</div>
            <div className="text-xl font-black font-display">{stat.value}</div>
            <div className="text-[10px] font-mono text-[#444] uppercase tracking-wider">{stat.label}</div>
          </div>
        ))}
      </section>

     {/* Partner logos */}
<section className="border-b border-[#1a1a1a] px-4 md:px-6 py-8">
  <div className="max-w-7xl mx-auto">
    <div className="text-[10px] font-mono text-[#333] uppercase tracking-widest text-center mb-8">
      // TRUSTED BY THE SOLANA ECOSYSTEM
    </div>
    <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12">
      
      {/* Solana */}
<a href="https://solana.com" target="_blank" rel="noopener noreferrer"
  className="flex items-center gap-3 opacity-40 hover:opacity-100 transition-opacity">
  <img src="/solana-wordmark.svg" alt="Solana" className="h-6 brightness-0 invert" />
</a>

{/* Superteam Brazil */}
<a href="https://superteam.fun/br" target="_blank" rel="noopener noreferrer"
  className="flex items-center gap-2 opacity-40 hover:opacity-100 transition-opacity">
  <img src="/superteam-br.jpg" alt="Superteam Brazil" className="h-7 w-7 rounded-sm object-cover" />
  <span className="text-[10px] font-mono text-[#444] uppercase tracking-widest hidden sm:block">Superteam Brazil</span>
</a>

{/* Metaplex */}
<a href="https://metaplex.com" target="_blank" rel="noopener noreferrer"
  className="flex items-center gap-2 opacity-40 hover:opacity-100 transition-opacity">
  <img src="/metaplex.jpg" alt="Metaplex" className="h-7 w-7 rounded-sm object-cover" />
  <span className="text-[10px] font-mono text-[#444] uppercase tracking-widest hidden sm:block">Metaplex</span>
</a>

{/* Helius */}
<a href="https://helius.dev" target="_blank" rel="noopener noreferrer"
  className="flex items-center gap-2 opacity-40 hover:opacity-100 transition-opacity">
  <img src="/helius.jpg" alt="Helius" className="h-7 w-7 rounded-sm object-cover" />
  <span className="text-[10px] font-mono text-[#444] uppercase tracking-widest hidden sm:block">Helius</span>
</a>

{/* Anchor */}
<a href="https://anchor-lang.com" target="_blank" rel="noopener noreferrer"
  className="flex items-center gap-2 opacity-40 hover:opacity-100 transition-opacity">
  <img src="/anchor.png" alt="Anchor" className="h-7 w-7 rounded-sm object-cover" />
  <span className="text-[10px] font-mono text-[#444] uppercase tracking-widest hidden sm:block">Anchor</span>
</a>

{/* Phantom */}
<a href="https://phantom.app" target="_blank" rel="noopener noreferrer"
  className="flex items-center gap-2 opacity-40 hover:opacity-100 transition-opacity">
  <img src="/phantom.jpg" alt="Phantom" className="h-7 w-7 rounded-sm object-cover" />
  <span className="text-[10px] font-mono text-[#444] uppercase tracking-widest hidden sm:block">Phantom</span>
</a>

    </div>
  </div>
</section>

      {/* Learning Paths */}
      <section className="px-4 md:px-6 py-16 md:py-24 max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-10 md:mb-16">
          <span className="text-[10px] font-mono text-[#333] uppercase tracking-widest">// LEARNING PATHS</span>
          <div className="flex-1 h-px bg-[#1a1a1a]" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {learningPaths.map((path, i) => (
            <motion.div
              key={path.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="border border-[#1a1a1a] p-6 hover:border-[#9945ff]/40 transition-all group bg-[#0a0a0a]"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="text-[9px] font-mono uppercase tracking-widest" style={{ color: path.color }}>
                  {path.courses} COURSES
                </div>
                <div className="text-[9px] font-mono text-[#444]">+{path.xp.toLocaleString()} XP</div>
              </div>
              <h3 className="font-display font-black text-xl uppercase mb-2 group-hover:text-[#9945ff] transition-colors">
                {path.title}
              </h3>
              <p className="text-[11px] font-mono text-[#444] mb-5">{path.desc}</p>
              <div className="space-y-2">
                {path.steps.map((step, si) => (
                  <div key={si} className="flex items-center gap-2">
                    <div className="w-4 h-4 flex items-center justify-center border border-[#1a1a1a] text-[8px] font-mono text-[#444]">
                      {si + 1}
                    </div>
                    <span className="text-[10px] font-mono text-[#555] uppercase">{step}</span>
                  </div>
                ))}
              </div>
              <Link href="/courses">
                <button className="mt-5 w-full py-2 border text-[10px] font-mono uppercase tracking-widest transition-colors hover:text-white"
                  style={{ borderColor: `${path.color}40`, color: path.color }}>
                  START PATH →
                </button>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features grid */}
      <section className="px-4 md:px-6 py-16 md:py-24 max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-10 md:mb-16">
          <span className="text-[10px] font-mono text-[#333] uppercase tracking-widest">// PLATFORM FEATURES</span>
          <div className="flex-1 h-px bg-[#1a1a1a]" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[#1a1a1a]">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.label}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="bg-[#020202] p-6 md:p-8 hover:bg-[#0a0a0a] transition-colors group"
              >
                <div className="flex items-start justify-between mb-6">
                  <Icon className="w-5 h-5 text-[#9945ff]" />
                  <span className="text-[10px] font-mono text-[#222] uppercase tracking-widest">
                    {feature.label}
                  </span>
                </div>
                <h3 className="font-display font-black text-lg uppercase tracking-tight mb-3 group-hover:text-[#9945ff] transition-colors">
                  {feature.title}
                </h3>
                <p className="text-xs font-mono text-[#444] leading-relaxed">
                  {feature.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Featured Courses */}
      <section className="px-4 md:px-6 pb-16 md:pb-24 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-10 md:mb-16">
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-mono text-[#333] uppercase tracking-widest">// FEATURED COURSES</span>
            <div className="hidden sm:block w-24 h-px bg-[#1a1a1a]" />
          </div>
          <Link href="/courses" className="text-[10px] font-mono text-[#9945ff] uppercase tracking-widest hover:text-[#8835ef] transition-colors flex items-center gap-2">
            ALL_COURSES <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[#1a1a1a]">
          {mockCourses.slice(0, 3).map((course, i) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Link href={`/courses/${course.id}`}>
                <div className="bg-[#020202] hover:bg-[#0a0a0a] transition-colors group h-full flex flex-col">
                  <div className="h-40 md:h-48 bg-[#0d0d0d] relative overflow-hidden scanline flex items-end p-5">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Code className="w-16 md:w-20 h-16 md:h-20 text-[#9945ff] opacity-10" />
                    </div>
                    <div className="relative">
                      <div className="text-[10px] font-mono text-[#333] uppercase tracking-widest mb-1">
                        TRACK_{course.trackId.toString().padStart(2, "0")}
                      </div>
                      <div className="text-xs font-mono text-[#9945ff] uppercase">
                        {DIFFICULTY_LABELS[course.difficulty]}
                      </div>
                    </div>
                    <div className="absolute top-4 right-4 text-[10px] font-mono text-[#14f195]">
                      +{course.xp.toLocaleString()}_XP
                    </div>
                  </div>
                  <div className="p-5 md:p-6 flex flex-col flex-1 border-t border-[#1a1a1a]">
                    <div className="text-[10px] font-mono text-[#333] uppercase tracking-widest mb-2">
                      {course.track}
                    </div>
                    <h3 className="font-display font-black text-lg uppercase tracking-tight mb-3 group-hover:text-[#9945ff] transition-colors">
                      {course.title}
                    </h3>
                    <p className="text-xs font-mono text-[#444] line-clamp-2 mb-4 flex-1 leading-relaxed">
                      {course.description}
                    </p>
                    <div className="flex items-center justify-between pt-4 border-t border-[#1a1a1a]">
                      <span className="text-[10px] font-mono text-[#333]">
                        {course.lessons}_LESSONS // {course.duration}
                      </span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-[#333] group-hover:text-[#9945ff] transition-colors" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-t border-[#1a1a1a] px-4 md:px-6 py-16 md:py-24">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-10 md:mb-16">
            <span className="text-[10px] font-mono text-[#333] uppercase tracking-widest">// BUILDER TESTIMONIALS</span>
            <div className="flex-1 h-px bg-[#1a1a1a]" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="border border-[#1a1a1a] p-6 bg-[#0a0a0a] hover:border-[#9945ff]/30 transition-colors"
              >
                <div className="text-[#9945ff] text-2xl mb-4 font-display">"</div>
                <p className="text-xs font-mono text-[#555] leading-relaxed mb-6">
                  {t.quote}
                </p>
                <div className="flex items-center gap-3 pt-4 border-t border-[#1a1a1a]">
                  <div className="w-8 h-8 bg-[#9945ff]/20 flex items-center justify-center text-[10px] font-mono text-[#9945ff] font-bold">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-[#f5f5f0] uppercase font-bold">{t.author}</div>
                    <div className="text-[9px] font-mono text-[#444] uppercase">{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA + Terminal */}
      <section className="border-t border-[#1a1a1a]">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-16 items-center">
            <div>
              <div className="text-[10px] font-mono text-[#333] uppercase tracking-widest mb-6">
                // GET STARTED
              </div>
              <h2 className="font-display font-black text-5xl md:text-6xl lg:text-8xl uppercase tracking-tighter leading-[0.85] mb-8">
                BUILD<br />
                <span className="text-[#9945ff]">ON</span><br />
                SOLANA.
              </h2>
              <p className="text-xs font-mono text-[#444] max-w-sm leading-relaxed mb-8">
                Your XP tokens and credentials live on-chain forever.
                Permanent proof of work. No middlemen. No expiry dates.
              </p>
              <Link href="/courses">
                <motion.button
                  whileHover={{ x: 4 }}
                  className="flex items-center gap-3 px-6 md:px-8 py-3 md:py-4 bg-[#9945ff] text-white font-mono text-xs uppercase tracking-widest hover:bg-[#8835ef] transition-colors"
                >
                  INITIALIZE_LEARNING
                  <ArrowRight className="w-3.5 h-3.5" />
                </motion.button>
              </Link>
            </div>

            {/* Terminal mockup */}
            <div className="border border-[#1a1a1a] bg-[#0a0a0a]">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1a1a1a]">
                <div className="w-2.5 h-2.5 rounded-full bg-[#ff3366]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#14f195]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#9945ff]" />
                <span className="ml-2 text-[10px] font-mono text-[#333]">academy_terminal</span>
              </div>
              <div className="p-4 md:p-6 font-mono text-xs space-y-2 overflow-x-auto">
                <div className="text-[#444]">$ sss-token enroll --course anchor-101</div>
                <div className="text-[#14f195]">✓ Enrollment PDA initialized</div>
                <div className="text-[#444]">$ complete-lesson --index 0</div>
                <div className="text-[#14f195]">✓ Lesson 0 completed</div>
                <div className="text-[#9945ff]">⚡ +100 XP minted to wallet</div>
                <div className="text-[#444]">$ get-credentials --wallet m5SE...WB5f</div>
                <div className="text-[#14f195]">✓ Credential NFT verified</div>
                <div className="text-[#555]">  track: Anchor Development</div>
                <div className="text-[#555]">  level: 3</div>
                <div className="text-[#555]">  xp: 1,200</div>
                <div className="flex items-center gap-1 text-[#f5f5f0]">
                  <span>$</span>
                  <span className="blink">_</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

{/* Superteam Brazil Banner */}
<section className="border-t border-[#1a1a1a] overflow-hidden relative">
  <div className="relative h-48 md:h-64">
    <img
  src="/superteam-banner.jpg"
  alt="Superteam Brazil"
  className="w-full h-full object-cover opacity-30"
/>
    <div className="absolute inset-0 bg-gradient-to-r from-[#020202] via-[#020202]/60 to-transparent" />
    <div className="absolute inset-0 flex items-center px-6 md:px-12 max-w-7xl mx-auto">
      <div className="flex items-center gap-4 md:gap-6">
        <img
  src="/superteam-br.jpg"
  alt="Superteam Brazil"
  className="w-12 h-12 md:w-16 md:h-16 object-cover rounded-sm border border-[#9945ff]/40"
/>
        <div>
          <div className="text-[9px] font-mono text-[#9945ff] uppercase tracking-widest mb-1">
            // BUILT BY
          </div>
          <div className="font-display font-black text-2xl md:text-4xl uppercase tracking-tighter text-[#f5f5f0]">
            SUPERTEAM BRAZIL
          </div>
          <div className="text-[10px] font-mono text-[#555] mt-1">
            Empowering the Latin American Solana ecosystem
          </div>
        </div>
      </div>
      
      <a  href="https://superteam.fun/br"
        target="_blank"
        rel="noopener noreferrer"
        className="ml-auto flex items-center gap-2 px-4 md:px-6 py-2.5 border border-[#9945ff]/40 text-[#9945ff] font-mono text-[10px] uppercase tracking-widest hover:bg-[#9945ff]/10 transition-colors shrink-0"
      >
        VISIT <ExternalLink className="w-3 h-3" />
      </a>
    </div>
  </div>
</section>

      {/* Newsletter */}
      <section className="border-t border-[#1a1a1a] px-4 md:px-6 py-16 md:py-24">
        <div className="max-w-2xl mx-auto text-center">
          <div className="text-[10px] font-mono text-[#333] uppercase tracking-widest mb-4">
            // STAY UPDATED
          </div>
          <h2 className="font-display font-black text-3xl md:text-4xl uppercase tracking-tighter mb-4">
            JOIN THE <span className="text-[#9945ff]">NEWSLETTER</span>
          </h2>
          <p className="text-xs font-mono text-[#444] mb-8 leading-relaxed">
            Get weekly updates on new courses, Solana ecosystem news, and builder spotlights.
          </p>
          {subscribed ? (
            <div className="flex items-center justify-center gap-2 text-[#14f195] font-mono text-sm">
              ✓ You're subscribed! Welcome to the community.
            </div>
          ) : (
            <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="flex-1 bg-[#0a0a0a] border border-[#1a1a1a] px-4 py-3 text-sm font-mono text-[#f5f5f0] placeholder-[#333] focus:outline-none focus:border-[#9945ff] transition-colors"
              />
              <button
                type="submit"
                className="flex items-center justify-center gap-2 px-6 py-3 bg-[#9945ff] text-white font-mono text-xs uppercase tracking-widest hover:bg-[#8835ef] transition-colors whitespace-nowrap"
              >
                <Mail className="w-3.5 h-3.5" />
                Subscribe
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1a1a1a] px-4 md:px-6 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 bg-[#9945ff] flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="font-display font-black text-sm uppercase">SUPERTEAM ACADEMY</span>
              </div>
              <p className="text-[10px] font-mono text-[#444] leading-relaxed mb-4">
                The most advanced on-chain learning platform for Solana builders.
              </p>
              <div className="flex items-center gap-3">
                <a href="https://twitter.com/SuperteamBR" target="_blank" rel="noopener noreferrer"
                  className="w-8 h-8 border border-[#1a1a1a] flex items-center justify-center text-[#444] hover:border-[#9945ff] hover:text-[#9945ff] transition-colors">
                  <Twitter className="w-3.5 h-3.5" />
                </a>
                <a href="https://github.com/solanabr/superteam-academy" target="_blank" rel="noopener noreferrer"
                  className="w-8 h-8 border border-[#1a1a1a] flex items-center justify-center text-[#444] hover:border-[#9945ff] hover:text-[#9945ff] transition-colors">
                  <Github className="w-3.5 h-3.5" />
                </a>
                <a href="https://superteam.fun/br" target="_blank" rel="noopener noreferrer"
                  className="w-8 h-8 border border-[#1a1a1a] flex items-center justify-center text-[#444] hover:border-[#9945ff] hover:text-[#9945ff] transition-colors">
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            <div>
              <div className="text-[9px] font-mono text-[#333] uppercase tracking-widest mb-4">Platform</div>
              <div className="space-y-2">
                {[
                  { href: "/courses", label: "Courses" },
                  { href: "/practice", label: "Practice Arena" },
                  { href: "/daily", label: "Daily Challenge" },
                  { href: "/leaderboard", label: "Leaderboard" },
                  { href: "/community", label: "Community" },
                ].map(link => (
                  <Link key={link.href} href={link.href}
                    className="block text-[10px] font-mono text-[#444] hover:text-[#9945ff] transition-colors uppercase tracking-widest">
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[9px] font-mono text-[#333] uppercase tracking-widest mb-4">Resources</div>
              <div className="space-y-2">
                {[
                  { href: "https://docs.solana.com", label: "Solana Docs" },
                  { href: "https://anchor-lang.com", label: "Anchor Docs" },
                  { href: "https://metaplex.com", label: "Metaplex Docs" },
                  { href: "https://github.com/solanabr/superteam-academy", label: "GitHub" },
                ].map(link => (
                  <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer"
                    className="block text-[10px] font-mono text-[#444] hover:text-[#9945ff] transition-colors uppercase tracking-widest">
                    {link.label}
                  </a>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[9px] font-mono text-[#333] uppercase tracking-widest mb-4">Community</div>
              <div className="space-y-2">
                {[
                  { href: "https://superteam.fun/br", label: "Superteam Brazil" },
                  { href: "https://discord.gg/solana", label: "Discord" },
                  { href: "https://twitter.com/SuperteamBR", label: "Twitter" },
                  { href: "/community", label: "Forum" },
                ].map(link => (
                  <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer"
                    className="block text-[10px] font-mono text-[#444] hover:text-[#9945ff] transition-colors uppercase tracking-widest">
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-[#1a1a1a] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-[9px] font-mono text-[#333] uppercase tracking-widest">
              © 2024 Superteam Academy. MIT Licensed. Built by Superteam Brazil.
            </div>
            <div className="flex items-center gap-4 text-[9px] font-mono text-[#333] uppercase tracking-widest">
              <span>Solana Devnet</span>
              <span className="w-1 h-1 rounded-full bg-[#333]" />
              <span>Open Source</span>
              <span className="w-1 h-1 rounded-full bg-[#333]" />
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#14f195] blink" />
                Live
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}