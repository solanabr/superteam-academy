"use client";

import { motion } from "framer-motion";
import { ArrowRight, Play, Code2, Trophy, Users, Zap, Sparkles, Terminal, Target, Rocket, Globe, Lock, Github } from "lucide-react";
import Link from "next/link";
import { ThreeHeroBackground } from "./ThreeHeroBackground";
import { useState, useEffect } from "react";

export function Hero() {
  const [activeTab, setActiveTab] = useState(0);
  const [displayedCode, setDisplayedCode] = useState("");
  const [isTyping, setIsTyping] = useState(true);

  const codeSnippets = [
    {
      language: "anchor",
      code: `#[program]
pub mod solana_academy {
    use super::*;
    
    pub fn learn(ctx: Context<Learn>) -> Result<()> {
        let student = &mut ctx.accounts.student;
        student.xp += 100;
        student.level_up()?;
        Ok(())
    }
}`,
    },
    {
      language: "typescript",
      code: `import { Connection, PublicKey } from '@solana/web3.js';

const connection = new Connection('https://api.devnet.solana.com');

// Query your learning progress on-chain
const progress = await connection.getAccountInfo(
  new PublicKey(studentPda)
);`,
    },
  ];

  useEffect(() => {
    const code = codeSnippets[activeTab].code;
    setDisplayedCode("");
    setIsTyping(true);
    
    let index = 0;
    const timer = setInterval(() => {
      if (index <= code.length) {
        setDisplayedCode(code.slice(0, index));
        index++;
      } else {
        setIsTyping(false);
        clearInterval(timer);
      }
    }, 15);

    return () => clearInterval(timer);
  }, [activeTab]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.3,
      },
    },
  } as const;

  const itemVariants = {
    hidden: { opacity: 0, y: 25 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" as const },
    },
  } as const;

  return (
    <section className="relative min-h-screen overflow-hidden">
      <ThreeHeroBackground />

      <div className="relative z-20">
        {/* Hero Content */}
        <div className="min-h-screen flex flex-col items-center justify-center px-6 pt-20 pb-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="w-full"
          >
            {/* Animated Badge */}
            <motion.div variants={itemVariants} className="mb-8 flex justify-center">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-green-500/20 border border-purple-500/30 text-sm">
                <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
                <span className="bg-gradient-to-r from-purple-400 to-green-400 bg-clip-text text-transparent font-medium">
                  Next-Gen Solana Education
                </span>
              </span>
            </motion.div>

            {/* Main Headline */}
            <motion.div variants={itemVariants} className="text-center max-w-5xl mx-auto mb-8">
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-white leading-[1.1] mb-6">
                Code. Build.
                <br />
                <span
                  className="inline-block"
                  style={{
                    background: "linear-gradient(135deg, #9945FF 0%, #14F195 50%, #9945FF 100%)",
                    backgroundSize: "200% 200%",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    animation: "gradient 3s ease infinite",
                  }}
                >
                  Ship on Solana.
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-white/50 max-w-2xl mx-auto">
                The developer platform that turns concepts into on-chain reality.
                No fluff. Just code that works.
              </p>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link
                href="/courses"
                className="group relative px-8 py-4 bg-white text-black rounded-full font-bold text-lg overflow-hidden transition-all hover:scale-105 active:scale-95"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <Play className="w-5 h-5 fill-black" />
                  Start Building
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-green-400 opacity-0 group-hover:opacity-20 transition-opacity" />
              </Link>
              <Link
                href="https://github.com/AbhijeetKakade2004/superteam-academy"
                target="_blank"
                className="group flex items-center gap-2 px-8 py-4 text-white/70 hover:text-white font-medium transition-colors"
              >
                <Github className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                View on GitHub
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>

            {/* Interactive Code Window with Typing Effect */}
            <motion.div variants={itemVariants} className="w-full max-w-4xl mx-auto mb-16">
              <div className="bg-zinc-950 rounded-2xl border border-white/10 overflow-hidden shadow-2xl shadow-purple-500/10">
                {/* Window Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/[0.02]">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/80 animate-pulse" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80 animate-pulse" style={{ animationDelay: "0.2s" }} />
                    <div className="w-3 h-3 rounded-full bg-green-500/80 animate-pulse" style={{ animationDelay: "0.4s" }} />
                  </div>
                  {/* Language Toggle */}
                  <div className="flex bg-white/5 rounded-lg p-1">
                    {["Anchor (Rust)", "TypeScript"].map((lang, idx) => (
                      <button
                        key={lang}
                        onClick={() => setActiveTab(idx)}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                          activeTab === idx
                            ? "bg-white/10 text-white shadow-sm"
                            : "text-white/40 hover:text-white/60"
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Code Content with Typing Effect */}
                <div className="p-6 font-mono text-sm leading-relaxed min-h-[200px]">
                  <pre className="text-white/80">
                    <code>{displayedCode}</code>
                    {isTyping && <span className="inline-block w-2 h-4 bg-green-400 animate-pulse ml-1 align-middle" />}
                  </pre>
                </div>
                {/* Terminal Line */}
                <div className="px-6 py-3 border-t border-white/5 bg-white/[0.02] flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-white/40 font-mono">$ anchor test</span>
                  <span className="text-xs text-green-400 font-mono">✓ All tests passed (3/3)</span>
                </div>
              </div>
            </motion.div>

            {/* Stats */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 max-w-4xl mx-auto">
              {[
                { value: "50+", label: "Hands-on Lessons", icon: Code2 },
                { value: "2.4k+", label: "Builders Learning", icon: Users },
                { value: "12M+", label: "XP Earned On-Chain", icon: Zap },
                { value: "100%", label: "Open Source", icon: Github },
              ].map((stat, idx) => (
                <div key={stat.label} className="text-center group">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <stat.icon className="w-4 h-4 text-white/30 group-hover:text-purple-400 transition-colors" />
                    <div className="text-3xl md:text-4xl font-bold text-white">{stat.value}</div>
                  </div>
                  <div className="text-xs text-white/40 uppercase tracking-wider">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* Why Academy Section - UNIQUE */}
        <div className="px-6 py-24 border-t border-white/5">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                Why developers choose{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-green-400">
                  Academy
                </span>
              </h2>
              <p className="text-white/50 text-lg max-w-2xl mx-auto">
                We don't just teach. We make you write real code that deploys to devnet.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: Target,
                  title: "Learn by Shipping",
                  description: "Every lesson ends with code on devnet. Not tutorials. Real transactions.",
                  color: "purple",
                },
                {
                  icon: Lock,
                  title: "Own Your Progress",
                  description: "Your XP, credentials, and certificates live on-chain as compressed NFTs. Forever.",
                  color: "green",
                },
                {
                  icon: Trophy,
                  title: "Prove Your Skills",
                  description: "Pass challenges to earn verifiable credentials that hiring managers actually check.",
                  color: "yellow",
                },
                {
                  icon: Globe,
                  title: "Global Community",
                  description: "Join 2,400+ developers from 40+ countries. Learn together, ship together.",
                  color: "blue",
                },
                {
                  icon: Rocket,
                  title: "Zero to dApp",
                  description: "Go from 'What's a PDA?' to deploying your first full-stack Solana app in 30 days.",
                  color: "purple",
                },
                {
                  icon: Sparkles,
                  title: "Always Current",
                  description: "Content updates with every Solana upgrade. Learn Token-2022, ZK Compression, and more.",
                  color: "green",
                },
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="group p-6 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/5 hover:border-purple-500/30 transition-all duration-300"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${feature.color === "purple" ? "bg-purple-500/20 text-purple-400" :
                      feature.color === "green" ? "bg-green-500/20 text-green-400" :
                        feature.color === "yellow" ? "bg-yellow-500/20 text-yellow-400" :
                          "bg-blue-500/20 text-blue-400"
                    }`}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-white/50 leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Tracks Section - UNIQUE */}
        <div className="px-6 py-24 border-t border-white/5">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                Choose Your Track
              </h2>
              <p className="text-white/50 text-lg">
                Three distinct paths. One goal: Ship production-grade Solana apps.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  emoji: "⚡",
                  title: "Core Protocol",
                  description: "Master accounts, PDAs, CPIs, and the runtime. The foundation everything builds on.",
                  courses: "4 courses",
                  hours: "24 hours",
                  color: "from-yellow-500 to-orange-500",
                },
                {
                  emoji: "🛠️",
                  title: "Anchor Masterclass",
                  description: "Build secure programs with Anchor. From macros to security best practices.",
                  courses: "5 courses",
                  hours: "32 hours",
                  color: "from-purple-500 to-pink-500",
                },
                {
                  emoji: "🚀",
                  title: "Full Stack dApps",
                  description: "Connect frontend to on-chain programs. Next.js, Phantom, and real user flows.",
                  courses: "3 courses",
                  hours: "20 hours",
                  color: "from-green-500 to-teal-500",
                },
              ].map((track, index) => (
                <motion.div
                  key={track.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="group relative"
                >
                  <div className={`absolute -inset-[1px] rounded-2xl bg-gradient-to-br ${track.color} opacity-0 group-hover:opacity-50 transition-opacity duration-500 blur-sm`} />
                  <div className="relative p-8 rounded-2xl border border-white/10 bg-zinc-950 h-full flex flex-col">
                    <div className="text-4xl mb-4">{track.emoji}</div>
                    <h3 className="text-2xl font-bold text-white mb-3">{track.title}</h3>
                    <p className="text-white/50 mb-6 flex-grow">{track.description}</p>
                    <div className="flex items-center gap-4 text-sm text-white/40 mb-6">
                      <span>{track.courses}</span>
                      <span>·</span>
                      <span>{track.hours}</span>
                    </div>
                    <Link
                      href="/courses"
                      className={`w-full py-3 px-4 rounded-xl font-medium text-center transition-all bg-white/5 hover:bg-white/10 border border-white/10`}
                    >
                      Explore Track
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Success Stories - UNIQUE */}
        <div className="px-6 py-24 border-t border-white/5">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                From Zero to{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-green-400">
                  First Deployment
                </span>
              </h2>
              <p className="text-white/50 text-lg">
                Real developers. Real progress. Real on-chain transactions.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  quote: "I tried 3 other Solana courses. This is the only one where I actually deployed something. The hands-on approach is unmatched.",
                  name: "Alex Chen",
                  role: "Former Web2 → Now Solana Dev",
                  achievement: "Shipped first program in 2 weeks",
                  avatar: "AC",
                },
                {
                  quote: "The XP system kept me accountable. 47-day streak later, I have 3 cNFT credentials and a job offer from a DeFi protocol.",
                  name: "Maria Silva",
                  role: "Smart Contract Developer",
                  achievement: "Earned 3 on-chain credentials",
                  avatar: "MS",
                },
                {
                  quote: "Finally, a course that teaches actual Solana patterns, not just basics. The ZK Compression module alone was worth it.",
                  name: "James Wilson",
                  role: "Protocol Engineer",
                  achievement: "Built production ZK app",
                  avatar: "JW",
                },
              ].map((story, index) => (
                <motion.div
                  key={story.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] hover:border-purple-500/30 transition-colors"
                >
                  <p className="text-white/70 text-sm leading-relaxed mb-6">
                    "{story.quote}"
                  </p>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-green-500 flex items-center justify-center text-white font-bold text-sm">
                      {story.avatar}
                    </div>
                    <div>
                      <div className="text-white font-medium">{story.name}</div>
                      <div className="text-white/40 text-sm">{story.role}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Trophy className="w-3 h-3 text-green-400" />
                    <span className="text-green-400">{story.achievement}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Tech Stack - UNIQUE */}
        <div className="px-6 py-16 border-t border-white/5">
          <div className="max-w-6xl mx-auto">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center text-sm text-white/30 uppercase tracking-widest mb-8"
            >
              Built with the Solana ecosystem
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex flex-wrap items-center justify-center gap-8 md:gap-16"
            >
              {[
                { name: "Solana", color: "text-purple-400" },
                { name: "Anchor", color: "text-green-400" },
                { name: "Metaplex", color: "text-pink-400" },
                { name: "Helius", color: "text-blue-400" },
                { name: "Squads", color: "text-yellow-400" },
              ].map((tech) => (
                <span
                  key={tech.name}
                  className={`text-lg font-semibold ${tech.color} opacity-60 hover:opacity-100 transition-opacity cursor-default`}
                >
                  {tech.name}
                </span>
              ))}
            </motion.div>
          </div>
        </div>

        {/* CTA Section - UNIQUE */}
        <div className="px-6 py-24 border-t border-white/5">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative p-12 rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-950 to-black text-center overflow-hidden"
            >
              {/* Background Glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-500/20 rounded-full blur-[100px]" />

              <div className="relative z-10">
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                  Ready to write your first
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-green-400">
                    Solana instruction?
                  </span>
                </h2>
                <p className="text-white/50 text-lg mb-8 max-w-xl mx-auto">
                  Join 2,400+ developers shipping on-chain. Start free. No wallet required.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                    href="/courses"
                    className="px-8 py-4 bg-white text-black rounded-full font-bold text-lg hover:scale-105 transition-transform"
                  >
                    Start Learning Free
                  </Link>
                  <a
                    href="https://github.com/AbhijeetKakade2004/superteam-academy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-8 py-4 text-white/70 hover:text-white font-medium transition-colors"
                  >
                    <Github className="w-5 h-5" />
                    Explore the Code
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
