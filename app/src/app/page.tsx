"use client";

import { CourseCard } from "@/components/course/CourseCard";
import { STATIC_COURSES } from "@/lib/courses";
import { Zap, Users, Award, BookOpen, ArrowRight, Shield, ChevronRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

const STATS = [
  { key: "stat_learners", value: "2,400+", icon: Users },
  { key: "stat_courses", value: "12", icon: BookOpen },
  { key: "stat_xp", value: "1.2M", icon: Zap },
  { key: "stat_credentials", value: "300+", icon: Award },
];

const TRACKS = [
  {
    id: "anchor",
    titleKey: "track_anchor",
    descKey: "track_anchor_desc",
    color: "from-[hsl(var(--primary)/0.15)] to-transparent",
    border: "border-[hsl(var(--primary)/0.25)]",
    accent: "text-[hsl(var(--primary))]",
    courses: 3,
  },
  {
    id: "defi",
    titleKey: "track_defi",
    descKey: "track_defi_desc",
    color: "from-blue-500/10 to-transparent",
    border: "border-blue-500/25",
    accent: "text-blue-500",
    courses: 2,
  },
  {
    id: "nft",
    titleKey: "track_nft",
    descKey: "track_nft_desc",
    color: "from-pink-500/10 to-transparent",
    border: "border-pink-500/25",
    accent: "text-pink-500",
    courses: 2,
  },
];

export default function HomePage() {
  const t = useTranslations("landing");
  const featuredCourses = STATIC_COURSES.filter((c) => c.isActive && !c.startingSoon).slice(0, 3);

  return (
    <div className="pb-12">
      {/* Hero */}
      <section className="relative pt-16 pb-24 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,hsl(var(--primary)/0.08),transparent)]" />

        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-full px-4 py-1.5 text-sm text-[hsl(var(--muted-foreground))] mb-8 shadow-sm"
          >
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Live on Solana Devnet
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-heading text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-none mb-6"
          >
            {t("hero_title")}{" "}
            <span className="gradient-text block">{t("hero_title_accent")}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-[hsl(var(--muted-foreground))] max-w-2xl mx-auto mb-10"
          >
            {t("hero_subtitle")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Link
              href="/courses"
              className="flex items-center justify-center gap-2 bg-[hsl(var(--primary))] text-white font-semibold px-7 py-3 rounded-xl hover:opacity-90 transition-all shadow-md group"
            >
              {t("cta_explore")}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/onboarding"
              className="flex items-center justify-center gap-2 bg-[hsl(var(--card))] border border-[hsl(var(--border))] font-semibold px-7 py-3 rounded-xl hover:border-[hsl(var(--primary)/0.4)] transition-all shadow-sm"
            >
              Take Skill Quiz
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-10 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4">
          {STATS.map(({ key, value, icon: Icon }, i) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="glass rounded-xl p-5 text-center"
            >
              <div className="inline-flex w-10 h-10 rounded-xl bg-[hsl(var(--secondary))] items-center justify-center mb-3">
                <Icon className="w-5 h-5 text-[hsl(var(--primary))]" />
              </div>
              <p className="font-heading font-bold text-2xl">{value}</p>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">{t(key)}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl font-bold mb-3">{t("how_it_works")}</h2>
            <p className="text-[hsl(var(--muted-foreground))] max-w-xl mx-auto">
              Every achievement is verifiable onchain. No intermediaries.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              {
                step: "01",
                title: t("step_1_title"),
                desc: t("step_1_desc"),
                icon: BookOpen,
              },
              {
                step: "02",
                title: t("step_2_title"),
                desc: t("step_2_desc"),
                icon: Zap,
              },
              {
                step: "03",
                title: t("step_3_title"),
                desc: t("step_3_desc"),
                icon: Shield,
              },
            ].map(({ step, title, desc, icon: Icon }) => (
              <div key={step} className="glass rounded-xl p-6 relative overflow-hidden group hover:shadow-md transition-shadow">
                <div className="absolute top-4 right-4 font-mono text-3xl font-bold text-[hsl(var(--muted)/0.5)]">{step}</div>
                <div className="w-10 h-10 rounded-xl bg-[hsl(var(--secondary))] flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-[hsl(var(--primary))]" />
                </div>
                <h3 className="font-heading font-semibold text-lg mb-2">{title}</h3>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Learning Paths */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl font-bold mb-3">{t("paths_title")}</h2>
            <p className="text-[hsl(var(--muted-foreground))] max-w-xl mx-auto">
              {t("paths_subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {TRACKS.map((track) => (
              <Link
                key={track.id}
                href={`/courses?track=${track.id}`}
                className={`glass rounded-xl p-6 border ${track.border} bg-gradient-to-b ${track.color} hover:-translate-y-1 transition-all group`}
              >
                <h3 className={`font-heading font-bold text-lg mb-2 ${track.accent}`}>{t(track.titleKey)}</h3>
                <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">{t(track.descKey)}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[hsl(var(--muted-foreground))]">{track.courses} {t("courses")}</span>
                  <ChevronRight className={`w-4 h-4 ${track.accent} group-hover:translate-x-1 transition-transform`} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-heading text-2xl font-bold mb-1">{t("featured_title")}</h2>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Start learning today</p>
            </div>
            <Link
              href="/courses"
              className="flex items-center gap-1 text-[hsl(var(--primary))] font-semibold text-sm hover:gap-2 transition-all"
            >
              {t("view_all")} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {featuredCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
