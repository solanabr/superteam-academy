"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Terminal, Zap, Trophy, Shield, Code, Globe, Users } from "lucide-react";
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

export default function HomePage() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const update = () => setTime(new Date().toISOString().split("T")[1].split(".")[0]);
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="noise min-h-screen bg-[#020202] grid-overlay">

      {/* Status bar */}
      <div className="border-b border-[#1a1a1a] px-6 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4 text-[10px] font-mono text-[#333] uppercase tracking-widest">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#14f195] blink" />
            DEVNET LIVE
          </span>
          <span>PROGRAM: ACADBR...3UCF</span>
        </div>
        <div className="text-[10px] font-mono text-[#333] uppercase tracking-widest">
          {time} UTC
        </div>
      </div>

      {/* Hero */}
      <section className="px-6 pt-16 pb-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 items-end">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center gap-3 mb-8">
                <span className="text-[10px] font-mono text-[#444] uppercase tracking-widest border border-[#1a1a1a] px-3 py-1">
                  SUPERTEAM ACADEMY v1.0
                </span>
                <span className="text-[10px] font-mono text-[#9945ff] uppercase tracking-widest">
                  SOLANA DEVNET
                </span>
              </div>

              <h1 className="font-display text-[80px] sm:text-[110px] lg:text-[150px] font-black leading-[0.85] tracking-tighter mb-8 uppercase">
                <GlitchText text="LEARN" />
                <br />
                <span className="text-[#9945ff]">BUILD</span>
                <br />
                <span className="text-[#14f195]">EARN.</span>
              </h1>

              <p className="font-mono text-sm text-[#555] max-w-lg mb-10 leading-relaxed">
                The most advanced on-chain learning platform for Solana builders.
                Complete interactive courses → earn soulbound XP tokens → collect
                verifiable NFT credentials. All on-chain. All permanent.
              </p>

              <div className="flex items-center gap-4">
                <Link href="/courses">
                  <motion.button
                    whileHover={{ x: 4 }}
                    className="group flex items-center gap-3 px-6 py-3 bg-[#9945ff] text-white font-mono text-xs uppercase tracking-widest hover:bg-[#8835ef] transition-colors"
                  >
                    START_LEARNING
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                </Link>
                <Link href="/leaderboard">
                  <button className="flex items-center gap-3 px-6 py-3 border border-[#1a1a1a] text-[#555] font-mono text-xs uppercase tracking-widest hover:border-[#333] hover:text-[#999] transition-colors">
                    VIEW_LEADERBOARD
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </Link>
              </div>
            </motion.div>
          </div>

          {/* Stats sidebar */}
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
      <section className="lg:hidden px-6 py-8 grid grid-cols-2 gap-px bg-[#1a1a1a] border-b border-[#1a1a1a]">
        {stats.map((stat) => (
          <div key={stat.prefix} className="bg-[#020202] px-5 py-4">
            <div className="text-[10px] font-mono text-[#333] mb-1">[{stat.prefix}]</div>
            <div className="text-xl font-black font-display">{stat.value}</div>
            <div className="text-[10px] font-mono text-[#444] uppercase tracking-wider">{stat.label}</div>
          </div>
        ))}
      </section>

      {/* Features grid */}
      <section className="px-6 py-24 max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-16">
          <span className="text-[10px] font-mono text-[#333] uppercase tracking-widest">// PLATFORM FEATURES</span>
          <div className="flex-1 h-px bg-[#1a1a1a]" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-[#1a1a1a]">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.label}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="bg-[#020202] p-8 hover:bg-[#0a0a0a] transition-colors group"
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

      {/* Courses */}
      <section className="px-6 pb-24 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-16">
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-mono text-[#333] uppercase tracking-widest">// FEATURED COURSES</span>
            <div className="w-24 h-px bg-[#1a1a1a]" />
          </div>
          <Link href="/courses" className="text-[10px] font-mono text-[#9945ff] uppercase tracking-widest hover:text-[#8835ef] transition-colors flex items-center gap-2">
            ALL_COURSES <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[#1a1a1a]">
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
                  {/* Course image area */}
                  <div className="h-48 bg-[#0d0d0d] relative overflow-hidden scanline flex items-end p-5">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Code className="w-20 h-20 text-[#9945ff] opacity-10" />
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

                  {/* Course info */}
                  <div className="p-6 flex flex-col flex-1 border-t border-[#1a1a1a]">
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

      {/* CTA */}
      <section className="border-t border-[#1a1a1a]">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="text-[10px] font-mono text-[#333] uppercase tracking-widest mb-6">
                // GET STARTED
              </div>
              <h2 className="font-display font-black text-6xl lg:text-8xl uppercase tracking-tighter leading-[0.85] mb-8">
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
                  className="flex items-center gap-3 px-8 py-4 bg-[#9945ff] text-white font-mono text-xs uppercase tracking-widest hover:bg-[#8835ef] transition-colors"
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
              <div className="p-6 font-mono text-xs space-y-2">
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

      <div className="border-t border-[#1a1a1a]" />
    </div>
  );
}