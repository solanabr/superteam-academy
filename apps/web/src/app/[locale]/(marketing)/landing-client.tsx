"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import {
  Terminal,
  Scroll,
  Lightning,
  ChatCircle,
  Fire,
  GithubLogo,
  Wallet,
  GoogleLogo,
} from "@phosphor-icons/react";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { AuthModal } from "@/components/auth/auth-modal";
import { TerminalTypewriter } from "@/components/landing/terminal-typewriter";
import { createClient } from "@/lib/supabase/client";
import type { LearningPath } from "@/lib/sanity/types";
import type { DeployedAchievement } from "@/lib/sanity/queries";

/** Animate a number from 0 → target when the element scrolls into view. */
function useCountUp(target: number, duration = 1800) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  const animate = useCallback(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;
    const start = performance.now();
    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) animate();
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [animate]);

  return { ref, value };
}

function CountUpStat({
  target,
  label,
  color,
}: {
  target: number;
  label: string;
  color: string;
}) {
  const { ref, value } = useCountUp(target);
  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <span
        ref={ref}
        className={`font-mono text-2xl font-black tabular-nums sm:text-3xl md:text-4xl ${color}`}
      >
        {value.toLocaleString()}
      </span>
      <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-text-3">
        {label}
      </span>
    </div>
  );
}

interface LandingPageProps {
  courseCount: number;
  totalXpMinted: number;
  enrolledBuilders: number;
  credentialsIssued: number;
  learningPaths: LearningPath[];
  achievements: DeployedAchievement[];
}

export function LandingPageClient({
  courseCount,
  totalXpMinted,
  enrolledBuilders,
  credentialsIssued,
  learningPaths,
  achievements,
}: LandingPageProps) {
  const t = useTranslations("landing");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session?.user);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user);
    });
    return () => subscription.unsubscribe();
  }, []);

  const features = [
    {
      idx: "01",
      icon: Terminal,
      title: t("featureCodeTitle"),
      description: t("featureCodeDesc"),
    },
    {
      idx: "02",
      icon: Scroll,
      title: t("featureCertsTitle"),
      description: t("featureCertsDesc"),
    },
    {
      idx: "03",
      icon: Lightning,
      title: t("featureXpTitle"),
      description: t("featureXpDesc"),
    },
    {
      idx: "04",
      icon: ChatCircle,
      title: t("featureCommunityTitle"),
      description: t("featureCommunityDesc"),
    },
    {
      idx: "05",
      icon: Fire,
      title: t("featureStreaksTitle"),
      description: t("featureStreaksDesc"),
    },
    {
      idx: "06",
      icon: GithubLogo,
      title: t("featureOssTitle"),
      description: t("featureOssDesc"),
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1">
        {/* ── Hero ── */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10" aria-hidden="true">
            <div className="absolute -right-40 -top-40 h-[700px] w-[700px] rounded-full blur-[140px] [background:var(--primary-dim)]" />
            <div className="absolute -bottom-20 -left-20 h-[500px] w-[500px] rounded-full blur-[120px] [background:var(--accent-bg)]" />
          </div>

          <div className="container px-4 pb-16 pt-12 sm:pb-20 sm:pt-16 md:pb-28 md:pt-28">
            <div className="grid items-center gap-12 md:grid-cols-2 md:gap-16">
              <div>
                <div className="mb-6 inline-flex items-center gap-2 rounded-md border-[2.5px] border-border bg-card px-3 py-2 shadow-card">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-text-3">
                    {t("poweredBy")}
                  </span>
                  <Image
                    src="/ST-DARK-GREEN-HORIZONTAL.png"
                    alt="Superteam Brasil"
                    width={120}
                    height={24}
                    className="h-5 w-auto dark:hidden"
                  />
                  <Image
                    src="/ST-YELLOW-HORIZONTAL.png"
                    alt="Superteam Brasil"
                    width={120}
                    height={24}
                    className="hidden h-5 w-auto dark:block"
                  />
                </div>

                <h1 className="mb-5 font-display text-3xl font-black leading-[0.95] tracking-tight text-text sm:text-5xl md:text-6xl lg:text-7xl">
                  {t("heroTitle")}
                </h1>

                <p className="mb-2 max-w-md text-lg leading-relaxed text-text-2">
                  {t("heroSubtitle")}
                </p>
                <p className="mb-8 max-w-md text-base text-text-3">
                  {t("heroSubtitle2")}
                </p>

                <div className="flex flex-wrap gap-3">
                  <Button variant="push" size="lg" asChild>
                    <Link href={`/${locale}/courses`}>
                      {t("exploreCourses")} {"\u2192"}
                    </Link>
                  </Button>
                  {!isLoggedIn && (
                    <AuthModal
                      trigger={
                        <Button variant="outline" size="lg">
                          {tCommon("signUp")}
                        </Button>
                      }
                    />
                  )}
                </div>
              </div>

              {/* Desktop terminal */}
              <div className="hidden md:block" aria-hidden="true">
                <TerminalTypewriter />
              </div>

              {/* Mobile static code snippet */}
              <div className="md:hidden" aria-hidden="true">
                <div className="rounded-lg border-[2.5px] border-border bg-card shadow-card">
                  <div className="flex items-center gap-2 border-b-[2.5px] border-border px-4 py-3">
                    <div className="h-3 w-3 rounded-full border-[2px] [background:var(--danger-bg)] [border-color:var(--danger-border-s)]" />
                    <div className="h-3 w-3 rounded-full border-[2px] [background:var(--accent-bg)] [border-color:var(--accent-border)]" />
                    <div className="h-3 w-3 rounded-full border-[2px] [background:var(--success-bg)] [border-color:var(--success-border-s)]" />
                    <span className="ml-2 font-mono text-xs text-text-3">
                      lib.rs
                    </span>
                  </div>
                  <div className="p-4 font-mono text-[12px] leading-relaxed">
                    <div className="text-text-3">
                      <span className="opacity-50">1</span>{" "}
                      <span className="text-secondary">use</span>{" "}
                      anchor_lang::prelude::*;
                    </div>
                    <div className="text-text-3">
                      <span className="opacity-50">2</span>
                    </div>
                    <div className="text-text-3">
                      <span className="opacity-50">3</span>{" "}
                      <span className="text-[var(--accent)]">#[program]</span>
                    </div>
                    <div className="text-text-3">
                      <span className="opacity-50">4</span>{" "}
                      <span className="text-secondary">pub mod</span> academy{" "}
                      {"{"}
                    </div>
                    <div className="text-text-3">
                      <span className="opacity-50">5</span>{" "}
                      <span className="text-success">
                        {"// You'll build this."}
                      </span>
                    </div>
                    <div className="text-text-3">
                      <span className="opacity-50">6</span> {"}"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── On-Chain Stats ── */}
        <section className="py-12 md:py-16">
          <div className="container px-4">
            <div className="mb-6 flex items-end justify-end">
              <div className="hidden text-sm font-medium text-text-3 md:block">
                {t("statsComment")}
              </div>
            </div>
            <div className="card-chunky p-6 md:p-8">
              <div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-0">
                <CountUpStat
                  target={totalXpMinted}
                  label={t("statXpMinted")}
                  color="text-text"
                />
                <CountUpStat
                  target={enrolledBuilders}
                  label={t("statBuilders")}
                  color="text-text"
                />
                <CountUpStat
                  target={credentialsIssued}
                  label={t("statCredentials")}
                  color="text-text"
                />
                <CountUpStat
                  target={courseCount}
                  label={t("statCourses")}
                  color="text-text"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── Learning Paths — Bento Grid ── */}
        {learningPaths.length > 0 && (
          <section className="py-12 sm:py-20 md:py-28">
            <div className="container px-4">
              <div className="mb-8 flex items-end justify-between sm:mb-14">
                <h2 className="font-display text-2xl font-black tracking-[-0.5px] sm:text-3xl md:text-4xl">
                  {t("pathsTitle")}
                </h2>
                <div className="hidden text-sm font-medium text-text-3 md:block">
                  {t("pathsComment")}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {learningPaths
                  .filter((p) => (p.courses?.length ?? 0) > 0)
                  .map((path, i) => {
                    const isWide = i % 4 === 0 || i % 4 === 3;
                    const pathCourseCount = path.courses?.length ?? 0;

                    return (
                      <Link
                        key={path._id}
                        href={`/${locale}/courses`}
                        className={`card-chunky group relative flex min-h-[160px] flex-col overflow-hidden p-5 sm:min-h-[180px] sm:p-7 ${
                          isWide ? "md:col-span-2" : ""
                        }`}
                        style={
                          {
                            "--i": i,
                            animation: "card-in 0.4s ease both",
                            animationDelay: `${i * 80}ms`,
                          } as React.CSSProperties
                        }
                      >
                        {/* Ghost number */}
                        <span
                          className="pointer-events-none absolute -bottom-5 right-4 font-mono text-[110px] font-black leading-none opacity-[0.04]"
                          aria-hidden="true"
                        >
                          {String(i + 1).padStart(2, "0")}
                        </span>

                        <div className="relative flex flex-1 flex-col">
                          <h3
                            className={`mb-2 font-display font-black leading-tight transition-colors group-hover:text-primary ${
                              isWide ? "text-2xl" : "text-lg"
                            }`}
                          >
                            {path.title}
                          </h3>
                          <p
                            className={`mb-6 flex-1 leading-relaxed text-text-3 ${
                              isWide
                                ? "max-w-lg text-base"
                                : "line-clamp-3 text-sm"
                            }`}
                          >
                            {path.description}
                          </p>

                          <div className="mt-auto flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-primary">
                              {pathCourseCount} {tCommon("courses")}
                            </span>
                            <span className="text-text-3 transition-colors group-hover:text-primary">
                              {"\u2192"}
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
              </div>
            </div>
          </section>
        )}

        {/* ── Features ── */}
        <section className="border-y-[2.5px] border-border bg-subtle">
          <div className="container px-4 py-12 sm:py-20 md:py-28">
            <div className="mb-8 flex items-end justify-between sm:mb-14">
              <h2 className="font-display text-2xl font-black tracking-[-0.5px] sm:text-3xl md:text-4xl">
                {t("featuresTitle")}
              </h2>
              <div className="hidden text-sm font-medium text-text-3 md:block">
                {t("featuresComment")}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {features.map((feature, i) => {
                const Icon = feature.icon;
                const isTall = i === 0;
                const isFullWidth = i === features.length - 1;

                return (
                  <div
                    key={feature.idx}
                    className={`card-chunky group relative overflow-hidden p-5 sm:p-7 ${
                      isTall ? "flex flex-col md:row-span-2" : ""
                    } ${isFullWidth ? "md:col-span-3" : ""}`}
                    style={
                      {
                        "--i": i,
                        animation: "card-in 0.4s ease both",
                        animationDelay: `${i * 60}ms`,
                      } as React.CSSProperties
                    }
                  >
                    <Icon
                      size={isTall ? 28 : 22}
                      weight="bold"
                      className="text-primary"
                    />
                    <h3
                      className={`mb-2 mt-4 font-display font-black ${
                        isTall ? "text-2xl" : "text-lg"
                      }`}
                    >
                      {feature.title}
                    </h3>
                    <p
                      className={`leading-relaxed text-text-3 ${
                        isTall ? "text-base" : "text-sm"
                      }`}
                    >
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Gamification Showcase ── */}
        {achievements.length > 0 && (
          <section className="py-12 sm:py-20 md:py-28">
            <div className="container px-4">
              <div className="mb-8 flex items-end justify-between sm:mb-14">
                <h2 className="font-display text-2xl font-black tracking-[-0.5px] sm:text-3xl md:text-4xl">
                  {t("gamificationTitle")}
                </h2>
                <div className="hidden text-sm font-medium text-text-3 md:block">
                  {t("gamificationComment")}
                </div>
              </div>
            </div>

            {/* Achievement Marquee — full-width auto-scroll */}
            <div className="relative overflow-hidden">
              <div
                className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-[var(--bg)] to-transparent sm:w-20"
                aria-hidden="true"
              />
              <div
                className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-[var(--bg)] to-transparent sm:w-20"
                aria-hidden="true"
              />

              <div
                className="flex w-max gap-3 py-2 sm:gap-4"
                style={{ animation: "marquee 40s linear infinite" }}
              >
                {[
                  ...achievements,
                  ...achievements,
                  ...achievements,
                  ...achievements,
                ].map((ach, i) => (
                  <div key={`${ach.id}-${i}`} className="ach-item">
                    <div
                      className={`ach-medal ${ach.solTier ? "sol" : "earned"}`}
                      aria-hidden="true"
                    >
                      <div className="ach-face" />
                      <span className="ach-glyph">{ach.glyph}</span>
                    </div>
                    <div className="ach-info">
                      <p className="ach-name">{ach.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <p className="mx-auto mt-8 max-w-lg text-center text-sm leading-relaxed text-text-3">
              {t("gamificationCopy", { count: achievements.length })}
            </p>
          </section>
        )}

        {/* ── CTA ── */}
        <section className="relative overflow-hidden bg-[var(--primary-dark)]">
          <div
            className="absolute inset-0 opacity-[0.04]"
            aria-hidden="true"
            style={{
              backgroundImage:
                "radial-gradient(circle, #fff 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          />
          <div
            className="absolute -right-32 -top-32 h-[400px] w-[400px] rounded-full blur-[100px] [background:var(--primary-bg)]"
            aria-hidden="true"
          />

          <div className="container relative px-4 py-16 text-center sm:py-24 md:py-36">
            <h2 className="mb-4 font-display text-3xl font-black tracking-[-1px] text-white sm:text-4xl md:text-6xl">
              {t("ctaTitle")}
            </h2>
            <p className="mx-auto mb-10 max-w-md text-base text-white/50 sm:text-lg">
              {t("ctaSubtitle")}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              {!isLoggedIn && (
                <AuthModal
                  trigger={
                    <Button variant="pushAccent" size="lg">
                      {tCommon("getStarted")} {"\u2192"}
                    </Button>
                  }
                />
              )}
              <Button
                variant="push"
                size="lg"
                className="border-none bg-white text-[var(--secondary)] shadow-[0_4px_0_0_rgba(0,0,0,0.12)] hover:bg-white/95 active:shadow-[0_1px_0_0_rgba(0,0,0,0.12)]"
                asChild
              >
                <Link href={`/${locale}/courses`}>
                  {t("ctaExploreCourses")} {"\u2192"}
                </Link>
              </Button>
            </div>
            {!isLoggedIn && (
              <div className="mt-6 flex items-center justify-center gap-3 text-white/40">
                <Wallet size={18} />
                <GoogleLogo size={18} />
                <GithubLogo size={18} />
                <span className="text-sm">{t("ctaAuthMethods")}</span>
              </div>
            )}
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}
