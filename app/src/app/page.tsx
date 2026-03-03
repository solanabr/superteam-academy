"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import {
  BookOpen,
  Trophy,
  Shield,
  Zap,
  Users,
  Globe,
  Code,
  Award,
  ArrowRight,
  Star,
  ChevronRight,
} from "lucide-react";
import { TRACKS } from "@/lib/constants";
import { MOCK_COURSES } from "@/lib/mock-data";

const stats = [
  { value: "24+", labelKey: "courses", icon: BookOpen },
  { value: "2.5K+", labelKey: "builders", icon: Users },
  { value: "1.2K+", labelKey: "credentials", icon: Award },
  { value: "500K+", labelKey: "xpEarned", icon: Zap },
];

const features = [
  {
    icon: Code,
    title: "Interactive Coding",
    description:
      "Learn by doing with embedded code editors, real-time feedback, and hands-on challenges that deploy to Solana devnet.",
    gradient: "from-purple-500 to-indigo-600",
  },
  {
    icon: Shield,
    title: "On-Chain Credentials",
    description:
      "Earn verifiable soulbound NFT credentials as you progress. Your achievements live on the Solana blockchain forever.",
    gradient: "from-emerald-500 to-teal-600",
  },
  {
    icon: Trophy,
    title: "Gamified Learning",
    description:
      "Earn XP, maintain streaks, collect achievements, and climb the leaderboard. Learning has never been this engaging.",
    gradient: "from-amber-500 to-orange-600",
  },
  {
    icon: Globe,
    title: "Global Community",
    description:
      "Join builders across Latin America and beyond. Learn in Portuguese, Spanish, or English with a vibrant peer community.",
    gradient: "from-cyan-500 to-blue-600",
  },
];

const testimonials = [
  {
    name: "Rafael Torres",
    role: "Solana Developer at Marinade Finance",
    text: "Superteam Academy took me from zero Solana knowledge to building production dApps in 3 months. The on-chain credentials opened doors I never expected.",
    avatar: "RT",
  },
  {
    name: "Isabella Souza",
    role: "Founder, SolBR Protocol",
    text: "The interactive challenges are brilliant. Instead of watching videos, you're actually writing and deploying code. The gamification keeps you coming back every day.",
    avatar: "IS",
  },
  {
    name: "Diego Martinez",
    role: "Security Auditor",
    text: "The security track is world-class. I found my first real vulnerability after completing the audit course. The credential NFT on my profile helped land my current job.",
    avatar: "DM",
  },
];

export default function HomePage() {
  const t = useTranslations();

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-[#080810]">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-emerald-900/10" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-float" />
          <div
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl animate-float"
            style={{ animationDelay: "3s" }}
          />
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass mb-8 text-sm">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-muted-foreground">
                Powered by Solana &middot; Open Source
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6">
              <span className="block text-white">{t("hero.title")}</span>
              <span className="block gradient-text mt-2">
                {t("hero.subtitle")}
              </span>
            </h1>

            <p className="max-w-2xl mx-auto text-lg sm:text-xl text-gray-400 mb-10 leading-relaxed">
              {t("hero.description")}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link
                href="/courses"
                className="group flex items-center gap-2 px-8 py-4 rounded-xl text-lg font-semibold text-white bg-gradient-to-r from-purple-600 to-emerald-500 hover:from-purple-500 hover:to-emerald-400 transition-all shadow-2xl shadow-purple-500/25 hover:shadow-purple-500/40 hover:-translate-y-0.5"
              >
                {t("hero.cta")}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/courses"
                className="flex items-center gap-2 px-8 py-4 rounded-xl text-lg font-semibold glass text-white hover:bg-white/10 transition-all"
              >
                {t("hero.ctaSecondary")}
              </Link>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {stats.map((stat) => (
              <div key={stat.labelKey} className="glass rounded-xl p-4 text-center">
                <stat.icon className="w-5 h-5 mx-auto mb-2 text-purple-400" />
                <div className="text-2xl sm:text-3xl font-bold text-white">
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm text-gray-400">
                  {t(`hero.stats.${stat.labelKey}`)}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Learning Paths */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Choose Your{" "}
              <span className="gradient-text">Learning Path</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Structured tracks designed to take you from beginner to expert in specific Solana domains.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {TRACKS.map((track, i) => (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Link
                  href={`/courses?track=${track.id}`}
                  className="group block p-6 rounded-2xl card-hover"
                  style={{
                    background: `linear-gradient(135deg, ${track.color}08 0%, ${track.color}03 100%)`,
                    border: `1px solid ${track.color}20`,
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-lg mb-4 flex items-center justify-center"
                    style={{ backgroundColor: `${track.color}15` }}
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: track.color }}
                    />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                    {track.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {MOCK_COURSES.filter((c) =>
                      c.track
                        .toLowerCase()
                        .includes(track.id.split("-")[0])
                    ).length}{" "}
                    courses available
                  </p>
                  <div className="flex items-center gap-1 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    Start learning <ChevronRight className="w-4 h-4" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 relative bg-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Why{" "}
              <span className="gradient-text">Superteam Academy?</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Built by the Solana community for the Solana community.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group p-6 rounded-2xl glass card-hover"
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                >
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-2">
                Featured <span className="gradient-text">Courses</span>
              </h2>
              <p className="text-muted-foreground">
                Start building on Solana today
              </p>
            </div>
            <Link
              href="/courses"
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
            >
              {t("common.viewAll")} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {MOCK_COURSES.slice(0, 3).map((course, i) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Link
                  href={`/courses/${course.slug}`}
                  className="group block rounded-2xl overflow-hidden glass card-hover"
                >
                  {/* Thumbnail */}
                  <div className="relative h-44 overflow-hidden">
                    <div
                      className="absolute inset-0"
                      style={{
                        background: `linear-gradient(135deg, ${course.trackColor}40 0%, ${course.trackColor}10 100%)`,
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <BookOpen
                        className="w-16 h-16 opacity-20"
                        style={{ color: course.trackColor }}
                      />
                    </div>
                    {/* Difficulty Badge */}
                    <div className="absolute top-3 left-3">
                      <span
                        className={`px-2 py-1 rounded-md text-xs font-medium ${course.difficulty === "beginner"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : course.difficulty === "intermediate"
                              ? "bg-amber-500/20 text-amber-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                      >
                        {course.difficulty}
                      </span>
                    </div>
                    <div className="absolute top-3 right-3 flex items-center gap-1 text-xs text-white/80 bg-black/30 px-2 py-1 rounded-md backdrop-blur-sm">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      {course.rating}
                    </div>
                  </div>

                  <div className="p-5">
                    <div
                      className="text-xs font-medium mb-2"
                      style={{ color: course.trackColor }}
                    >
                      {course.track}
                    </div>
                    <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                      {course.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {course.description}
                    </p>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-3">
                        <span>{course.lessonCount} lessons</span>
                        <span>{Math.floor(course.duration / 60)}h</span>
                      </div>
                      <span className="font-medium text-emerald-400">
                        +{course.xpReward} XP
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="sm:hidden mt-6 text-center">
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium glass hover:bg-secondary/50 transition-colors"
            >
              {t("common.viewAll")} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 relative bg-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Trusted by <span className="gradient-text">Builders</span>
            </h2>
            <p className="text-muted-foreground">
              Hear from developers who transformed their careers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((item, i) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-2xl glass"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-emerald-500 flex items-center justify-center text-white font-bold text-sm">
                    {item.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{item.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.role}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  &ldquo;{item.text}&rdquo;
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="p-10 rounded-3xl relative overflow-hidden"
            style={{ background: "var(--gradient-hero)" }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-emerald-600/10" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Ready to Build the Future?
              </h2>
              <p className="text-gray-300 mb-8 max-w-xl mx-auto">
                Join thousands of developers learning Solana. Your on-chain credentials await.
              </p>
              <Link
                href="/courses"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-lg font-semibold text-white bg-gradient-to-r from-purple-600 to-emerald-500 hover:from-purple-500 hover:to-emerald-400 transition-all shadow-2xl shadow-purple-500/25"
              >
                {t("common.startLearning")}
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
