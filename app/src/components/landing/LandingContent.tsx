"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import {
  GraduationCap,
  Zap,
  Trophy,
  Shield,
  BookOpen,
  UserPlus,
  Award,
  ArrowRight,
  Sparkles,
  CheckCircle,
  Layers,
  ImageIcon,
  Cpu,
  Quote,
  Star,
  Flame,
} from "lucide-react";
import { StartLearningButton } from "@/components/landing/StartLearningButton";
import type { SanityCourse } from "@/lib/sanity/queries";
import { CourseCard, CourseCardData } from "@/components/courses/CourseCard";
import { motion, Variants } from "framer-motion";
import { SpotlightCard } from "@/components/shared/SpotlightCard";

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export function LandingContent({ featuredCourses }: { featuredCourses: SanityCourse[] }) {
  const t = useTranslations("landing");
  const tPaths = useTranslations("learningPaths");

  return (
    <div className="flex flex-col">
      {/* Hero — Asymmetric Layout */}
      <section className="relative overflow-hidden py-20 sm:py-28 lg:py-32">
        {/* Clean gradient background — single soft glow from top */}
        <div className="absolute inset-0 bg-mesh opacity-60" />
        <div className="absolute inset-0 bg-grid opacity-40" />

        {/* Single ambient orb — top center */}
        <div className="pointer-events-none absolute left-1/2 -top-40 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-primary/10 blur-[140px]" />

        <div className="relative mx-auto max-w-7xl px-4">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Left — Text Content */}
            <motion.div
              className="space-y-8 text-center lg:text-left"
              variants={container}
              initial="hidden"
              animate="show"
            >
              {/* Solana badge */}
              <motion.div variants={item} className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary backdrop-blur-sm">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                {t("hero.badge")}
              </motion.div>

              <motion.h1 variants={item} className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-6xl !leading-[1.1]">
                <span className="gradient-text">{t("hero.title")}</span>
              </motion.h1>

              <motion.p variants={item} className="max-w-lg text-lg text-muted-foreground sm:text-xl lg:mx-0 mx-auto">
                {t("hero.subtitle")}
              </motion.p>

              <motion.div variants={item} className="flex flex-col items-center gap-4 sm:flex-row lg:justify-start justify-center">
                <StartLearningButton />
                <Link href="/courses">
                  <Button
                    variant="outline"
                    size="lg"
                    className="gap-2 border-white/20 text-white hover:bg-white/10 hover:text-white backdrop-blur-sm transition-all"
                  >
                    {t("cta.button")}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </Link>
              </motion.div>

              {/* Social proof */}
              <motion.div variants={item} className="flex items-center gap-3 lg:justify-start justify-center">
                <div className="flex -space-x-2">
                  {["🟢", "🔵", "🟣", "🟠", "🔴"].map((emoji, i) => (
                    <div key={i} className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs">
                      {emoji}
                    </div>
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  Join <span className="font-semibold text-foreground">500+</span> Solana developers
                </span>
              </motion.div>
            </motion.div>

            {/* Right — Product Mockup */}
            <motion.div
              initial={{ opacity: 0, x: 40, rotate: 2 }}
              animate={{ opacity: 1, x: 0, rotate: 0 }}
              transition={{ duration: 0.8, delay: 0.3, type: "spring" }}
              className="hidden lg:block"
            >
              <div className="relative rounded-2xl border border-white/10 bg-card/80 p-4 backdrop-blur-xl shadow-2xl shadow-black/40">
                {/* Fake browser chrome */}
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-red-500/60" />
                    <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
                    <div className="h-3 w-3 rounded-full bg-green-500/60" />
                  </div>
                  <div className="flex-1 rounded-md bg-muted/50 px-3 py-1 text-[10px] text-muted-foreground font-mono">
                    academy.superteam.fun/courses
                  </div>
                </div>
                {/* Simulated lesson interface */}
                <div className="grid grid-cols-5 gap-3">
                  {/* Sidebar simulation */}
                  <div className="col-span-2 space-y-2 rounded-lg bg-muted/30 p-3">
                    <div className="flex items-center gap-2 rounded-md bg-primary/10 px-2 py-1.5">
                      <CheckCircle className="h-3 w-3 text-primary" />
                      <span className="text-[10px] font-medium text-primary">Intro to PDAs</span>
                    </div>
                    <div className="flex items-center gap-2 px-2 py-1.5">
                      <CheckCircle className="h-3 w-3 text-primary/50" />
                      <span className="text-[10px] text-muted-foreground">Account Model</span>
                    </div>
                    <div className="flex items-center gap-2 px-2 py-1.5">
                      <Cpu className="h-3 w-3 text-muted-foreground/50" />
                      <span className="text-[10px] text-muted-foreground">Token-2022</span>
                    </div>
                  </div>
                  {/* Code editor simulation */}
                  <div className="col-span-3 space-y-2 rounded-lg bg-black/40 p-3 font-mono text-[9px] leading-relaxed">
                    <div><span className="text-secondary">use</span> <span className="text-primary">anchor_lang</span>::prelude::*;</div>
                    <div className="mt-1"><span className="text-secondary">#[program]</span></div>
                    <div><span className="text-secondary">pub mod</span> <span className="text-primary">academy</span> {"{"}</div>
                    <div className="pl-3"><span className="text-secondary">pub fn</span> <span className="text-accent">enroll</span>(ctx) {"{"}</div>
                    <div className="pl-6 text-muted-foreground">// Your code here</div>
                    <div className="pl-3">{"}"}</div>
                    <div>{"}"}</div>
                  </div>
                </div>
                {/* XP indicator */}
                <div className="mt-3 flex items-center justify-between rounded-lg bg-accent/5 border border-accent/20 px-3 py-2">
                  <span className="text-[10px] font-semibold text-accent flex items-center gap-1">
                    <Zap className="h-3 w-3" /> +50 XP earned
                  </span>
                  <span className="text-[10px] text-primary font-medium">✓ Tests Passed</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats — Bento Grid */}
      <section className="border-y border-border/40 py-12">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {(
              [
                { valueKey: "coursesValue" as const, labelKey: "courses" as const, icon: BookOpen, featured: true },
                { valueKey: "lessonsValue" as const, labelKey: "lessons" as const, icon: Layers, featured: false },
                { valueKey: "challengesValue" as const, labelKey: "challenges" as const, icon: Cpu, featured: false },
                { valueKey: "languagesValue" as const, labelKey: "languages" as const, icon: GraduationCap, featured: false },
              ]
            ).map(({ valueKey, labelKey, icon: StatIcon, featured }, idx) => (
              <motion.div
                key={labelKey}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className={`flex flex-col items-center justify-center rounded-xl p-6 text-center border transition-colors ${featured
                  ? "border-primary/30 bg-primary/5 col-span-2 sm:col-span-1 sm:row-span-1"
                  : "border-white/5 bg-card/50"
                  } hover:border-primary/30`}
              >
                <StatIcon className={`mb-3 h-5 w-5 ${featured ? "text-primary" : "text-muted-foreground"}`} aria-hidden="true" />
                <span className={`text-3xl font-bold sm:text-4xl ${featured ? "gradient-text" : "text-foreground"}`}>
                  {t(`stats.${valueKey}`)}
                </span>
                <span className="mt-1 text-sm font-medium text-muted-foreground">
                  {t(`stats.${labelKey}`)}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">
              {t("features.title")}
            </h2>
          </div>
          <motion.div
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
          >
            {[
              { icon: Shield, key: "onChain" as const, gradient: "from-primary/20 to-primary/5", borderHover: "hover:border-primary/50", glowHover: "group-hover:shadow-[0_0_30px_rgba(20,241,149,0.15)]" },
              { icon: Zap, key: "soulboundXP" as const, gradient: "from-accent/20 to-accent/5", borderHover: "hover:border-accent/50", glowHover: "group-hover:shadow-[0_0_30px_rgba(255,184,0,0.15)]" },
              { icon: Trophy, key: "nftCredentials" as const, gradient: "from-secondary/20 to-secondary/5", borderHover: "hover:border-secondary/50", glowHover: "group-hover:shadow-[0_0_30px_rgba(153,69,255,0.15)]" },
              { icon: GraduationCap, key: "openSource" as const, gradient: "from-primary/20 to-primary/5", borderHover: "hover:border-primary/50", glowHover: "group-hover:shadow-[0_0_30px_rgba(20,241,149,0.15)]" },
            ].map(({ icon: Icon, key, gradient, borderHover, glowHover }, idx) => (
              <motion.div variants={item} key={key} className="h-full">
                <SpotlightCard
                  className="h-full p-6 text-left group"
                  variant={idx % 2 === 0 ? "primary" : "secondary"}
                >
                  <div className={`mb-4 inline-flex rounded-lg bg-gradient-to-br ${gradient} p-3 ring-1 ring-white/10 group-hover:ring-white/20 transition-all`}>
                    <Icon className="h-6 w-6 text-foreground group-hover:text-white transition-colors" aria-hidden="true" />
                  </div>
                  <h3 className="mb-2 text-lg font-bold tracking-tight-premium group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-white/70 transition-all">
                    {t(`features.${key}.title`)}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground group-hover:text-muted-foreground/90">
                    {t(`features.${key}.description`)}
                  </p>
                </SpotlightCard>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How it Works */}
      <section className="border-t border-border/40 bg-muted/30 py-24 relative overflow-hidden">
        {/* subtle grid background */}
        <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">
              {t("howItWorks.title")}
            </h2>
          </div>
          <div className="relative grid gap-10 sm:grid-cols-2 lg:grid-cols-4 pt-4">
            {/* Connecting line (desktop only) */}
            <div className="absolute left-0 right-0 top-[40%] -translate-y-1/2 hidden h-0.5 bg-gradient-to-r from-transparent via-primary/20 to-transparent lg:block" />

            {(
              [
                { step: "step1" as const, icon: UserPlus, reward: "+ 10 XP" },
                { step: "step2" as const, icon: BookOpen, reward: "Unlock Paths" },
                { step: "step3" as const, icon: CheckCircle, reward: "+ 500 XP" },
                { step: "step4" as const, icon: Award, reward: "NFT Mint" },
              ] as const
            ).map(({ step, icon: StepIcon, reward }, idx) => (
              <div key={step} className="relative text-center group h-full">
                <SpotlightCard variant={idx % 2 === 0 ? "primary" : "accent"} className="p-8 h-full flex flex-col items-center justify-center relative z-10 bg-card/80 backdrop-blur-md overflow-visible mt-2">
                  <div className="absolute -top-4 -right-4 rounded-full bg-secondary/10 border border-secondary/30 px-4 py-1.5 text-xs font-bold text-secondary shadow-[0_0_15px_rgba(20,241,149,0.2)] rotate-12 group-hover:rotate-0 transition-all duration-300">
                    <span className="flex items-center gap-1.5">
                      <Zap className="h-3 w-3" />
                      {reward}
                    </span>
                  </div>

                  <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/90 to-primary/60 text-primary-foreground shadow-[0_0_20px_rgba(20,241,149,0.3)] group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(20,241,149,0.5)] transition-all duration-300 border border-white/10">
                    <StepIcon className="h-9 w-9" aria-hidden="true" />
                  </div>

                  <div className="absolute -left-3 top-1/2 -translate-y-1/2 hidden lg:flex h-8 w-8 items-center justify-center rounded-full bg-secondary/20 border border-secondary/40 text-sm font-bold text-secondary shadow-lg z-20">
                    {idx + 1}
                  </div>

                  {/* For mobile layout */}
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex lg:hidden h-8 w-8 items-center justify-center rounded-full bg-secondary/20 border border-secondary/40 text-sm font-bold text-secondary shadow-lg z-20">
                    {idx + 1}
                  </div>

                  <h3 className="mb-3 text-xl font-semibold tracking-tight-premium group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-primary transition-all">
                    {t(`howItWorks.${step}.title`)}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground group-hover:text-muted-foreground/90 transition-colors">
                    {t(`howItWorks.${step}.description`)}
                  </p>
                </SpotlightCard>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Learning Paths */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
        <div className="relative mx-auto max-w-7xl px-4">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">
              {tPaths("title")}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              {tPaths("subtitle")}
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {(
              [
                {
                  key: "solanaFundamentals" as const,
                  icon: Layers,
                  gradient: "from-primary/10 to-primary/5",
                  track: "solana-fundamentals",
                  comingSoon: false,
                  reward: "+1000 XP & Builder Badge"
                },
                {
                  key: "defiDevelopment" as const,
                  icon: Zap,
                  gradient: "from-secondary/10 to-secondary/5",
                  track: "defi-development",
                  comingSoon: true,
                  reward: "+2500 XP & DeFi Master Badge"
                },
                {
                  key: "nftGaming" as const,
                  icon: ImageIcon,
                  gradient: "from-accent/10 to-accent/5",
                  track: "nft-gaming",
                  comingSoon: true,
                  reward: "+2000 XP & Creator Badge"
                },
                {
                  key: "advancedProtocol" as const,
                  icon: Cpu,
                  gradient: "from-primary/10 to-secondary/5",
                  track: "advanced-protocol",
                  comingSoon: true,
                  reward: "+5000 XP & Core Contributor"
                },
              ] as const
            ).map(({ key, icon: PathIcon, gradient, track, comingSoon, reward }, idx) => (
              <Link key={key} href={comingSoon ? "#" : `/courses?track=${track}`}>
                <SpotlightCard className={`group flex h-full flex-col p-6 transition-all border border-white/10 hover:border-primary/50 block shadow-xl ${comingSoon ? "bg-card/40 opacity-90" : "bg-card/80 opacity-100 ring-1 ring-primary/30"}`} variant={idx % 2 !== 0 ? "secondary" : "primary"}>
                  <div className="flex items-start justify-between mb-4">
                    <div className={`inline-flex rounded-lg bg-gradient-to-br ${gradient} p-3 ring-1 ring-white/10 group-hover:ring-white/30 transition-all`}>
                      <PathIcon className="h-6 w-6 text-primary group-hover:text-white transition-colors" aria-hidden="true" />
                    </div>
                    {!comingSoon ? (
                      <div className="flex items-center gap-1.5 rounded-full bg-primary/20 border border-primary/30 px-2 py-1 text-[10px] font-bold text-primary animate-pulse shadow-[0_0_10px_rgba(20,241,149,0.4)]">
                        <Flame className="h-3 w-3" />
                        HOT
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 rounded-full bg-white/5 border border-white/10 px-2.5 py-1 text-[10px] font-bold text-muted-foreground whitespace-nowrap">
                        {tPaths("comingSoon")}
                      </div>
                    )}
                  </div>

                  <h3 className="mb-2 text-lg font-bold tracking-tight-premium group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-primary transition-all">
                    {tPaths(`paths.${key}.title`)}
                  </h3>

                  <div className="mb-4 inline-flex items-center gap-1.5 rounded-md bg-secondary/10 px-2 py-1 border border-secondary/20 w-fit">
                    <Trophy className="h-3.5 w-3.5 text-secondary ml-1.5" aria-hidden="true" />
                    <span className="text-[11px] font-semibold text-secondary-foreground pr-2 py-0.5">{reward}</span>
                  </div>

                  <p className="flex-1 text-sm leading-relaxed text-muted-foreground group-hover:text-muted-foreground/90 transition-colors">
                    {tPaths(`paths.${key}.description`)}
                  </p>

                  <div className="mt-6 flex items-center justify-between border-t border-border/40 pt-4">
                    <span className={`flex items-center gap-1.5 text-xs font-bold transition-all ${comingSoon ? "text-muted-foreground" : "text-primary group-hover:text-white"}`}>
                      {comingSoon ? "Unlock soon" : tPaths("startPath")}
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                    <div className="h-1.5 w-16 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full bg-primary/40 w-0 group-hover:w-full transition-all duration-500 ease-out" />
                    </div>
                  </div>
                </SpotlightCard>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Courses — only shown when Sanity has published courses */}
      {featuredCourses.length > 0 && (
        <section className="py-24">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-bold sm:text-4xl">
                {t("featuredCourses.title")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                {t("featuredCourses.subtitle")}
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featuredCourses.map((course, idx) => {
                const cardData: CourseCardData = {
                  slug: course.slug,
                  title: course.title,
                  description: course.description,
                  thumbnail: course.thumbnail ?? null,
                  difficulty: course.difficulty,
                  lessonCount: course.lessons?.length ?? 0,
                  xpPerLesson: course.xpPerLesson,
                  totalEnrollments: 0,
                  progress: null,
                  tags: course.tags ?? [],
                  totalMinutes: course.lessons?.reduce(
                    (sum, l) => sum + (l.estimatedMinutes ?? 0),
                    0
                  ) ?? 0,
                  onChainCourseId: course.onChainCourseId,
                };
                return <CourseCard key={course._id} course={cardData} priority={idx === 0} index={idx} />;
              })}
            </div>

            <div className="mt-10 text-center">
              <Link href="/courses">
                <Button variant="outline" size="lg" className="gap-2">
                  {t("featuredCourses.viewAll")}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Partner Logos */}
      <section className="border-y border-border/50 py-12 bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <p className="text-sm font-medium text-muted-foreground mb-8 uppercase tracking-wider">
            {t("partners.title")}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
            {[
              { name: "Solana", color: "from-primary/20 to-secondary/10", text: "text-primary" },
              { name: "Metaplex", color: "from-primary/15 to-primary/5", text: "text-primary" },
              { name: "Helius", color: "from-orange-500/15 to-orange-500/5", text: "text-orange-500" },
              { name: "Superteam", color: "from-secondary/20 to-secondary/5", text: "text-secondary-foreground" },
              { name: "Anchor", color: "from-blue-500/15 to-blue-500/5", text: "text-blue-500" },
            ].map(({ name, color, text }) => (
              <div
                key={name}
                className={`rounded-xl bg-gradient-to-br ${color} border border-border/40 px-5 py-2.5 font-semibold text-sm ${text} tracking-wide`}
              >
                {name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-3xl font-bold text-center mb-4">{t("testimonials.title")}</h2>
          <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
            {t("testimonials.subtitle")}
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            {(
              [
                { idx: 0 as const, initials: "AR" },
                { idx: 1 as const, initials: "SC" },
                { idx: 2 as const, initials: "MJ" },
              ] as const
            ).map(({ idx, initials }) => (
              <div
                key={idx}
                className="relative flex flex-col gap-4 rounded-xl border border-border/50 border-l-2 border-l-primary/20 bg-card p-6 card-hover"
              >
                {/* Prominent quote icon */}
                <Quote
                  className="-rotate-6 text-primary/20"
                  style={{ width: 32, height: 32 }}
                  aria-hidden="true"
                />
                {/* Star rating */}
                <div className="flex items-center gap-0.5">
                  {[0, 1, 2, 3, 4].map((s) => (
                    <Star
                      key={s}
                      className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400"
                      aria-hidden="true"
                    />
                  ))}
                </div>
                <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
                  {t(`testimonials.items.${idx}.text`)}
                </p>
                <div className="flex items-center gap-3 pt-2 border-t border-border/40">
                  {/* Avatar with gradient ring */}
                  <div className="ring-2 ring-primary/30 ring-offset-2 ring-offset-card rounded-full shrink-0">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 text-xs font-bold text-primary-foreground">
                      {initials}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold leading-tight">
                      {t(`testimonials.items.${idx}.name`)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t(`testimonials.items.${idx}.role`)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden py-24">
        <div className="animate-gradient absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
        <div className="pointer-events-none absolute -left-48 top-0 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="pointer-events-none absolute -right-48 bottom-0 h-96 w-96 rounded-full bg-secondary/5 blur-3xl" />

        <div className="relative mx-auto max-w-3xl px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">{t("cta.title")}</h2>
          <p className="mb-10 text-lg text-muted-foreground">
            {t("cta.subtitle")}
          </p>
          <Link href="/courses">
            <Button
              size="lg"
              className="glow-primary-pulse gap-2 px-8 text-base font-semibold"
            >
              <GraduationCap className="h-5 w-5" aria-hidden="true" />
              {t("cta.button")}
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
