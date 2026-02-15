"use client";

import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Trophy,
  Flame,
  Shield,
  Code,
  Users,
  Wallet,
  GraduationCap,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const FEATURE_ICONS = [BookOpen, Trophy, Flame, Shield, Code, Users] as const;
const FEATURE_KEYS = [
  "featureInteractive",
  "featureXP",
  "featureStreak",
  "featureCredential",
  "featureChallenge",
  "featureCommunity",
] as const;

const STEP_ICONS = [Wallet, GraduationCap, Award] as const;
const STEP_KEYS = ["stepConnect", "stepLearn", "stepEarn"] as const;

const TRACK_KEYS = ["trackAnchor", "trackRust", "trackDefi", "trackSecurity"] as const;
const TRACK_COLORS = [
  "from-[#008c4c] to-[#2f6b3f]",
  "from-[#ffd23f] to-[#f7eacb]",
  "from-[#2f6b3f] to-[#1b231d]",
  "from-[#1b231d] to-[#2f6b3f]",
];
const TRACK_COURSES = [3, 2, 2, 1];
const TRACK_IDS = [1, 2, 3, 4];

const STAT_VALUES = ["20+", "5,000+", "2M+", "1,200+"];
const STAT_KEYS = ["statCourses", "statLearners", "statXP", "statCredentials"] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

export function LandingContent() {
  const t = useTranslations("landing");
  const tc = useTranslations("common");

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 py-20 sm:py-28">
        <motion.div
          className="absolute top-20 left-1/4 -z-10 h-72 w-72 rounded-full bg-[#008c4c]/10 blur-3xl"
          animate={{ x: [0, 30, -20, 0], y: [0, -20, 15, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute top-40 right-1/4 -z-10 h-72 w-72 rounded-full bg-[#ffd23f]/10 blur-3xl"
          animate={{ x: [0, -25, 20, 0], y: [0, 25, -15, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute bottom-10 left-1/2 -z-10 h-56 w-56 rounded-full bg-[#2f6b3f]/8 blur-3xl"
          animate={{ x: [0, 20, -30, 0], y: [0, -15, 20, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        />

        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
          <motion.div variants={staggerContainer} initial="hidden" animate="visible">
            <motion.div variants={fadeUp}>
              <Badge variant="secondary" className="mb-6">
                {t("badge")}
              </Badge>
            </motion.div>
            <motion.h1
              variants={fadeUp}
              className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
            >
              {t("heroTitle1")}
              <br />
              <span className="rounded-md bg-white/60 px-2 -mx-2 dark:bg-transparent">
                <span className="bg-gradient-to-r from-[#008c4c] to-[#ffd23f] bg-clip-text text-transparent">
                  {t("heroTitle2")}
                </span>
              </span>
            </motion.h1>
            <motion.p
              variants={fadeUp}
              className="mt-6 max-w-lg text-lg text-muted-foreground"
            >
              {t("heroDescription")}
            </motion.p>
            <motion.div variants={fadeUp} className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Button asChild size="xl" variant="solana">
                <Link href="/courses">
                  {t("startLearning")} <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="xl" variant="outline">
                <Link href="/leaderboard">{t("viewLeaderboard")}</Link>
              </Button>
            </motion.div>
          </motion.div>

          <motion.div
            className="relative mx-auto w-full max-w-md lg:max-w-none"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Image
                src="/hero-toucan.jpg"
                alt="Superteam Brasil mascot"
                width={500}
                height={500}
                className="rounded-2xl"
                priority
              />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y bg-muted/30 px-4 py-12">
        <motion.div
          className="mx-auto grid max-w-5xl grid-cols-2 gap-8 md:grid-cols-4"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {STAT_KEYS.map((key, i) => (
            <motion.div key={key} variants={fadeUp} className="text-center">
              <p className="text-3xl font-bold">
                <span className="rounded bg-white/60 px-1 -mx-1 dark:bg-transparent">
                  <span className="bg-gradient-to-r from-[#008c4c] to-[#ffd23f] bg-clip-text text-transparent">
                    {STAT_VALUES[i]}
                  </span>
                </span>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{t(key)}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* How It Works */}
      <section className="px-4 py-24">
        <div className="mx-auto max-w-5xl">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold sm:text-4xl">{t("howItWorks")}</h2>
            <p className="mt-4 text-lg text-muted-foreground">{t("howItWorksSubtitle")}</p>
          </motion.div>

          <motion.div
            className="relative mt-16 grid gap-8 sm:grid-cols-3"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            <div className="absolute top-10 left-[16.67%] right-[16.67%] hidden h-px bg-border sm:block" />

            {STEP_KEYS.map((key, i) => {
              const Icon = STEP_ICONS[i];
              return (
                <motion.div
                  key={key}
                  variants={fadeUp}
                  className="relative flex flex-col items-center text-center"
                >
                  <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full border-2 border-primary bg-background">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                  <span className="mt-1 text-xs font-bold text-primary">
                    {t("step", { number: i + 1 })}
                  </span>
                  <h3 className="mt-3 text-lg font-semibold">{t(`${key}Title`)}</h3>
                  <p className="mt-2 text-sm text-muted-foreground max-w-[250px]">
                    {t(`${key}Description`)}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Learning Paths */}
      <section className="border-t bg-muted/20 px-4 py-24">
        <div className="mx-auto max-w-6xl">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold sm:text-4xl">{t("learningPaths")}</h2>
            <p className="mt-4 text-lg text-muted-foreground">{t("learningPathsSubtitle")}</p>
          </motion.div>
          <motion.div
            className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            {TRACK_KEYS.map((key, i) => (
              <motion.div key={key} variants={fadeUp}>
                <Link href={`/courses?track=${TRACK_IDS[i]}`}>
                  <motion.div
                    whileHover={{ scale: 1.03, y: -4 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <Card className="group cursor-pointer transition-shadow hover:shadow-lg">
                      <CardContent className="p-6">
                        <div className={`h-2 w-12 rounded-full bg-gradient-to-r ${TRACK_COLORS[i]} mb-4`} />
                        <h3 className="font-semibold group-hover:text-solana-purple transition-colors">
                          {t(key)}
                        </h3>
                        <p className="mt-2 text-sm text-muted-foreground">{t(`${key}Desc`)}</p>
                        <p className="mt-4 text-xs font-medium text-muted-foreground">
                          {tc("courses", { count: TRACK_COURSES[i] })}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-24">
        <div className="mx-auto max-w-6xl">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold sm:text-4xl">{t("whyTitle")}</h2>
            <p className="mt-4 text-lg text-muted-foreground">{t("whySubtitle")}</p>
          </motion.div>
          <motion.div
            className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            {FEATURE_KEYS.map((key, i) => {
              const Icon = FEATURE_ICONS[i];
              return (
                <motion.div key={key} variants={fadeUp}>
                  <Card className="border-0 bg-transparent shadow-none">
                    <CardContent className="p-0">
                      <motion.div
                        className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10"
                        whileHover={{ scale: 1.1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      >
                        <Icon className="h-6 w-6 text-primary" />
                      </motion.div>
                      <h3 className="mt-4 font-semibold">{t(`${key}Title`)}</h3>
                      <p className="mt-2 text-sm text-muted-foreground">{t(`${key}Desc`)}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Community */}
      <section className="border-t bg-muted/20 px-4 py-24">
        <div className="mx-auto max-w-4xl">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold sm:text-4xl">{t("communityTitle")}</h2>
            <p className="mt-4 text-lg text-muted-foreground">{t("communitySubtitle")}</p>
          </motion.div>
          <motion.div
            className="mt-10 flex flex-wrap justify-center gap-4"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            <motion.div variants={fadeUp}>
              <Button asChild size="lg" variant="outline" className="gap-2">
                <a href="https://discord.gg/superteambrasil" target="_blank" rel="noopener noreferrer">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
                  {t("joinDiscord")}
                </a>
              </Button>
            </motion.div>
            <motion.div variants={fadeUp}>
              <Button asChild size="lg" variant="outline" className="gap-2">
                <a href="https://x.com/SuperteamBR" target="_blank" rel="noopener noreferrer">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  {t("followTwitter")}
                </a>
              </Button>
            </motion.div>
            <motion.div variants={fadeUp}>
              <Button asChild size="lg" variant="outline" className="gap-2">
                <Link href="/community/threads">
                  <Users className="h-5 w-5" />
                  {t("viewThreads")}
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden px-4 py-24">
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#008c4c]/5 via-transparent to-transparent" />
        <motion.div
          className="mx-auto max-w-3xl text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl font-bold sm:text-4xl">{t("ctaTitle")}</h2>
          <p className="mt-4 text-lg text-muted-foreground">{t("ctaDescription")}</p>
          <Button asChild size="xl" variant="solana" className="mt-8 group">
            <Link href="/courses">
              {t("browseCourses")}{" "}
              <motion.span
                className="inline-flex"
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <ArrowRight className="h-5 w-5" />
              </motion.span>
            </Link>
          </Button>
        </motion.div>
      </section>
    </div>
  );
}
