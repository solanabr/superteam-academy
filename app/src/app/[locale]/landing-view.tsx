"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

import type { CourseCardData, Track } from "@/types/course";
import type { Testimonial } from "@/services/interfaces";
import { useBulkEnrollments } from "@/hooks/use-bulk-enrollments";
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
  LogIn,
  User,
  Rocket,
  MessageSquarePlus,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { SignInModal } from "@/components/auth/sign-in-modal";
import Image from "next/image";

/* ---------- useScrollReveal hook ---------- */
function useScrollReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 },
    );

    // Observe the container and all children with fade-in-view
    const targets = el.classList.contains("fade-in-view")
      ? [el]
      : el.querySelectorAll(".fade-in-view");
    targets.forEach((t) => observer.observe(t));

    return () => observer.disconnect();
  }, []);

  return ref;
}

/* ---------- Animated counter component ---------- */
function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState("0");
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || hasAnimated.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          hasAnimated.current = true;
          observer.disconnect();

          const isInt = Number.isInteger(value);
          const duration = 2000;
          const start = performance.now();

          function tick(now: number) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // easeOut quad
            const eased = 1 - (1 - progress) * (1 - progress);
            const current = eased * value;

            if (isInt) {
              setDisplay(Math.round(current).toLocaleString());
            } else {
              setDisplay(current.toFixed(1));
            }

            if (progress < 1) {
              requestAnimationFrame(tick);
            }
          }

          requestAnimationFrame(tick);
        }
      },
      { once: true } as IntersectionObserverInit,
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [value]);

  return (
    <span ref={ref} className="tabular-nums">
      <span>{display}</span>
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

/* ---------- Static learning paths (fallback) ---------- */
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

/* ---------- (Track icons removed — using BookOpen for all tracks) ---------- */

/* ---------- How it works steps ---------- */
const HOW_IT_WORKS = [
  { titleKey: "howStep1Title" as const, descKey: "howStep1Desc" as const, icon: UserPlus, step: 1 },
  { titleKey: "howStep2Title" as const, descKey: "howStep2Desc" as const, icon: Route, step: 2 },
  { titleKey: "howStep3Title" as const, descKey: "howStep3Desc" as const, icon: Code, step: 3 },
  { titleKey: "howStep4Title" as const, descKey: "howStep4Desc" as const, icon: Award, step: 4 },
];

/* ---------- Testimonial colors for avatar backgrounds ---------- */
const AVATAR_COLORS = ["#D4A843", "#4A8B5C", "#00D1FF"];

export interface PlatformStats {
  students: number;
  activeCourses: number;
  credentials: number;
  totalXp: number;
}

interface LandingViewProps {
  courseCards: CourseCardData[];
  activeTracks: Track[];
  testimonials?: Testimonial[];
  platformStats?: PlatformStats;
}

export default function LandingView({ courseCards, activeTracks, testimonials: dbTestimonials, platformStats }: LandingViewProps) {
  const t = useTranslations("landing");
  const tc = useTranslations("common");

  const heroRef = useScrollReveal<HTMLDivElement>();
  const statsRef = useScrollReveal<HTMLDivElement>();
  const featuresRef = useScrollReveal<HTMLDivElement>();
  const howRef = useScrollReveal<HTMLDivElement>();
  const pathsRef = useScrollReveal<HTMLDivElement>();
  const testimonialsRef = useScrollReveal<HTMLDivElement>();
  const ctaRef = useScrollReveal<HTMLDivElement>();

  const features = [
    { icon: BookOpen, title: t("feature1Title"), desc: t("feature1Desc") },
    { icon: Shield, title: t("feature2Title"), desc: t("feature2Desc") },
    { icon: Trophy, title: t("feature3Title"), desc: t("feature3Desc") },
    { icon: Code, title: t("feature4Title"), desc: t("feature4Desc") },
    { icon: Users, title: t("feature5Title"), desc: t("feature5Desc") },
    { icon: Layers, title: t("feature6Title"), desc: t("feature6Desc") },
  ];

  const xpDisplay = (platformStats?.totalXp ?? 0) >= 1_000_000
    ? { value: Math.round((platformStats?.totalXp ?? 0) / 100_000) / 10, suffix: "M+" }
    : (platformStats?.totalXp ?? 0) >= 1000
      ? { value: Math.round((platformStats?.totalXp ?? 0) / 100) / 10, suffix: "K+" }
      : { value: platformStats?.totalXp ?? 0, suffix: "+" };

  const stats = [
    { value: platformStats?.students ?? 0, suffix: "+", label: t("statsStudents") },
    { value: platformStats?.activeCourses ?? 0, suffix: "+", label: t("statsCourses") },
    { value: platformStats?.credentials ?? 0, suffix: "+", label: t("statsCredentials") },
    { value: xpDisplay.value, suffix: xpDisplay.suffix, label: t("statsXP") },
  ];

  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;
  const [signInOpen, setSignInOpen] = useState(false);
  const [testimonialOpen, setTestimonialOpen] = useState(false);
  const [testimonialQuote, setTestimonialQuote] = useState("");
  const [testimonialRole, setTestimonialRole] = useState("");
  const [submittingTestimonial, setSubmittingTestimonial] = useState(false);

  const displayTestimonials = (dbTestimonials ?? []).map((t) => ({ name: t.name, role: t.role ?? "", quote: t.quote, avatar: t.avatarUrl, id: t.id }));

  async function handleTestimonialSubmit() {
    if (!testimonialQuote.trim()) return;
    setSubmittingTestimonial(true);
    try {
      const res = await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quote: testimonialQuote, role: testimonialRole }),
      });
      if (res.ok) {
        toast.success(t("testimonialSubmitted"));
        setTestimonialQuote("");
        setTestimonialRole("");
        setTestimonialOpen(false);
      }
    } catch { /* keep dialog open */ }
    setSubmittingTestimonial(false);
  }

  const { enrollments } = useBulkEnrollments(courseCards);

  function getTrackCourses(track: Track): CourseCardData[] {
    return courseCards.filter((c) => c.trackName === track.name);
  }

  function getTrackProgress(track: Track): number {
    const courses = getTrackCourses(track);
    if (!courses.length) return 0;
    const enrolled = enrollments.filter((e) => courses.some((c) => c.courseId === e.courseId));
    if (!enrolled.length) return 0;
    return enrolled.reduce((sum, e) => sum + e.progressPct, 0) / courses.length;
  }

  function getTrackCTA(track: Track): { label: string; href: string } {
    const courses = getTrackCourses(track);
    if (!session?.user) return { label: t("pathExplore"), href: "/courses" };
    const progress = getTrackProgress(track);
    if (progress > 0) {
      const next = courses.find((c) => {
        const e = enrollments.find((e) => e.courseId === c.courseId);
        return !e || e.progressPct < 100;
      });
      return { label: t("pathContinue"), href: `/courses/${next?.slug ?? ""}` };
    }
    return { label: t("pathStart"), href: `/courses?track=${track.slug}` };
  }

  const showDynamicTracks = activeTracks.length > 0;

  return (
    <div className="flex flex-col">
      <SignInModal open={signInOpen} onOpenChange={setSignInOpen} />
      {/* ── Hero ── */}
      <section className="relative overflow-hidden px-4 py-24 sm:py-32 lg:py-40">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden bg-gradient-to-br from-primary/10 via-transparent to-gold/10" />
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-[300px] w-[400px] rounded-full bg-gold/5 blur-3xl" />

        <div className="relative mx-auto max-w-7xl text-center">
          <div ref={heroRef} className="fade-in-view">
            {courseCards.length > 0 ? (
              <Link href={`/courses/${courseCards[0].slug}`}>
                <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm cursor-pointer hover:bg-accent transition-colors">
                  <Flame className="mr-1.5 h-3.5 w-3.5 text-primary" />
                  {t("newCourse")} - {courseCards[0].title}
                </Badge>
              </Link>
            ) : (
              <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm">
                <Flame className="mr-1.5 h-3.5 w-3.5 text-primary" />
                {tc("new")}
              </Badge>
            )}
            <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              <span className="bg-gradient-to-r from-primary via-gold to-green-accent bg-clip-text text-transparent">
                {t("heroTitle")}
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
              {t("heroSubtitle")}
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              {isLoggedIn ? (
                <>
                  <Link href="/dashboard">
                    <Button size="lg" className="gap-2 text-base">
                      {t("heroCTALoggedIn")}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/profile">
                    <Button size="lg" variant="outline" className="gap-2 text-base">
                      {t("heroSecondaryCTALoggedIn")}
                      <User className="h-4 w-4" />
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Button
                    size="lg"
                    className="gap-2 text-base"
                    onClick={() => setSignInOpen(true)}
                  >
                    {t("findYourPath")}
                    <Rocket className="h-4 w-4" />
                  </Button>
                  <Link href="/courses">
                    <Button size="lg" variant="outline" className="gap-2 text-base">
                      {t("heroCTA")}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats with animated counters ── */}
      <section className="border-y bg-card/50 px-4 py-12">
        <div ref={statsRef} className="mx-auto grid max-w-7xl grid-cols-2 gap-4 sm:gap-8 md:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="fade-in-view text-center"
            >
              <p className="text-3xl font-bold text-primary sm:text-4xl">
                <AnimatedCounter value={stat.value} suffix={stat.suffix} />
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
            </div>
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
          {/* Marquee track – CSS animation with hover pause */}
          <div
            className="flex w-max items-center gap-16 animate-marquee hover:[animation-play-state:paused]"
            style={{ ["--marquee-duration" as string]: "30s" }}
          >
            {[...PARTNERS, ...PARTNERS].map((p, i) => (
              <div
                key={`${p.name}-${i}`}
                role="img"
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
          </div>
        </div>
      </section>


      {/* ── Features ── */}
      <section className="px-4 py-20 sm:py-24">
        <div ref={featuresRef} className="mx-auto max-w-7xl">
          <h2
            className="fade-in-view text-center text-3xl font-bold sm:text-4xl"
          >
            {t("featuresTitle")}
          </h2>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.title} className="fade-in-view">
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
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="border-y bg-card/30 px-4 py-20 sm:py-24">
        <div ref={howRef} className="mx-auto max-w-7xl">
          <h2
            className="fade-in-view text-center text-3xl font-bold sm:text-4xl"
          >
            {t("howItWorksTitle")}
          </h2>
          <div className="relative mt-16">
            {/* Horizontal connector line behind the cards (desktop only) */}
            <div className="absolute left-[12.5%] right-[12.5%] top-10 hidden h-px bg-gradient-to-r from-primary/10 via-primary/30 to-primary/10 lg:block" />
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {HOW_IT_WORKS.map((step) => (
                <div
                  key={step.step}
                  className="fade-in-view relative z-10 text-center"
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
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Learning Paths ── */}
      <section className="px-4 py-20 sm:py-24">
        <div ref={pathsRef} className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2
              className="fade-in-view text-3xl font-bold sm:text-4xl"
            >
              {t("pathsTitle")}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              {t("pathsSubtitle")}
            </p>
          </div>

          {showDynamicTracks ? (
            /* Dynamic tracks from Sanity */
            <div className="mt-12 grid gap-6 lg:grid-cols-3">
              {activeTracks.map((track) => {
                const TrackIcon = BookOpen;
                const courses = getTrackCourses(track);
                const totalXP = courses.reduce((sum, c) => sum + c.totalXP, 0);
                const stages = courses.slice(0, 4).map((c) => c.title);
                const progress = getTrackProgress(track);
                const cta = getTrackCTA(track);

                return (
                  <div
                    key={track.id}
                    className="fade-in-view"
                  >
                    <Card className="group relative h-full overflow-hidden transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1">
                      {/* Top accent bar */}
                      <div
                        className="h-1 w-full"
                        style={{ background: `linear-gradient(to right, ${track.color}, ${track.color}80)` }}
                      />
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div
                            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg"
                            style={{ backgroundColor: `${track.color}20` }}
                          >
                            <TrackIcon className="h-6 w-6" style={{ color: track.color }} />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold">{track.name}</h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {track.description}
                            </p>
                          </div>
                        </div>

                        {progress > 0 && (
                          <div className="mt-4">
                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                              <span>Progress</span>
                              <span>{Math.round(progress)}%</span>
                            </div>
                            <Progress value={progress} className="h-1.5" />
                          </div>
                        )}

                        {/* Stage progression */}
                        {stages.length > 0 && (
                          <div className="mt-6 space-y-2">
                            {stages.map((stage, sIdx) => (
                              <div key={stage} className="flex items-center gap-3">
                                <div
                                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                                  style={{ backgroundColor: track.color }}
                                >
                                  {sIdx + 1}
                                </div>
                                <span className="flex-1 truncate text-sm">{stage}</span>
                                {sIdx < stages.length - 1 && (
                                  <ChevronRight className="ml-auto h-3.5 w-3.5 text-muted-foreground/40" />
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Meta + CTA */}
                        <div className="mt-6 flex items-center justify-between border-t pt-4">
                          <div className="flex gap-4 text-xs text-muted-foreground">
                            <span>{t("pathCourses", { count: courses.length })}</span>
                            <span>{t("pathXP", { count: totalXP.toLocaleString() })}</span>
                          </div>
                          <Link href={cta.href}>
                            <Button size="sm" variant="ghost" className="gap-1 text-xs">
                              {cta.label}
                              <ArrowRight className="h-3 w-3" />
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Static fallback when program is not configured */
            <div className="mt-12 grid gap-6 lg:grid-cols-3">
              {LEARNING_PATHS.map((path) => (
                <div
                  key={path.id}
                  className="fade-in-view"
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
                </div>
              ))}
            </div>
          )}
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
            {courseCards.slice(0, 3).map((course) => (
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

      {/* ── Testimonials with marquee ── */}
      {displayTestimonials.length > 0 && <section className="px-4 py-20 sm:py-24">
        <div ref={testimonialsRef} className="mx-auto max-w-7xl">
          <div className="flex items-center justify-center gap-4">
            <h2
              className="fade-in-view text-center text-2xl font-bold sm:text-3xl"
            >
              {t("testimonialsTitle")}
            </h2>
            {isLoggedIn ? (
              <Dialog open={testimonialOpen} onOpenChange={setTestimonialOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <MessageSquarePlus className="h-4 w-4" />
                    {t("shareExperience")}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t("submitTestimonial")}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Textarea
                      placeholder={t("yourTestimonial")}
                      aria-label={t("yourTestimonial")}
                      value={testimonialQuote}
                      onChange={(e) => setTestimonialQuote(e.target.value)}
                      rows={4}
                    />
                    <Input
                      placeholder={t("yourRole")}
                      aria-label={t("yourRole")}
                      value={testimonialRole}
                      onChange={(e) => setTestimonialRole(e.target.value)}
                    />
                    <Button
                      className="w-full"
                      onClick={handleTestimonialSubmit}
                      disabled={submittingTestimonial || !testimonialQuote.trim()}
                    >
                      {submittingTestimonial ? "..." : tc("submit")}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            ) : (
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setSignInOpen(true)}>
                <LogIn className="h-4 w-4" />
                {t("loginToShare")}
              </Button>
            )}
          </div>
          <div className="relative mt-12 overflow-hidden">
            <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-20 bg-gradient-to-r from-background to-transparent" />
            <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-20 bg-gradient-to-l from-background to-transparent" />
            <div
              className="flex w-max items-stretch gap-6 animate-marquee"
              style={{ ["--marquee-duration" as string]: "45s" }}
            >
              {[...displayTestimonials, ...displayTestimonials].map((testimonial, idx) => (
                <Card key={`${testimonial.id}-${idx}`} className="w-[320px] shrink-0 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
                  <CardContent className="p-6">
                    <div role="img" aria-label="5 out of 5 stars" className="flex gap-1 text-primary">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground italic line-clamp-4">
                      &ldquo;{testimonial.quote}&rdquo;
                    </p>
                    <div className="mt-4 flex items-center gap-3">
                      {testimonial.avatar ? (
                        <Image
                          src={testimonial.avatar}
                          alt={testimonial.name}
                          width={40}
                          height={40}
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
              ))}
            </div>
          </div>
        </div>
      </section>}

      {/* ── Final CTA ── */}
      <section className="px-4 py-20 sm:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <div
            ref={ctaRef}
            className="fade-in-view rounded-2xl bg-gradient-to-r from-primary/10 via-gold/10 to-green-accent/10 p-12"
          >
            {isLoggedIn ? (
              <Rocket className="mx-auto h-12 w-12 text-primary" />
            ) : (
              <Award className="mx-auto h-12 w-12 text-primary" />
            )}
            <h2 className="mt-4 text-3xl font-bold">
              {isLoggedIn ? t("ctaTitleLoggedIn") : t("ctaTitle")}
            </h2>
            <p className="mt-3 text-muted-foreground">
              {isLoggedIn ? t("ctaSubtitleLoggedIn") : t("ctaSubtitle")}
            </p>
            {isLoggedIn ? (
              <Link href="/dashboard">
                <Button size="lg" className="mt-8 gap-2">
                  {t("ctaButtonLoggedIn")}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Button
                size="lg"
                className="mt-8 gap-2"
                onClick={() => setSignInOpen(true)}
              >
                {t("ctaButton")}
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
