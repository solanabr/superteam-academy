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
  Sparkles,
  GraduationCap,
  Rocket,
  Anchor,
  Layers,
  Palette,
  Terminal,
  Lock,
  Coins,
} from "lucide-react";
import { TRACKS } from "@/lib/constants";
import { MOCK_COURSES } from "@/lib/mock-data";

const stats = [
  { value: "24+", labelKey: "courses", icon: BookOpen },
  { value: "2.5K+", labelKey: "builders", icon: Users },
  { value: "1.2K+", labelKey: "credentials", icon: Award },
  { value: "500K+", labelKey: "xpEarned", icon: Zap },
];

export default function HomePage() {
  const t = useTranslations();

  const features = [
    {
      icon: Code,
      title: t("landing.interactiveCoding"),
      description: t("landing.interactiveCodingDesc"),
      gradient: "from-purple-500 to-indigo-600",
    },
    {
      icon: Shield,
      title: t("landing.onChainCredentials"),
      description: t("landing.onChainCredentialsDesc"),
      gradient: "from-emerald-500 to-teal-600",
    },
    {
      icon: Trophy,
      title: t("landing.gamifiedLearning"),
      description: t("landing.gamifiedLearningDesc"),
      gradient: "from-amber-500 to-orange-600",
    },
    {
      icon: Globe,
      title: t("landing.globalCommunity"),
      description: t("landing.globalCommunityDesc"),
      gradient: "from-cyan-500 to-blue-600",
    },
  ];

  const testimonials = [
    {
      name: "Rafael Torres",
      role: "Solana Developer @ Marinade Finance",
      text: t("landing.testimonial1"),
      avatar: "RT",
      gradient: "from-purple-600 to-blue-500",
    },
    {
      name: "Isabella Souza",
      role: "Founder, SolBR Protocol",
      text: t("landing.testimonial2"),
      avatar: "IS",
      gradient: "from-emerald-600 to-teal-500",
    },
    {
      name: "Diego Martinez",
      role: "Security Auditor",
      text: t("landing.testimonial3"),
      avatar: "DM",
      gradient: "from-amber-600 to-orange-500",
    },
  ];

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
          <div
            className="absolute top-1/2 left-1/2 w-[600px] h-[600px] bg-gradient-to-br from-purple-500/5 to-emerald-500/5 rounded-full blur-3xl animate-float"
            style={{ animationDelay: "6s" }}
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
                {t("common.poweredBy")}
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
              <div key={stat.labelKey} className="glass rounded-xl p-4 text-center group hover:bg-white/5 transition-colors">
                <stat.icon className="w-5 h-5 mx-auto mb-2 text-purple-400 group-hover:scale-110 transition-transform" />
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
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs mb-4">
                <GraduationCap className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-muted-foreground">6 {t("common.coursesAvailable")}</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                {t("landing.choosePath")}{" "}
                <span className="gradient-text">{t("landing.learningPath")}</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                {t("landing.pathDescription")}
              </p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {TRACKS.map((track, i) => {
              const trackIcons: Record<string, React.ReactNode> = {
                "solana-fundamentals": <BookOpen className="w-6 h-6" />,
                "anchor-development": <Anchor className="w-6 h-6" />,
                "defi-developer": <Coins className="w-6 h-6" />,
                "nft-creator": <Palette className="w-6 h-6" />,
                "security-auditor": <Shield className="w-6 h-6" />,
                "full-stack-solana": <Terminal className="w-6 h-6" />,
              };
              const trackDescs: Record<string, string> = {
                "solana-fundamentals": "Accounts, Transactions, Programs",
                "anchor-development": "Rust, PDAs, Testing, Deploy",
                "defi-developer": "AMMs, Lending, Yield Vaults",
                "nft-creator": "Metaplex, Collections, Metadata",
                "security-auditor": "Vulnerabilities, Audits, Fuzzing",
                "full-stack-solana": "React, Next.js, Wallet Adapter",
              };
              const courseCount = MOCK_COURSES.filter((c) =>
                c.track.toLowerCase().includes(track.id.split("-")[0])
              ).length;
              return (
                <motion.div
                  key={track.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                >
                  <Link
                    href={`/courses?track=${track.id}`}
                    className="group block p-6 rounded-2xl card-hover relative overflow-hidden h-full"
                    style={{
                      background: `linear-gradient(135deg, ${track.color}08 0%, ${track.color}03 100%)`,
                      border: `1px solid ${track.color}20`,
                    }}
                  >
                    <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl opacity-[0.07] group-hover:opacity-[0.15] transition-opacity"
                      style={{ backgroundColor: track.color }} />
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"
                        style={{ backgroundColor: `${track.color}15`, color: track.color }}
                      >
                        {trackIcons[track.id]}
                      </div>
                      <span className="text-xs font-medium px-2 py-1 rounded-md" style={{ backgroundColor: `${track.color}15`, color: track.color }}>
                        {courseCount} {courseCount === 1 ? "curso" : "cursos"}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold mb-1 group-hover:text-primary transition-colors">
                      {track.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-4 font-mono">
                      {trackDescs[track.id]}
                    </p>
                    <div className="flex items-center gap-1 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      {t("common.startLearningPath")} <ChevronRight className="w-4 h-4" />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 relative bg-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs mb-4">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-muted-foreground">{t("landing.web3Platform")}</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                {t("landing.whyTitle")}{" "}
                <span className="gradient-text">Superteam Academy?</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                {t("landing.whySubtitle")}
              </p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group p-6 rounded-2xl glass card-hover relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl opacity-5 group-hover:opacity-10 transition-opacity bg-gradient-to-br from-purple-500 to-emerald-500" />
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}
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
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs mb-3">
                <Rocket className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-muted-foreground">{t("landing.topRated")}</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-2">
                {t("landing.featuredTitle")} <span className="gradient-text">{t("landing.featuredCourses")}</span>
              </h2>
              <p className="text-muted-foreground">
                {t("landing.featuredSubtitle")}
              </p>
            </motion.div>
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
                        className="w-16 h-16 opacity-20 group-hover:scale-110 transition-transform"
                        style={{ color: course.trackColor }}
                      />
                    </div>
                    {/* Difficulty Badge */}
                    <div className="absolute top-3 left-3">
                      <span
                        className={`px-2.5 py-1 rounded-md text-xs font-medium backdrop-blur-sm ${course.difficulty === "beginner"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20"
                          : course.difficulty === "intermediate"
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/20"
                            : "bg-red-500/20 text-red-400 border border-red-500/20"
                          }`}
                      >
                        {course.difficulty === "beginner"
                          ? t("courses.filterBeginner")
                          : course.difficulty === "intermediate"
                            ? t("courses.filterIntermediate")
                            : t("courses.filterAdvanced")}
                      </span>
                    </div>
                    <div className="absolute top-3 right-3 flex items-center gap-1 text-xs text-white/90 bg-black/40 px-2 py-1 rounded-md backdrop-blur-sm border border-white/10">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      {course.rating}
                    </div>
                  </div>

                  <div className="p-5">
                    <div
                      className="text-xs font-medium mb-2 uppercase tracking-wider"
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

                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-white/5">
                      <div className="flex items-center gap-3">
                        <span>{course.lessonCount} {t("courses.lessons").toLowerCase()}</span>
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
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                {t("landing.trustedBy")} <span className="gradient-text">{t("landing.builders")}</span>
              </h2>
              <p className="text-muted-foreground">
                {t("landing.trustSubtitle")}
              </p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((item, i) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-2xl glass relative overflow-hidden group hover:bg-white/[0.03] transition-colors"
              >
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-5 group-hover:opacity-10 transition-opacity bg-gradient-to-br from-purple-500 to-emerald-500" />
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${item.gradient} flex items-center justify-center text-white font-bold text-sm shadow-lg`}>
                    {item.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{item.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.role}
                    </div>
                  </div>
                </div>
                <div className="flex gap-0.5 mb-3">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
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
      <section className="py-24 relative">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative rounded-3xl overflow-hidden"
          >
            {/* Animated gradient border */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-emerald-500 to-purple-600 animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
            <div className="m-[2px] rounded-[22px] relative overflow-hidden" style={{ background: 'var(--gradient-hero)' }}>
              {/* Background effects */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-transparent to-emerald-600/10" />
              <div className="absolute top-0 left-1/4 w-72 h-72 bg-purple-500/15 rounded-full blur-3xl animate-float" />
              <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />
              {/* Grid pattern */}
              <div className="absolute inset-0 opacity-[0.03]" style={{
                backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
                backgroundSize: '40px 40px',
              }} />

              <div className="relative px-8 py-16 sm:px-12 sm:py-20">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 mb-6 text-sm text-gray-300">
                  <Rocket className="w-4 h-4 text-emerald-400" />
                  {t("common.free")}
                </div>
                <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-5 tracking-tight">
                  {t("landing.readyTitle")}
                </h2>
                <p className="text-gray-300 mb-10 max-w-xl mx-auto text-lg leading-relaxed">
                  {t("landing.readyDescription")}
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                    href="/courses"
                    className="group flex items-center gap-2 px-8 py-4 rounded-xl text-lg font-semibold text-white bg-gradient-to-r from-purple-600 to-emerald-500 hover:from-purple-500 hover:to-emerald-400 transition-all shadow-2xl shadow-purple-500/25 hover:shadow-purple-500/40 hover:-translate-y-0.5"
                  >
                    {t("common.startLearning")}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    href="/leaderboard"
                    className="flex items-center gap-2 px-8 py-4 rounded-xl text-lg font-semibold text-white/80 border border-white/10 hover:bg-white/5 transition-all"
                  >
                    <Trophy className="w-5 h-5 text-amber-400" />
                    {t("nav.leaderboard")}
                  </Link>
                </div>
                {/* Trust badges at bottom */}
                <div className="flex items-center justify-center gap-6 mt-10 text-xs text-gray-400">
                  <div className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" /> {t("landing.onChainCredentials")}</div>
                  <div className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> 3 {t("common.language")}s</div>
                  <div className="flex items-center gap-1.5"><Code className="w-3.5 h-3.5" /> Open Source</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
