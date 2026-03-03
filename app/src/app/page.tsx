import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CourseCard } from "@/components/course/CourseCard";
import { STATIC_COURSES } from "@/lib/courses";
import { Zap, Users, Award, BookOpen, ArrowRight, Shield, ChevronRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

const STATS = [
  { label: "Active Learners", value: "2,400+", icon: Users },
  { label: "Courses Available", value: "12", icon: BookOpen },
  { label: "XP Distributed", value: "1.2M", icon: Zap },
  { label: "Credentials Issued", value: "300+", icon: Award },
];

const TRACKS = [
  {
    id: "anchor",
    title: "Anchor Development",
    desc: "Build Solana programs with the Anchor framework. Go from hello world to production DeFi.",
    color: "from-purple-500/20 to-purple-500/5",
    border: "border-purple-500/30",
    accent: "text-purple-400",
    courses: 3,
  },
  {
    id: "defi",
    title: "DeFi & Protocols",
    desc: "Understand AMMs, lending protocols, and yield strategies on Solana's DeFi ecosystem.",
    color: "from-blue-500/20 to-blue-500/5",
    border: "border-blue-500/30",
    accent: "text-blue-400",
    courses: 2,
  },
  {
    id: "nft",
    title: "NFTs & Metaplex",
    desc: "Mint collections, build marketplaces, and implement soulbound credentials with Metaplex Core.",
    color: "from-pink-500/20 to-pink-500/5",
    border: "border-pink-500/30",
    accent: "text-pink-400",
    courses: 2,
  },
];

export default function HomePage() {
  const featuredCourses = STATIC_COURSES.filter((c) => c.isActive && !c.startingSoon).slice(0, 3);

  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero */}
      <section className="relative pt-20 pb-32 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,hsl(263_80%_25%/0.4),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_40%_at_80%_60%,hsl(162_100%_30%/0.1),transparent)]" />

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-full px-4 py-1.5 text-sm text-[hsl(var(--muted-foreground))] mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Live on Solana Devnet — Program ACADBR...3ucf
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-heading text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-none mb-6"
          >
            Learn Solana,{" "}
            <span className="gradient-text block">Earn Onchain</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl text-[hsl(var(--muted-foreground))] max-w-2xl mx-auto mb-10"
          >
            The decentralized learning platform by Superteam Brazil. Complete courses, earn soulbound XP tokens, and receive verifiable NFT credentials — all on Solana.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              href="/courses"
              className="flex items-center justify-center gap-2 bg-[hsl(var(--primary))] text-white font-semibold px-8 py-3.5 rounded-xl hover:opacity-90 transition-all hover:shadow-[var(--glow-purple)] group"
            >
              Explore Courses
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/leaderboard"
              className="flex items-center justify-center gap-2 bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-[hsl(var(--foreground))] font-semibold px-8 py-3.5 rounded-xl hover:border-[hsl(var(--primary)/0.5)] transition-all"
            >
              View Leaderboard
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-4 border-y border-[hsl(var(--border))] bg-[hsl(var(--card)/0.4)]">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6">
          {STATS.map(({ label, value, icon: Icon }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="text-center"
            >
              <div className="inline-flex w-10 h-10 rounded-xl bg-[hsl(var(--accent))] items-center justify-center mb-3">
                <Icon className="w-5 h-5 text-purple-300" />
              </div>
              <p className="font-heading font-bold text-2xl sm:text-3xl">{value}</p>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">{label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-4">
              How Superteam Academy Works
            </h2>
            <p className="text-[hsl(var(--muted-foreground))] max-w-xl mx-auto">
              Every achievement is verifiable onchain. No intermediaries — just you, your wallet, and the Solana program.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                title: "Enroll & Learn",
                desc: "Connect your Solana wallet, enroll in a course, and complete lessons with real code challenges.",
                icon: BookOpen,
                color: "text-purple-400",
              },
              {
                step: "02",
                title: "Earn XP Onchain",
                desc: "Each completed lesson mints soulbound XP tokens (Token-2022) directly to your wallet — verifiable by anyone.",
                icon: Zap,
                color: "text-green-400",
              },
              {
                step: "03",
                title: "Receive Credential NFT",
                desc: "Complete a track to receive a Metaplex Core credential NFT — a permanent, upgradeable proof of expertise.",
                icon: Shield,
                color: "text-blue-400",
              },
            ].map(({ step, title, desc, icon: Icon, color }) => (
              <div key={step} className="glass rounded-xl p-6 relative overflow-hidden group hover:border-[hsl(var(--primary)/0.4)] transition-colors">
                <div className="absolute top-4 right-4 font-mono text-4xl font-bold text-[hsl(var(--muted)/0.5)] group-hover:text-[hsl(var(--muted))] transition-colors">{step}</div>
                <div className={`w-10 h-10 rounded-xl bg-[hsl(var(--muted))] flex items-center justify-center mb-4 ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-heading font-semibold text-lg mb-2">{title}</h3>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Learning Paths */}
      <section className="py-20 px-4 bg-[hsl(var(--card)/0.3)]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-4">
              Learning Paths
            </h2>
            <p className="text-[hsl(var(--muted-foreground))] max-w-xl mx-auto">
              Structured tracks to master every layer of the Solana ecosystem
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {TRACKS.map((track) => (
              <Link
                key={track.id}
                href={`/courses?track=${track.id}`}
                className={`glass rounded-xl p-6 border ${track.border} bg-gradient-to-b ${track.color} hover:-translate-y-1 transition-all group`}
              >
                <h3 className={`font-heading font-bold text-lg mb-2 ${track.accent}`}>{track.title}</h3>
                <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">{track.desc}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[hsl(var(--muted-foreground))]">{track.courses} courses</span>
                  <ChevronRight className={`w-4 h-4 ${track.accent} group-hover:translate-x-1 transition-transform`} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="font-heading text-3xl font-bold mb-1">Featured Courses</h2>
              <p className="text-[hsl(var(--muted-foreground))]">Start learning today</p>
            </div>
            <Link
              href="/courses"
              className="flex items-center gap-1 text-[hsl(var(--primary))] font-semibold text-sm hover:gap-2 transition-all"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
