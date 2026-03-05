"use client";

import Link from "next/link";
import Image from "next/image";
import type { Route } from "next";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CourseCard } from "@/components/shared/course-card";
import { contentService } from "@/services/content-service";
import type { CourseSummary } from "@/types/domain";
import {
  ArrowRight,
  Code2,
  Trophy,
  ShieldCheck,
  Zap,
  BookOpen,
  CheckCircle,
  Users,
  BarChart3,
  Coins,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/providers/locale-provider";

const PARTNER_LOGOS = [
  {
    name: "Superteam",
    src: "/superteam-logo.svg",
    width: 132,
    height: 28,
    toneMode: "neutralized",
  },
  {
    name: "Helius",
    src: "/partner-logos/helius.svg",
    width: 190,
    height: 40,
    toneMode: "neutralized",
  },
  {
    name: "Backpack",
    src: "/partner-logos/backpack.svg",
    width: 166,
    height: 32,
    toneMode: "neutralized",
  },
  {
    name: "Tensor",
    src: "/partner-logos/tensor.png",
    width: 1606,
    height: 1628,
    toneMode: "native",
  },
  {
    name: "Jupiter",
    src: "/partner-logos/jupiter.svg",
    width: 182,
    height: 80,
    toneMode: "neutralized",
  },
  {
    name: "Drift",
    src: "/partner-logos/drift.png",
    width: 216,
    height: 72,
    toneMode: "neutralized",
  },
  {
    name: "Jito",
    src: "/partner-logos/jito.svg",
    width: 263,
    height: 74,
    toneMode: "neutralized",
  },
] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6 },
  },
};

const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.6 } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.08 } },
};

const STATS = [
  { value: "10K+", label: "Learners" },
  { value: "500K+", label: "XP Awarded" },
  { value: "95%", label: "Completion Rate" },
  { value: "24/7", label: "On-chain" },
];

export default function HomePage(): React.JSX.Element {
  const { t } = useLocale();
  const [featuredCourses, setFeaturedCourses] = useState<CourseSummary[]>([]);

  useEffect(() => {
    void contentService
      .getCourses()
      .then((data) => setFeaturedCourses(data.slice(0, 4)));
  }, []);

  return (
    <div className="flex flex-col min-h-screen overflow-hidden">
      {/* ─── FULL-BLEED ANIMATED HERO ─── */}
      <section className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] min-h-screen w-screen flex flex-col justify-center items-center overflow-hidden">
        {/* Base background */}
        <div className="absolute inset-0 z-0 bg-[#04060d]" />
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 55% at 18% 12%, rgba(153,69,255,0.28), transparent 58%), radial-gradient(ellipse 62% 50% at 82% 14%, rgba(20,241,149,0.24), transparent 56%)",
          }}
        />

        {/* Motion blobs */}
        <motion.div
          className="absolute -top-32 -left-24 z-[1] hidden h-[560px] w-[560px] rounded-full blur-[90px] pointer-events-none md:block"
          style={{
            background: "rgba(153,69,255,0.42)",
            mixBlendMode: "screen",
          }}
          animate={{
            x: [0, 92, -56, 0],
            y: [0, 64, -34, 0],
            scale: [1, 1.1, 0.94, 1],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -top-20 -right-24 z-[1] hidden h-[560px] w-[560px] rounded-full blur-[90px] pointer-events-none md:block"
          style={{
            background: "rgba(20,241,149,0.36)",
            mixBlendMode: "screen",
          }}
          animate={{
            x: [0, -88, 46, 0],
            y: [0, -52, 26, 0],
            scale: [1, 0.92, 1.12, 1],
          }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-28 left-1/2 z-[1] hidden h-[460px] w-[740px] -translate-x-1/2 rounded-full blur-[95px] pointer-events-none md:block"
          style={{
            background: "rgba(109,83,255,0.26)",
            mixBlendMode: "screen",
          }}
          animate={{
            x: [0, 72, -52, 0],
            y: [0, -38, 28, 0],
            opacity: [0.62, 0.95, 0.72, 0.62],
            scale: [1, 1.06, 0.96, 1],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute inset-0 z-[1] hidden pointer-events-none md:block"
          style={{
            background:
              "radial-gradient(ellipse 46% 34% at 35% 52%, rgba(153,69,255,0.18), transparent 70%), radial-gradient(ellipse 44% 32% at 66% 46%, rgba(20,241,149,0.16), transparent 70%)",
            mixBlendMode: "screen",
          }}
          animate={{ x: [0, -34, 18, 0], y: [0, 20, -12, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Readability overlay */}
        <div className="absolute inset-0 z-[2] bg-black/42 pointer-events-none" />

        {/* Hero Content — centered, Linear-style */}
        <motion.div
          className="relative z-10 flex flex-col items-center text-center px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto pt-32 pb-28"
          initial="hidden"
          animate="show"
          variants={stagger}
        >
          {/* Glassmorphism badge pill */}
          <motion.div variants={fadeUp}>
            <div
              className="inline-flex items-center gap-2.5 rounded-full px-5 py-2 mb-10"
              style={{
                background: "rgba(85,80,110,0.4)",
                border: "1px solid rgba(164,132,215,0.5)",
                backdropFilter: "blur(12px)",
              }}
            >
              <span className="inline-flex items-center gap-2 text-sm text-white/80 font-medium">
                {t("homePage.poweredBySolana")}
                <Image
                  src="/solanafoundation-logo.svg"
                  alt="Solana Foundation"
                  width={156}
                  height={32}
                  className="h-[28px] w-auto opacity-95"
                />
              </span>
            </div>
          </motion.div>

          {/* Headline with serif italic accent */}
          <motion.h1
            className="font-display text-[clamp(3rem,8vw,5.5rem)] font-black tracking-tight leading-[1.05] text-white mb-8"
            variants={fadeUp}
          >
            {t("homePage.heroTitleLine1")}
            <br />
            <span
              className="font-serif italic font-normal bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, #9945FF 0%, #14F195 100%)",
              }}
            >
              {t("homePage.heroTitleLine2")}
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            className="text-lg sm:text-xl text-white/55 mb-12 max-w-2xl leading-relaxed"
            variants={fadeUp}
          >
            {t("homePage.heroSubtitle")}
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row items-center gap-4 mb-14"
            variants={fadeUp}
          >
            <Button
              asChild
              size="lg"
              className="hero-cta-gradient h-14 px-10 text-base font-bold rounded-full text-black hover:scale-[1.04] transition-all shadow-[0_0_50px_rgba(153,69,255,0.3)] border-0"
            >
              <Link href="/courses">
                {t("homePage.signUp")} <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>

            <Button
              asChild
              size="lg"
              className="h-14 px-10 text-base font-semibold rounded-full text-white/85 hover:text-white transition-all hover:scale-[1.02]"
              style={{
                background: "rgba(43,35,68,0.8)",
                border: "1px solid rgba(164,132,215,0.4)",
                backdropFilter: "blur(8px)",
              }}
            >
              <Link href="/courses">{t("homePage.exploreCourses")}</Link>
            </Button>
          </motion.div>

          {/* Trust points */}
          <motion.div
            className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-white/45"
            variants={fadeUp}
          >
            {[
              t("homePage.heroPoint1"),
              t("homePage.heroPoint2"),
              t("homePage.heroPoint3"),
            ].map((f) => (
              <span key={f} className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-[#14F195]" /> {f}
              </span>
            ))}
          </motion.div>
        </motion.div>

        {/* Partner logo marquee strip */}
        <div className="absolute bottom-0 left-0 right-0 z-10 border-t border-white/8 bg-black/30 backdrop-blur-md py-5 overflow-hidden">
          <div className="flex items-center gap-12 whitespace-nowrap animate-marquee motion-reduce:animate-none [animation-duration:24s] sm:gap-16 sm:[animation-duration:30s]">
            {[...PARTNER_LOGOS, ...PARTNER_LOGOS].map((partner, i) => (
              <div
                key={`${partner.name}-${i}`}
                className="flex h-7 shrink-0 items-center sm:h-8"
              >
                <Image
                  src={partner.src}
                  alt={partner.name}
                  width={partner.width}
                  height={partner.height}
                  style={{
                    height: partner.name === "Jupiter" ? "40px" : "28px",
                    width: "auto",
                  }}
                  className={
                    partner.name === "Jupiter"
                      ? partner.toneMode === "neutralized"
                        ? "opacity-30 [filter:grayscale(1)_saturate(0)_brightness(0)_invert(1)]"
                        : "opacity-30 grayscale"
                      : partner.toneMode === "neutralized"
                        ? "opacity-30 [filter:grayscale(1)_saturate(0)_brightness(0)_invert(1)]"
                        : "opacity-30 grayscale"
                  }
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PLATFORM FEATURES (6 cards) ─── */}
      <motion.section
        className="py-28 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        variants={stagger}
      >
        <motion.div className="text-center mb-16" variants={fadeUp}>
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-white mb-4">
            {t("homePage.featuresTitle")}
          </h2>
          <p className="text-white/55 text-lg max-w-xl mx-auto">
            {t("homePage.featuresSubtitle")}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: <Code2 className="h-6 w-6" />,
              color: "#9945FF",
              title: t("homePage.feature1Title"),
              desc: t("homePage.feature1Desc"),
            },
            {
              icon: <Trophy className="h-6 w-6" />,
              color: "#14F195",
              title: t("homePage.feature2Title"),
              desc: t("homePage.feature2Desc"),
            },
            {
              icon: <ShieldCheck className="h-6 w-6" />,
              color: "#c97bff",
              title: t("homePage.feature3Title"),
              desc: t("homePage.feature3Desc"),
            },
            {
              icon: <Users className="h-6 w-6" />,
              color: "#14F195",
              title: t("homePage.feature4Title"),
              desc: t("homePage.feature4Desc"),
            },
            {
              icon: <BarChart3 className="h-6 w-6" />,
              color: "#9945FF",
              title: t("homePage.feature5Title"),
              desc: t("homePage.feature5Desc"),
            },
            {
              icon: <Coins className="h-6 w-6" />,
              color: "#f59e0b",
              title: t("homePage.feature6Title"),
              desc: t("homePage.feature6Desc"),
            },
          ].map((f) => (
            <motion.div
              key={f.title}
              className="group relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-8 hover:border-white/20 transition-all hover:bg-white/8 overflow-hidden"
              variants={fadeUp}
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-2xl blur-xl"
                style={{
                  background: `radial-gradient(circle at 30% 30%, ${f.color}18, transparent 70%)`,
                }}
              />
              <div
                className="h-12 w-12 rounded-xl flex items-center justify-center mb-6"
                style={{ background: `${f.color}20`, color: f.color }}
              >
                {f.icon}
              </div>
              <h3 className="text-lg font-bold text-white mb-3">{f.title}</h3>
              <p className="text-white/55 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ─── LEARNING PATHS WITH PROGRESSION ─── */}
      <motion.section
        className="py-20 relative overflow-hidden"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        variants={stagger}
      >
        <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-[#9945FF] opacity-10 blur-[100px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6"
            variants={fadeUp}
          >
            <div>
              <h2 className="font-display text-4xl sm:text-5xl font-bold text-white mb-3">
                {t("homePage.tracksTitle")}
              </h2>
              <p className="text-white/55 text-lg">
                {t("homePage.tracksSubtitle")}
              </p>
            </div>
            <Button
              variant="ghost"
              className="shrink-0 rounded-full border border-white/15 text-white/70 hover:text-white hover:bg-white/10"
              asChild
            >
              <Link href="/courses">
                {t("homePage.viewAll")} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-6">
            {[
              {
                tag: t("homePage.trackBeginner"),
                tagColor: "#14F195",
                title: t("homePage.trackFundTitle"),
                desc: t("homePage.trackFundDesc"),
                modules: 5,
                lessons: 25,
                xp: 500,
                progress: 0,
                href: "/courses",
                gradient: "from-[#14F195]/10 to-transparent",
                border: "#14F195",
              },
              {
                tag: t("homePage.trackIntermediate"),
                tagColor: "#9945FF",
                title: t("homePage.trackAnchorTitle"),
                desc: t("homePage.trackAnchorDesc"),
                modules: 8,
                lessons: 40,
                xp: 1200,
                progress: 0,
                href: "/courses",
                gradient: "from-[#9945FF]/10 to-transparent",
                border: "#9945FF",
              },
            ].map((track) => (
              <motion.div key={track.title} variants={fadeUp}>
                <Link
                  href={track.href as Route}
                  className="group relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-8 sm:p-10 hover:border-white/20 transition-all overflow-hidden block"
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${track.gradient} pointer-events-none`}
                  />
                  <div className="relative z-10">
                    <Badge
                      className="mb-6 rounded-full border text-xs font-semibold px-3"
                      style={{
                        background: `${track.tagColor}20`,
                        borderColor: `${track.tagColor}40`,
                        color: track.tagColor,
                      }}
                    >
                      {track.tag}
                    </Badge>
                    <h3 className="font-display text-2xl font-bold text-white mb-4">
                      {track.title}
                    </h3>
                    <p className="text-white/55 mb-6 text-base leading-relaxed">
                      {track.desc}
                    </p>

                    {/* Meta stats */}
                    <div className="flex items-center gap-6 text-sm font-semibold text-white/60 mb-6">
                      <span className="flex items-center gap-2">
                        <BookOpen
                          className="h-4 w-4"
                          style={{ color: track.tagColor }}
                        />{" "}
                        {track.modules} {t("homePage.modules")}
                      </span>
                      <span className="flex items-center gap-2">
                        <Zap
                          className="h-4 w-4"
                          style={{ color: track.tagColor }}
                        />{" "}
                        {track.xp} XP
                      </span>
                    </div>

                    {/* Progression Indicator */}
                    <div className="space-y-3">
                      {/* Step indicators */}
                      <div className="flex items-center gap-1">
                        {[
                          t("homePage.trackStep1"),
                          t("homePage.trackStep2"),
                          t("homePage.trackStep3"),
                          t("homePage.trackStep4"),
                        ].map((step, i, arr) => (
                          <div key={step} className="flex items-center gap-1">
                            <div
                              className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-mono tracking-wide"
                              style={{
                                background: `${track.tagColor}15`,
                                color: `${track.tagColor}`,
                                border: `1px solid ${track.tagColor}25`,
                              }}
                            >
                              <span
                                className="h-4 w-4 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
                                style={{
                                  background: `${track.tagColor}25`,
                                }}
                              >
                                {i + 1}
                              </span>
                              <span className="hidden sm:inline">{step}</span>
                            </div>
                            {i < arr.length - 1 && (
                              <ArrowRight className="h-3 w-3 text-white/20 shrink-0" />
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Progress bar */}
                      <div className="relative">
                        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full rounded-full progress-shimmer transition-all duration-700"
                            style={{
                              width: `${Math.max(track.progress, 4)}%`,
                              background: `linear-gradient(90deg, ${track.tagColor}, ${track.tagColor}80, ${track.tagColor})`,
                            }}
                          />
                        </div>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-[10px] font-mono text-white/30">
                            {t("homePage.progressLabel")}
                          </span>
                          <span
                            className="text-[10px] font-mono font-bold"
                            style={{ color: track.tagColor }}
                          >
                            {track.lessons} {t("homePage.lessons")} →{" "}
                            {t("homePage.credential")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ─── STATS ─── */}
      <motion.section
        className="py-16 border-y border-white/[0.06]"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.4 }}
        variants={stagger}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {STATS.map((s) => (
              <motion.div
                key={s.label}
                variants={fadeUp}
                className="text-center"
              >
                <p
                  className="font-display font-black text-4xl sm:text-5xl mb-1"
                  style={{
                    background: "linear-gradient(135deg, #14F195, #9945FF)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {s.value}
                </p>
                <p className="text-sm text-white/40 font-mono tracking-widest uppercase">
                  {s.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ─── TESTIMONIALS / SOCIAL PROOF ─── */}
      <motion.section
        className="py-24 relative overflow-hidden"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        variants={stagger}
      >
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-[#14F195] opacity-[0.06] blur-[120px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div className="text-center mb-16" variants={fadeUp}>
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-white mb-4">
              {t("homePage.testimonialsTitle")}
            </h2>
            <p className="text-white/55 text-lg max-w-xl mx-auto">
              {t("homePage.testimonialsSubtitle")}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: t("homePage.testimonial1Name"),
                role: t("homePage.testimonial1Role"),
                quote: t("homePage.testimonial1Quote"),
                color: "#9945FF",
              },
              {
                name: t("homePage.testimonial2Name"),
                role: t("homePage.testimonial2Role"),
                quote: t("homePage.testimonial2Quote"),
                color: "#14F195",
              },
              {
                name: t("homePage.testimonial3Name"),
                role: t("homePage.testimonial3Role"),
                quote: t("homePage.testimonial3Quote"),
                color: "#c97bff",
              },
            ].map((testimonial) => (
              <motion.div
                key={testimonial.name}
                className="group relative rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm p-8 hover:border-white/20 transition-all overflow-hidden"
                variants={fadeUp}
              >
                {/* Hover glow */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-2xl blur-2xl"
                  style={{
                    background: `radial-gradient(circle at 50% 0%, ${testimonial.color}12, transparent 60%)`,
                  }}
                />

                <div className="relative z-10">
                  {/* Quote icon */}
                  <div
                    className="quote-mark"
                    style={{ color: testimonial.color }}
                  >
                    &ldquo;
                  </div>

                  {/* Stars */}
                  <div className="flex gap-0.5 mb-5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-current"
                        style={{ color: "#f59e0b" }}
                      />
                    ))}
                  </div>

                  {/* Quote */}
                  <p className="text-white/70 text-sm leading-relaxed mb-8 min-h-[5rem]">
                    &ldquo;{testimonial.quote}&rdquo;
                  </p>

                  {/* Author */}
                  <div className="flex items-center gap-3">
                    <div
                      className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                      style={{
                        background: `${testimonial.color}20`,
                        color: testimonial.color,
                        border: `1px solid ${testimonial.color}30`,
                      }}
                    >
                      {testimonial.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {testimonial.name}
                      </p>
                      <p className="text-xs text-white/40">
                        {testimonial.role}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ─── FEATURED COURSES ─── */}
      {featuredCourses.length > 0 && (
        <motion.section
          className="py-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
          variants={stagger}
        >
          <motion.div
            className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4"
            variants={fadeUp}
          >
            <div>
              <p className="font-mono text-xs tracking-[0.2em] uppercase text-white/30 mb-2">
                Live on Solana
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-white">
                Featured Courses
              </h2>
            </div>
            <Button
              variant="ghost"
              className="shrink-0 rounded-full border border-white/15 text-white/70 hover:text-white hover:bg-white/10"
              asChild
            >
              <Link href="/courses">
                {t("homePage.viewAll")} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>

          <motion.div
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4"
            variants={stagger}
          >
            {featuredCourses.map((course) => (
              <motion.div key={course.id} variants={fadeUp}>
                <CourseCard course={course} />
              </motion.div>
            ))}
          </motion.div>
        </motion.section>
      )}

      {/* ─── FINAL CTA ─── */}
      <motion.section
        className="py-28 w-full max-w-5xl mx-auto px-4 text-center"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        variants={fadeUp}
      >
        <motion.div
          className="relative overflow-hidden rounded-3xl border border-white/20 bg-white/5 p-14 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-20"
          variants={fadeUp}
        >
          <div className="relative z-10">
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-white mb-6">
              {t("homePage.finalTitle")}
            </h2>
            <p className="text-white/60 text-xl mb-10 max-w-2xl mx-auto">
              {t("homePage.finalSubtitle")}
            </p>
            <Button
              size="lg"
              className="hero-cta-gradient h-14 px-10 text-base font-bold rounded-full text-black hover:scale-[1.04] transition-all shadow-[0_0_50px_rgba(153,69,255,0.3)] border-0"
              asChild
            >
              <Link href="/courses">{t("homePage.createAccount")}</Link>
            </Button>
          </div>
        </motion.div>
      </motion.section>
    </div>
  );
}
