"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { COURSE_CARDS, TESTIMONIALS } from "@/lib/mock-data";
import {
  GraduationCap,
  Code,
  Trophy,
  Shield,
  Users,
  Layers,
  BookOpen,
  Award,
  Flame,
  Star,
  ArrowRight,
  ChevronRight,
  UserPlus,
  Route,
} from "lucide-react";
import { motion, useMotionValue, useTransform, animate, useInView } from "framer-motion";
import { useEffect, useRef } from "react";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.1 } },
};

/* ---------- Animated counter component ---------- */
function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionVal = useMotionValue(0);
  const rounded = useTransform(motionVal, (v) => {
    if (Number.isInteger(value)) return Math.round(v).toLocaleString();
    return v.toFixed(1);
  });
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      animate(motionVal, value, { duration: 2, ease: "easeOut" });
    }
  }, [isInView, motionVal, value]);

  return (
    <span ref={ref} className="tabular-nums">
      <motion.span>{rounded}</motion.span>
      {suffix}
    </span>
  );
}

/* ---------- Partner logos – uses all available logos ---------- */
const PARTNERS = [
  { name: "Solana", logo: "/logos/partners/solana.svg" },
  { name: "Phantom", logo: "/logos/partners/phantom.svg" },
  { name: "Helius", logo: "/logos/partners/helius.svg" },
  { name: "Magic Eden", logo: "/logos/partners/magiceden.svg" },
  { name: "Backpack", logo: "/logos/partners/backpack.svg" },
  { name: "Solflare", logo: "/logos/partners/solflare.svg" },
  { name: "Superteam", logo: "/logos/partners/superteam.svg" },
  { name: "Titan", logo: "/logos/partners/titan.svg" },
];

/* ---------- Learning paths ---------- */
const LEARNING_PATHS = [
  {
    id: "solana-fundamentals",
    titleKey: "path1Title" as const,
    descKey: "path1Desc" as const,
    icon: BookOpen,
    courses: 4,
    totalXP: 5200,
    color: "#D4A843",
    stages: ["Intro to Solana", "Accounts & PDAs", "Programs", "Security"],
  },
  {
    id: "defi-developer",
    titleKey: "path2Title" as const,
    descKey: "path2Desc" as const,
    icon: Layers,
    courses: 3,
    totalXP: 4800,
    color: "#4A8B5C",
    stages: ["Token Mechanics", "AMMs & Liquidity", "Lending & Staking"],
  },
  {
    id: "fullstack-web3",
    titleKey: "path3Title" as const,
    descKey: "path3Desc" as const,
    icon: Code,
    courses: 3,
    totalXP: 4500,
    color: "#00D1FF",
    stages: ["Wallet Integration", "Transactions", "Production dApps"],
  },
];

/* ---------- How it works steps ---------- */
const HOW_IT_WORKS = [
  { titleKey: "howStep1Title" as const, descKey: "howStep1Desc" as const, icon: UserPlus, step: 1 },
  { titleKey: "howStep2Title" as const, descKey: "howStep2Desc" as const, icon: Route, step: 2 },
  { titleKey: "howStep3Title" as const, descKey: "howStep3Desc" as const, icon: Code, step: 3 },
  { titleKey: "howStep4Title" as const, descKey: "howStep4Desc" as const, icon: Award, step: 4 },
];

/* ---------- Testimonial colors for avatar backgrounds ---------- */
const AVATAR_COLORS = ["#D4A843", "#4A8B5C", "#00D1FF"];

export default function LandingPage() {
  const t = useTranslations("landing");
  const tc = useTranslations("common");

  const features = [
    { icon: BookOpen, title: t("feature1Title"), desc: t("feature1Desc") },
    { icon: Shield, title: t("feature2Title"), desc: t("feature2Desc") },
    { icon: Trophy, title: t("feature3Title"), desc: t("feature3Desc") },
    { icon: Code, title: t("feature4Title"), desc: t("feature4Desc") },
    { icon: Users, title: t("feature5Title"), desc: t("feature5Desc") },
    { icon: Layers, title: t("feature6Title"), desc: t("feature6Desc") },
  ];

  const stats = [
    { value: 2500, suffix: "+", label: t("statsStudents") },
    { value: 25, suffix: "+", label: t("statsCourses") },
    { value: 500, suffix: "+", label: t("statsCredentials") },
    { value: 1.2, suffix: "M+", label: t("statsXP") },
  ];

  return (
    <div className="flex flex-col">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden px-4 py-24 sm:py-32 lg:py-40">
        {/* Background decorations */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-gold/10" />
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-[300px] w-[400px] rounded-full bg-gold/5 blur-3xl" />

        <div className="relative mx-auto max-w-7xl text-center">
          <motion.div {...fadeIn}>
            <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm">
              <Flame className="mr-1.5 h-3.5 w-3.5 text-primary" />
              {tc("new")} — Web3 Frontend Course
            </Badge>
            <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              <span className="bg-gradient-to-r from-primary via-gold to-green-accent bg-clip-text text-transparent">
                {t("heroTitle")}
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
              {t("heroSubtitle")}
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/courses">
                <Button size="lg" className="gap-2 text-base">
                  {t("heroCTA")}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/courses">
                <Button size="lg" variant="outline" className="gap-2 text-base">
                  {t("heroSecondaryCTA")}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Stats with animated counters ── */}
      <section className="border-y bg-card/50 px-4 py-12">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((stat) => (
            <motion.div
              key={stat.label}
              className="text-center"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
            >
              <p className="text-3xl font-bold text-primary sm:text-4xl">
                <AnimatedCounter value={stat.value} suffix={stat.suffix} />
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Partner Logos – Infinite Marquee ── */}
      <section className="px-4 py-12">
        <div className="mx-auto max-w-7xl">
          <p className="text-center text-sm font-medium uppercase tracking-wider text-muted-foreground">
            {t("partnersTitle")}
          </p>
        </div>
        <div className="relative mt-8 overflow-hidden">
          {/* Fade edges */}
          <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-24 bg-gradient-to-r from-background to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-24 bg-gradient-to-l from-background to-transparent" />
          {/* Marquee track – framer-motion for reliable scrolling */}
          <motion.div
            className="flex w-max items-center gap-16"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ x: { duration: 30, ease: "linear", repeat: Infinity } }}
          >
            {[...PARTNERS, ...PARTNERS].map((p, i) => (
              <div
                key={`${p.name}-${i}`}
                aria-label={p.name}
                className="h-8 w-24 shrink-0 bg-current text-muted-foreground/50 transition-colors duration-300 hover:text-foreground sm:h-10 sm:w-32"
                style={{
                  maskImage: `url(${p.logo})`,
                  WebkitMaskImage: `url(${p.logo})`,
                  maskSize: "contain",
                  WebkitMaskSize: "contain",
                  maskRepeat: "no-repeat",
                  WebkitMaskRepeat: "no-repeat",
                  maskPosition: "center",
                  WebkitMaskPosition: "center",
                }}
              />
            ))}
          </motion.div>
        </div>
      </section>


      {/* ── Features ── */}
      <section className="px-4 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl">
          <motion.h2
            className="text-center text-3xl font-bold sm:text-4xl"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            {t("featuresTitle")}
          </motion.h2>
          <motion.div
            className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {features.map((feature) => (
              <motion.div key={feature.title} variants={fadeIn}>
                <Card className="group h-full transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1">
                  <CardContent className="p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {feature.desc}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="border-y bg-card/30 px-4 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl">
          <motion.h2
            className="text-center text-3xl font-bold sm:text-4xl"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            {t("howItWorksTitle")}
          </motion.h2>
          <div className="relative mt-16">
            {/* Horizontal connector line behind the cards (desktop only) */}
            <div className="absolute left-[12.5%] right-[12.5%] top-10 hidden h-px bg-gradient-to-r from-primary/10 via-primary/30 to-primary/10 lg:block" />
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {HOW_IT_WORKS.map((step, idx) => (
                <motion.div
                  key={step.step}
                  className="relative z-10 text-center"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.15 }}
                >
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border border-primary/20 bg-card shadow-sm">
                    <step.icon className="h-8 w-8 text-primary" />
                  </div>
                  <span className="mt-3 inline-block rounded-full bg-primary/10 px-3 py-0.5 text-xs font-bold text-primary">
                    {step.step}
                  </span>
                  <h3 className="mt-3 text-lg font-semibold">{t(step.titleKey)}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t(step.descKey)}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Learning Paths ── */}
      <section className="px-4 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <motion.h2
              className="text-3xl font-bold sm:text-4xl"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              {t("pathsTitle")}
            </motion.h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              {t("pathsSubtitle")}
            </p>
          </div>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {LEARNING_PATHS.map((path, idx) => (
              <motion.div
                key={path.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="group relative h-full overflow-hidden transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1">
                  {/* Top accent bar */}
                  <div
                    className="h-1 w-full"
                    style={{ background: `linear-gradient(to right, ${path.color}, ${path.color}80)` }}
                  />
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg"
                        style={{ backgroundColor: `${path.color}20` }}
                      >
                        <path.icon className="h-6 w-6" style={{ color: path.color }} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{t(path.titleKey)}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {t(path.descKey)}
                        </p>
                      </div>
                    </div>

                    {/* Stage progression */}
                    <div className="mt-6 space-y-2">
                      {path.stages.map((stage, sIdx) => (
                        <div key={stage} className="flex items-center gap-3">
                          <div
                            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                            style={{ backgroundColor: path.color }}
                          >
                            {sIdx + 1}
                          </div>
                          <span className="text-sm">{stage}</span>
                          {sIdx < path.stages.length - 1 && (
                            <ChevronRight className="ml-auto h-3.5 w-3.5 text-muted-foreground/40" />
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Meta + CTA */}
                    <div className="mt-6 flex items-center justify-between border-t pt-4">
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>{t("pathCourses", { count: path.courses })}</span>
                        <span>{t("pathXP", { count: path.totalXP.toLocaleString() })}</span>
                      </div>
                      <Link href="/courses">
                        <Button size="sm" variant="ghost" className="gap-1 text-xs">
                          {t("pathStart")}
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Courses ── */}
      <section className="bg-card/50 px-4 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold sm:text-3xl">{tc("courses")}</h2>
            <Link href="/courses">
              <Button variant="ghost" className="gap-1">
                {tc("viewAll")}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {COURSE_CARDS.slice(0, 3).map((course) => (
              <Link key={course.id} href={`/courses/${course.slug}`}>
                <Card className="group h-full transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <Badge
                        variant="outline"
                        style={{
                          borderColor: course.trackColor,
                          color: course.trackColor,
                        }}
                      >
                        {course.trackName}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {tc(course.difficulty)}
                      </Badge>
                    </div>
                    <h3 className="mt-4 text-lg font-semibold group-hover:text-primary transition-colors">
                      {course.title}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                      {course.description}
                    </p>
                    <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-3.5 w-3.5" />
                        {course.totalLessons} {tc("lessons")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5" />
                        {course.totalXP} {tc("xp")}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials with avatars ── */}
      <section className="px-4 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl">
          <motion.h2
            className="text-center text-2xl font-bold sm:text-3xl"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            {t("testimonialsTitle")}
          </motion.h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {TESTIMONIALS.map((testimonial, idx) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="h-full transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
                  <CardContent className="p-6">
                    <div className="flex gap-1 text-primary">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground italic">
                      &ldquo;{testimonial.quote}&rdquo;
                    </p>
                    <div className="mt-4 flex items-center gap-3">
                      {testimonial.avatar ? (
                        <img
                          src={testimonial.avatar}
                          alt={testimonial.name}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
                          style={{ backgroundColor: AVATAR_COLORS[idx % AVATAR_COLORS.length] }}
                        >
                          {testimonial.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium">{testimonial.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {testimonial.role}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="px-4 py-20 sm:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            className="rounded-2xl bg-gradient-to-r from-primary/10 via-gold/10 to-green-accent/10 p-12"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <Award className="mx-auto h-12 w-12 text-primary" />
            <h2 className="mt-4 text-3xl font-bold">{t("ctaTitle")}</h2>
            <p className="mt-3 text-muted-foreground">{t("ctaSubtitle")}</p>
            <Link href="/courses">
              <Button size="lg" className="mt-8 gap-2">
                {t("ctaButton")}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
