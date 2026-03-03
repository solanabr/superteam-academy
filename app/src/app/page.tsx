"use client";

import Link from "next/link";
import { useI18n } from "../i18n/I18nProvider";
import { MessageKey } from "../i18n/messages/en";
import { motion } from "framer-motion";
import {
  Zap,
  Trophy,
  Gamepad2,
  Code2,
  Globe,
  Lock,
  ArrowRight,
  Star,
  Users,
  BookOpen,
  Flame,
  CheckCircle2,
  ChevronRight,
  Github,
  Twitter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AnimatedCounter } from "@/components/ui/animated-counter";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const FEATURES = [
  {
    icon: Zap,
    titleKey: "home.features.progress.title" as MessageKey,
    descKey: "home.features.progress.desc" as MessageKey,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: Trophy,
    titleKey: "home.features.credentials.title" as MessageKey,
    descKey: "home.features.credentials.desc" as MessageKey,
    color: "text-secondary",
    bg: "bg-secondary/10",
  },
  {
    icon: Gamepad2,
    titleKey: "home.features.gamified.title" as MessageKey,
    descKey: "home.features.gamified.desc" as MessageKey,
    color: "text-accent",
    bg: "bg-accent/10",
  },
  {
    icon: Code2,
    titleKey: "home.features.interactive.title" as MessageKey,
    descKey: "home.features.interactive.desc" as MessageKey,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: Globe,
    titleKey: "home.features.multilingual.title" as MessageKey,
    descKey: "home.features.multilingual.desc" as MessageKey,
    color: "text-secondary",
    bg: "bg-secondary/10",
  },
  {
    icon: Lock,
    titleKey: "home.features.open.title" as MessageKey,
    descKey: "home.features.open.desc" as MessageKey,
    color: "text-accent",
    bg: "bg-accent/10",
  },
];

const STATS = [
  { value: 100, labelKey: "home.stats.lessons" as MessageKey, suffix: "+" },
  { value: 10000, labelKey: "home.stats.xp" as MessageKey, suffix: "+" },
  { value: 3, labelKey: "home.stats.tracks" as MessageKey, suffix: "" },
  { value: 3, labelKey: "home.stats.languages" as MessageKey, suffix: "" },
];

const TRACKS = [
  {
    nameKey: "home.tracks.fundamentals.title" as MessageKey,
    descKey: "home.tracks.fundamentals.desc" as MessageKey,
    difficultyKey: "home.tracks.difficulty.beginner" as MessageKey,
    color: "from-emerald-400 to-green-500",
    border: "border-emerald-500/20 hover:border-emerald-400/50",
    glow: "hover:shadow-[0_0_30px_rgba(52,211,153,0.15)]",
    lessons: 8,
    xp: 2000,
    icon: BookOpen,
  },
  {
    nameKey: "home.tracks.anchor.title" as MessageKey,
    descKey: "home.tracks.anchor.desc" as MessageKey,
    difficultyKey: "home.tracks.difficulty.intermediate" as MessageKey,
    color: "from-violet-400 to-purple-500",
    border: "border-violet-500/20 hover:border-violet-400/50",
    glow: "hover:shadow-[0_0_30px_rgba(139,92,246,0.15)]",
    lessons: 12,
    xp: 3500,
    icon: Code2,
  },
  {
    nameKey: "home.tracks.defi.title" as MessageKey,
    descKey: "home.tracks.defi.desc" as MessageKey,
    difficultyKey: "home.tracks.difficulty.advanced" as MessageKey,
    color: "from-cyan-400 to-blue-500",
    border: "border-cyan-500/20 hover:border-cyan-400/50",
    glow: "hover:shadow-[0_0_30px_rgba(34,211,238,0.15)]",
    lessons: 10,
    xp: 4000,
    icon: Zap,
  },
];

const TESTIMONIALS = [
  {
    name: "Maria S.",
    roleKey: "home.testimonials.1.role" as MessageKey,
    avatar: "MS",
    textKey: "home.testimonials.1.text" as MessageKey,
    rating: 5,
  },
  {
    name: "Pedro L.",
    roleKey: "home.testimonials.2.role" as MessageKey,
    avatar: "PL",
    textKey: "home.testimonials.2.text" as MessageKey,
    rating: 5,
  },
  {
    name: "Carlos R.",
    roleKey: "home.testimonials.3.role" as MessageKey,
    avatar: "CR",
    textKey: "home.testimonials.3.text" as MessageKey,
    rating: 5,
  },
];

export default function HomePage() {
  const { t } = useI18n();

  return (
    <>
      {/* ── Hero ──────────────────────────────── */}
      <section className="relative overflow-hidden bg-background noise-bg border-b border-border">
        {/* Abstract Geometry Elements */}
        <div className="absolute right-[10%] top-[20%] w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] rounded-full mix-blend-screen opacity-20 blur-[80px] bg-primary pointer-events-none" />
        <div className="absolute left-[5%] bottom-[-10%] w-[30vw] h-[30vw] max-w-[400px] max-h-[400px] rounded-full mix-blend-screen opacity-10 blur-[60px] bg-accent pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-32 lg:pt-40">
          <motion.div
            className="flex flex-col items-center text-center"
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.1 } },
            }}
          >
            {/* Minimalist Badge */}
            <motion.div variants={fadeIn} custom={0}>
              <div className="inline-flex items-center gap-2 border border-border bg-black/50 px-3 py-1 text-xs font-mono uppercase tracking-widest text-primary mb-8 rounded-none">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping bg-primary opacity-75" />
                  <span className="relative inline-flex h-2 w-2 bg-primary" />
                </span>
                {t("home.hero.badge")}
              </div>
            </motion.div>

            {/* Brutalist Title */}
            <motion.h1
              variants={fadeIn}
              custom={1}
              className="mx-auto max-w-5xl text-5xl font-display font-extrabold uppercase leading-[0.9] tracking-tighter sm:text-7xl md:text-8xl lg:text-[100px]"
            >
              {t("home.hero.title1")} <br />
              <span className="text-primary">
                {t("home.hero.title2")}
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={fadeIn}
              custom={2}
              className="mx-auto mt-8 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg font-mono lowercase"
            >
              &gt; {t("home.hero.subtitle")}
            </motion.p>

            {/* CTAs */}
            <motion.div
              variants={fadeIn}
              custom={3}
              className="mt-12 flex flex-col items-center justify-center gap-6 sm:flex-row w-full max-w-md mx-auto sm:max-w-none"
            >
              <Button asChild size="lg" className="rounded-none bg-primary text-black hover:bg-white border-2 border-primary font-bold uppercase tracking-widest px-8 py-6 text-sm glow-neon transition-all">
                <Link href="/courses">
                  {t("nav.courses")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-none border-2 border-primary/50 bg-black hover:bg-primary/20 text-primary font-bold uppercase tracking-widest px-8 py-6 text-sm transition-all">
                <Link href="/welcome">
                  Take Assessment
                  <Zap className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-none border-2 border-border bg-black hover:bg-border hover:text-white font-bold uppercase tracking-widest px-8 py-6 text-sm transition-all hidden sm:flex">
                <Link href="/dashboard">{t("nav.dashboard")}</Link>
              </Button>
            </motion.div>

            {/* Stats (Inline, Cyberpunk style) */}
            <motion.div
              variants={fadeIn}
              custom={4}
              className="mx-auto mt-20 grid w-full max-w-4xl grid-cols-2 lg:grid-cols-4 border-y border-border divide-x divide-border bg-black/40 backdrop-blur-sm"
            >
              {STATS.map((stat) => (
                <div
                  key={stat.labelKey}
                  className="px-4 py-8 text-center flex flex-col justify-center items-center"
                >
                  <p className="text-4xl font-display font-bold text-white">
                    <AnimatedCounter
                      value={stat.value}
                      suffix={stat.suffix}
                      duration={1500}
                    />
                  </p>
                  <p className="mt-2 text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
                    {"//"} {t(stat.labelKey)}
                  </p>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Features ──────────────────────────── */}
      <section className="bg-background noise-bg relative">
        <div className="absolute inset-0 bg-gradient-to-b from-black to-transparent opacity-80" />
        <div className="relative mx-auto max-w-7xl px-6 py-32">
          <div className="flex flex-col md:flex-row gap-12 justify-between items-end mb-16">
            <div className="max-w-2xl">
              <div className="inline-block border border-border px-3 py-1 text-xs font-mono uppercase tracking-widest text-muted-foreground mb-6">
                {t("home.features.badge")}
              </div>
              <h2 className="text-4xl font-display font-bold uppercase sm:text-6xl text-white">
                {t("home.features.title1")} <br />
                <span className="text-primary">{t("home.features.title2")}</span>
              </h2>
            </div>
            <p className="max-w-md text-sm font-mono text-muted-foreground">
              {t("home.features.subtitle")}
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.titleKey}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="brutalist-card p-8 group"
              >
                <div className="mb-8 flex h-12 w-12 items-center justify-center border-2 border-border group-hover:border-primary transition-colors bg-black">
                  <feature.icon className={`h-5 w-5 ${feature.color.replace('text-', 'text-').replace('primary', 'primary').replace('secondary', 'white').replace('accent', 'white')}`} />
                </div>
                <h3 className="text-xl font-display font-bold uppercase tracking-wide text-white mb-3">
                  {t(feature.titleKey)}
                </h3>
                <p className="text-sm font-mono leading-relaxed text-muted-foreground">
                  {t(feature.descKey)}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Learning Tracks ────────────────────── */}
      <section className="bg-background border-y border-border">
        <div className="mx-auto max-w-7xl px-6 py-32">
          <div className="flex flex-col md:flex-row gap-12 justify-between items-end mb-16">
            <div className="max-w-2xl">
              <div className="inline-block border border-primary bg-primary/10 px-3 py-1 text-xs font-mono uppercase tracking-widest text-primary mb-6">
                {t("home.tracks.badge")}
              </div>
              <h2 className="text-4xl font-display font-bold uppercase sm:text-6xl text-white">
                {t("home.tracks.title1")} <br />
                <span className="text-primary">{t("home.tracks.title2")}</span>
              </h2>
            </div>
            <p className="max-w-md text-sm font-mono text-muted-foreground">
              {t("home.tracks.subtitle")}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {TRACKS.map((track, i) => (
              <motion.div
                key={track.nameKey}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
              >
                <Link
                  href="/courses"
                  className="brutalist-card group relative flex flex-col p-8 transition-colors hover:border-primary block border-2"
                >
                  <div className="flex items-center justify-between mb-8">
                    <div className="border border-border bg-black px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground group-hover:text-primary group-hover:border-primary transition-colors">
                      {t(track.difficultyKey)}
                    </div>
                    <div className="flex items-center gap-4 text-[10px] font-mono uppercase text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        {track.lessons}
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        {track.xp.toLocaleString('en-US')} XP
                      </span>
                    </div>
                  </div>

                  <div className="mb-6 flex h-14 w-14 items-center justify-center border-2 border-border bg-black group-hover:border-primary transition-colors">
                    <track.icon className="h-6 w-6 text-white group-hover:text-primary" />
                  </div>

                  <h3 className="text-2xl font-display font-bold uppercase tracking-wide text-white mb-3 group-hover:text-primary transition-colors">
                    {t(track.nameKey)}
                  </h3>

                  <p className="text-sm font-mono leading-relaxed text-muted-foreground flex-1 mb-8">
                    {t(track.descKey)}
                  </p>

                  <div className="mt-auto flex items-center text-xs font-mono font-bold uppercase tracking-widest text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    &gt; {t("home.tracks.viewCourses")}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ───────────────────────── */}
      <section className="bg-background relative py-32 border-b border-border">
        <div className="absolute inset-0 noise-bg opacity-50 mix-blend-overlay" />
        <div className="relative mx-auto max-w-7xl px-6">
          <div className="text-center mb-24">
            <div className="inline-block border border-border bg-black px-3 py-1 text-xs font-mono uppercase tracking-widest text-muted-foreground mb-6">
              {t("home.process.badge")}
            </div>
            <h2 className="text-4xl font-display font-bold uppercase sm:text-6xl text-white">
              {t("home.process.title1")} <br />
              <span className="text-transparent text-stroke-primary text-stroke-2">
                {t("home.process.title2")}
              </span>
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-4 relative">
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-[28px] left-[10%] right-[10%] h-0.5 bg-border z-0" />

            {[
              {
                step: "01",
                titleKey: "home.process.step1.title" as MessageKey,
                descKey: "home.process.step1.desc" as MessageKey,
                icon: Lock,
              },
              {
                step: "02",
                titleKey: "home.process.step2.title" as MessageKey,
                descKey: "home.process.step2.desc" as MessageKey,
                icon: BookOpen,
              },
              {
                step: "03",
                titleKey: "home.process.step3.title" as MessageKey,
                descKey: "home.process.step3.desc" as MessageKey,
                icon: Code2,
              },
              {
                step: "04",
                titleKey: "home.process.step4.title" as MessageKey,
                descKey: "home.process.step4.desc" as MessageKey,
                icon: Trophy,
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.4 }}
                className="relative text-center z-10 flex flex-col items-center group"
              >
                <div className="mb-6 flex h-14 w-14 items-center justify-center border-2 border-border bg-black group-hover:border-primary group-hover:text-primary transition-all duration-300">
                  <item.icon className="h-6 w-6 text-muted-foreground group-hover:text-primary" />
                </div>
                <div className="text-xs font-mono font-bold tracking-[0.3em] text-primary mb-4 border border-primary/30 px-2 py-1 bg-primary/5">
                  STEP {"//"} {item.step}
                </div>
                <h3 className="text-lg font-display font-bold uppercase text-white mb-3">
                  {t(item.titleKey)}
                </h3>
                <p className="text-sm font-mono text-muted-foreground leading-relaxed">
                  {t(item.descKey)}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ───────────────────────── */}
      <section className="bg-background py-32 border-b border-border noise-bg relative">
        <div className="absolute right-0 bottom-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-6">
          <div className="flex flex-col md:flex-row gap-12 justify-between items-end mb-16">
            <div className="max-w-2xl">
              <div className="inline-block border border-border bg-black px-3 py-1 text-xs font-mono uppercase tracking-widest text-muted-foreground mb-6">
                {t("home.testimonials.badge")}
              </div>
              <h2 className="text-4xl font-display font-bold uppercase sm:text-6xl text-white">
                {t("home.testimonials.title1")} <br />
                <span className="text-primary">{t("home.testimonials.title2")}</span>
              </h2>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((testimonial, i) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="brutalist-card p-8 flex flex-col justify-between"
              >
                <div>
                  <div className="flex gap-1 mb-6">
                    {Array.from({ length: testimonial.rating }).map((_, idx) => (
                      <Star
                        key={idx}
                        className="h-4 w-4 fill-primary text-primary"
                      />
                    ))}
                  </div>
                  <p className="text-sm font-mono leading-relaxed text-muted-foreground mb-8">
                    &ldquo;{t(testimonial.textKey)}&rdquo;
                  </p>
                </div>
                <div className="flex items-center gap-4 pt-6 border-t border-border/50">
                  <div className="flex h-10 w-10 items-center justify-center border border-border bg-black text-xs font-mono font-bold text-white">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-display font-bold uppercase text-white">{testimonial.name}</p>
                    <p className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest">
                      {t(testimonial.roleKey)}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────── */}
      <section className="bg-primary text-black relative overflow-hidden py-32">
        <div className="absolute inset-0 bg-grid-black/[0.05] bg-[size:32px_32px]" />

        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="mx-auto mb-10 flex h-24 w-24 items-center justify-center border-4 border-black bg-white shadow-[8px_8px_0_0_#000]">
              <Flame className="h-12 w-12 text-black" />
            </div>
            <h2 className="text-5xl font-display font-bold uppercase sm:text-7xl mb-6">
              {t("home.cta.ready")}{" "}
              <br className="max-md:hidden" />
              <span className="text-stroke-black text-stroke-2 text-transparent">
                {t("home.cta.build")}
              </span>
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-base font-mono font-medium sm:text-lg mb-12">
              &gt; {t("home.cta.subtitle")}
            </p>
            <div className="flex flex-col items-center justify-center gap-6 sm:flex-row">
              <Button asChild size="lg" className="rounded-none bg-black text-white hover:bg-black/80 border-2 border-black font-bold uppercase tracking-widest px-10 py-8 text-sm transition-all shadow-[8px_8px_0_0_rgba(0,0,0,0.2)] hover:translate-y-1 hover:shadow-[4px_4px_0_0_rgba(0,0,0,0.2)]">
                <Link href="/courses">
                  {t("home.hero.startLearning")}
                  <ArrowRight className="ml-3 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-none border-2 border-black bg-transparent text-black hover:bg-black hover:text-white font-bold uppercase tracking-widest px-10 py-8 text-sm transition-all shadow-[8px_8px_0_0_rgba(0,0,0,0.2)] hover:translate-y-1 hover:shadow-[4px_4px_0_0_rgba(0,0,0,0.2)]">
                <a
                  href="https://github.com/solanabr/superteam-academy"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Github className="mr-3 h-5 w-5" />
                  {t("home.hero.viewSource")}
                </a>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────── */}
      <footer className="bg-black border-t-4 border-primary/20">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="grid gap-12 lg:grid-cols-4">
            {/* Brand */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center bg-primary text-black">
                  <Zap className="h-5 w-5" />
                </div>
                <span className="font-display font-bold uppercase tracking-widest text-lg text-white">Superteam Academy</span>
              </div>
              <p className="mt-6 max-w-md font-mono text-sm leading-relaxed text-muted-foreground">
                {t("home.footer.desc")}
              </p>
              <div className="mt-8 flex gap-4">
                <a
                  href="https://github.com/solanabr/superteam-academy"
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-12 w-12 items-center justify-center border-2 border-border text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/10 transition-all"
                >
                  <Github className="h-5 w-5" />
                </a>
                <a
                  href="https://x.com/SuperteamBR"
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-12 w-12 items-center justify-center border-2 border-border text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/10 transition-all"
                >
                  <Twitter className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Platform */}
            <div>
              <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-white mb-6">
                {"//"} {t("home.footer.platform")}
              </h4>
              <nav className="flex flex-col gap-4">
                {[
                  { labelKey: "nav.courses", href: "/courses" },
                  { labelKey: "nav.dashboard", href: "/dashboard" },
                  { labelKey: "nav.leaderboard", href: "/leaderboard" },
                  { labelKey: "nav.profile", href: "/profile" },
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-sm font-mono text-muted-foreground hover:text-primary transition-colors hover:pl-2"
                  >
                    {t(link.labelKey as MessageKey)}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-white mb-6">
                {"//"} {t("home.footer.resources")}
              </h4>
              <nav className="flex flex-col gap-4">
                {[
                  {
                    label: "GitHub",
                    href: "https://github.com/solanabr/superteam-academy",
                    external: true,
                  },
                  {
                    label: "Solana Docs",
                    href: "https://solana.com/docs",
                    external: true,
                  },
                  {
                    label: "Anchor Book",
                    href: "https://www.anchor-lang.com/",
                    external: true,
                  },
                  {
                    label: "Discord",
                    href: "https://discord.gg/superteambrasil",
                    external: true,
                  },
                ].map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    target={link.external ? "_blank" : undefined}
                    rel={link.external ? "noreferrer" : undefined}
                    className="flex items-center gap-2 text-sm font-mono text-muted-foreground hover:text-primary transition-colors hover:pl-2"
                  >
                    {link.label}
                    {link.external && <ArrowRight className="h-3 w-3 -rotate-45" />}
                  </a>
                ))}
              </nav>
            </div>
          </div>

          <div className="mt-16 flex flex-col items-center justify-between gap-6 border-t border-border pt-8 md:flex-row">
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
              {t("home.footer.copyright")}
            </p>
            <div className="flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-widest text-primary border border-primary/30 px-3 py-1 bg-primary/5">
              <CheckCircle2 className="h-3 w-3" />
              {t("home.footer.opensource")}
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
