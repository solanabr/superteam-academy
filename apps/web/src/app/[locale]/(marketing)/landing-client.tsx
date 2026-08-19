"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import {
  ChatCircle,
  GithubLogo,
  Lightning,
  Wallet,
  GoogleLogo,
} from "@phosphor-icons/react";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { AuthModal } from "@/components/auth/auth-modal";
import { useSocialReturnPending } from "@/hooks/use-social-return-pending";
import { AuthErrorToast } from "@/components/auth/auth-error-toast";
import { HeroShowcase } from "@/components/landing/hero-showcase";
import {
  BuildWidget,
  EarnWidget,
  ProveWidget,
} from "@/components/landing/loop-widgets";
import { createClient } from "@/lib/supabase/client";
import type { DeployedAchievement } from "@/lib/content/queries";

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
  href,
}: {
  target: number;
  label: string;
  color: string;
  /** Explorer receipt — the number links to its on-chain address. */
  href?: string;
}) {
  const { ref, value } = useCountUp(target);
  const inner = (
    <>
      <span
        ref={ref}
        className={`font-mono text-2xl font-black tabular-nums sm:text-3xl md:text-4xl ${color}`}
      >
        {value.toLocaleString()}
      </span>
      <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-text-3 transition-colors group-hover/stat:text-primary">
        {label}
        {href && (
          <span className="ml-1 opacity-0 transition-opacity group-hover/stat:opacity-100">
            {"↗"}
          </span>
        )}
      </span>
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="group/stat flex flex-col items-center gap-1 text-center focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
      >
        {inner}
      </a>
    );
  }
  return (
    <div className="group/stat flex flex-col items-center gap-1 text-center">
      {inner}
    </div>
  );
}

/**
 * A real devnet slot, read once from the public RPC, then ticked locally
 * (~2 slots per 800ms — the chain never stops, so neither does the page).
 * Renders nothing if the RPC is unreachable; never polls.
 */
function LiveSlot() {
  const [slot, setSlot] = useState<number | null>(null);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
    if (!url) return;
    let alive = true;
    let tick: ReturnType<typeof setInterval> | null = null;
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getSlot" }),
    })
      .then((r) => r.json())
      .then((j: { result?: unknown }) => {
        if (!alive || typeof j.result !== "number") return;
        setSlot(j.result);
        if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          tick = setInterval(
            () => setSlot((s) => (s === null ? s : s + 2)),
            800
          );
        }
      })
      .catch(() => {
        /* decorative — a dead RPC just hides the ticker */
      });
    return () => {
      alive = false;
      if (tick) clearInterval(tick);
    };
  }, []);

  if (slot === null) return null;
  return (
    <span aria-hidden="true">
      {" · slot "}
      <span className="tabular-nums text-text-2">{slot.toLocaleString()}</span>
    </span>
  );
}

/** Rise-in when scrolled into view, so animation plays where the visitor is looking. */
function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${inView ? "reveal-in" : ""} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}

/** Types its text like a terminal comment; instant under reduced motion. */
function TypedWedge({ text }: { text: string }) {
  const [chars, setChars] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setChars(text.length);
      setStarted(true);
      return;
    }
    // starts right after the headline's marker sweep lands
    const kickoff = setTimeout(() => setStarted(true), 750);
    return () => clearTimeout(kickoff);
  }, [text.length]);

  useEffect(() => {
    if (!started || chars >= text.length) return;
    const id = setTimeout(() => setChars((c) => c + 1), 24);
    return () => clearTimeout(id);
  }, [started, chars, text.length]);

  const done = chars >= text.length;
  return (
    <span>
      {text.slice(0, chars)}
      {!done && (
        <span
          className="ml-px inline-block h-[1em] w-[7px] translate-y-[2px] animate-pulse bg-primary align-middle opacity-80"
          aria-hidden="true"
        />
      )}
      {/* full text available to screen readers from the start */}
      <span className="sr-only">{text.slice(chars)}</span>
    </span>
  );
}

interface LandingPageProps {
  courseCount: number;
  totalXpMinted: number;
  enrolledBuilders: number;
  credentialsIssued: number;
  achievements: DeployedAchievement[];
  /**
   * LX-A1: anonymous-first deep-link into the flagship path's lesson 1
   * (locale-prefixed, sync-gated to `/{locale}/courses` when unsynced). The
   * primary hero and bottom CTAs point here instead of opening the auth modal —
   * anonymous access already works; auth is deferred to the completion attempt.
   */
  flagshipLessonHref: string;
}

// Community stats stay hidden until seeding gives them weight (GTM cold-start:
// "9 builders enrolled" markets against us). Until the floors are met, the two
// weakest cells swap to verifiable platform facts.
const STAT_FLOOR_BUILDERS = 50;
const ONCHAIN_INSTRUCTION_COUNT = 18;

// Explorer receipts: "on-chain" is a claim you can click.
const SOLANA_NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK ?? "devnet";
const EXPLORER_CLUSTER =
  SOLANA_NETWORK === "mainnet-beta" ? "" : `?cluster=${SOLANA_NETWORK}`;
function explorerAddress(address: string | undefined): string | undefined {
  return address
    ? `https://explorer.solana.com/address/${address}${EXPLORER_CLUSTER}`
    : undefined;
}
const XP_MINT_EXPLORER = explorerAddress(
  process.env.NEXT_PUBLIC_XP_MINT_ADDRESS
);
const PROGRAM_EXPLORER = explorerAddress(process.env.NEXT_PUBLIC_PROGRAM_ID);

export function LandingPageClient({
  courseCount,
  totalXpMinted,
  enrolledBuilders,
  credentialsIssued,
  achievements,
  flagshipLessonHref,
}: LandingPageProps) {
  const t = useTranslations("landing");
  const tCommon = useTranslations("common");
  const tAuth = useTranslations("auth");
  // Sign-up trigger carries the Google-return loading state (see AuthModal).
  const socialReturnPending = useSocialReturnPending();
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

  // Hero parallax — written straight to the DOM so mousemove never re-renders.
  // (The showcase handles its own card tilt + loot layers internally.)
  const glowYellowRef = useRef<HTMLDivElement>(null);
  const glowGreenRef = useRef<HTMLDivElement>(null);
  const reducedMotionRef = useRef(false);

  useEffect(() => {
    reducedMotionRef.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
  }, []);

  const handleHeroMove = (e: React.MouseEvent<HTMLElement>) => {
    if (reducedMotionRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2; // -1 … 1
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    if (glowYellowRef.current)
      glowYellowRef.current.style.transform = `translate3d(${x * 44}px, ${y * 32}px, 0)`;
    if (glowGreenRef.current)
      glowGreenRef.current.style.transform = `translate3d(${x * -30}px, ${y * -22}px, 0)`;
  };

  const resetHeroParallax = () => {
    for (const ref of [glowYellowRef, glowGreenRef]) {
      if (ref.current) ref.current.style.transform = "";
    }
  };

  // The product loop as live miniatures the visitor can poke — same language
  // as the hero terminal, no murky screenshots.
  const steps = [
    {
      n: "01",
      kicker: t("step1Kicker"),
      title: t("step1Title"),
      desc: t("step1Desc"),
      hint: t("step1Hint"),
      widget: (
        <BuildWidget
          runLabel={t("w1Run")}
          runningLabel={t("w1Running")}
          passedLabel={t("w1Passed")}
        />
      ),
    },
    {
      n: "02",
      kicker: t("step2Kicker"),
      title: t("step2Title"),
      desc: t("step2Desc"),
      hint: t("step2Hint"),
      widget: <EarnWidget replayLabel={t("w2Replay")} />,
    },
    {
      n: "03",
      kicker: t("step3Kicker"),
      title: t("step3Title"),
      desc: t("step3Desc"),
      hint: t("step3Hint"),
      widget: <ProveWidget flipLabel={t("w3Flip")} />,
    },
  ];

  const extras = [
    {
      icon: ChatCircle,
      title: t("featureCommunityTitle"),
      description: t("featureCommunityDesc"),
    },
    // LX-B13 (#583): quests framing replaces the old streak-pressure feature
    // card at launch (restore streak copy only after forgiveness ships, LX-B8).
    {
      icon: Lightning,
      title: t("featureQuestsTitle"),
      description: t("featureQuestsDesc"),
    },
    {
      icon: GithubLogo,
      title: t("featureOssTitle"),
      description: t("featureOssDesc"),
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      {/* Surfaces ?error=auth&reason=... from a refused OAuth callback or the
          middleware deleted-account backstop (#461). Isolated behind its own
          Suspense boundary so useSearchParams() doesn't force the rest of this
          ISR'd landing page into per-request dynamic rendering. */}
      <Suspense fallback={null}>
        <AuthErrorToast />
      </Suspense>

      <div className="flex-1">
        {/* ── Hero — the stage reacts to the cursor (parallax halo + tilt) ── */}
        <section
          className="relative overflow-hidden"
          onMouseMove={handleHeroMove}
          onMouseLeave={resetHeroParallax}
        >
          <div className="absolute inset-0 -z-10" aria-hidden="true">
            {/* Superteam Brasil halo: yellow behind the terminal, green grounding the copy */}
            <div
              ref={glowYellowRef}
              className="absolute -right-40 -top-40 h-[700px] w-[700px] rounded-full blur-[140px] transition-transform duration-300 ease-out will-change-transform [background:var(--accent-bg)]"
            />
            <div
              ref={glowGreenRef}
              className="absolute -bottom-20 -left-20 h-[500px] w-[500px] rounded-full blur-[120px] transition-transform duration-300 ease-out will-change-transform [background:var(--primary-dim)]"
            />
          </div>

          <div className="container px-4 pb-10 pt-8 sm:pb-12 sm:pt-10 md:pb-14 md:pt-14">
            <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2 md:gap-16">
              <div>
                <div
                  className="hero-seq mb-6 inline-flex items-center gap-2 rounded-md border-[2.5px] border-border bg-card px-3 py-2 shadow-card"
                  style={{ "--seq": 0 } as React.CSSProperties}
                >
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

                <h1
                  className="hero-seq mb-5 font-display text-3xl font-black leading-[0.98] tracking-tight text-text sm:text-5xl md:text-6xl lg:text-7xl"
                  style={{ "--seq": 1 } as React.CSSProperties}
                >
                  {t.rich("heroTitle", {
                    hl: (chunks) => <span className="hero-hl">{chunks}</span>,
                  })}
                </h1>

                <p
                  className="hero-seq mb-2 max-w-md text-lg font-semibold leading-relaxed text-text"
                  style={{ "--seq": 2 } as React.CSSProperties}
                >
                  <TypedWedge text={t("heroWedge")} />
                </p>
                <p
                  className="hero-seq mb-8 max-w-md text-base leading-relaxed text-text-2"
                  style={{ "--seq": 3 } as React.CSSProperties}
                >
                  {t("heroSubtitle")}
                </p>

                <div
                  className="hero-seq flex flex-wrap gap-3"
                  style={{ "--seq": 4 } as React.CSSProperties}
                >
                  {/* LX-A1: primary hero CTA deep-links straight into flagship
                      lesson 1 \u2014 one click, no auth modal (anonymous access
                      works; auth is deferred to the first completion attempt). */}
                  <Button variant="push" size="lg" asChild>
                    <Link href={flagshipLessonHref}>
                      {t("exploreCourses")} {"\u2192"}
                    </Link>
                  </Button>
                  {!isLoggedIn && (
                    <AuthModal
                      trigger={
                        <Button
                          variant="outline"
                          size="lg"
                          disabled={socialReturnPending}
                        >
                          {socialReturnPending ? (
                            <span className="inline-flex items-center gap-2">
                              <span
                                className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                                aria-hidden="true"
                              />
                              {tAuth("signingIn")}
                            </span>
                          ) : (
                            tCommon("signUp")
                          )}
                        </Button>
                      }
                    />
                  )}
                </div>
              </div>

              {/* Desktop showcase \u2014 the Builder ID and its orbiting loot */}
              <div
                className="hero-seq hidden md:block"
                style={{ "--seq": 3 } as React.CSSProperties}
              >
                <HeroShowcase />
              </div>

              {/* Mobile: the Builder ID, static */}
              <div className="md:hidden">
                <HeroShowcase compact />
              </div>
            </div>
          </div>
        </section>

        {/* ── On-Chain Stats ── */}
        <section className="pb-12 pt-4 md:pb-16 md:pt-6">
          <div className="container px-4">
            <div className="mb-6 flex items-end justify-end">
              <div className="hidden text-sm font-medium text-text-3 md:block">
                {t("statsComment")}
              </div>
            </div>
            <Reveal>
              <div className="card-chunky overflow-hidden p-0">
                {/* Instrument header: live chain heartbeat + the receipt link */}
                <div className="flex items-center justify-between gap-3 border-b-[2.5px] border-border px-5 py-2.5 font-mono text-[11px] text-text-3">
                  <span className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 animate-pulse rounded-full bg-success"
                      aria-hidden="true"
                    />
                    <span>
                      {SOLANA_NETWORK}
                      <LiveSlot />
                    </span>
                  </span>
                  {PROGRAM_EXPLORER && (
                    <a
                      href={PROGRAM_EXPLORER}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 font-bold transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                      {t("statsExplorer")} {"↗"}
                    </a>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-6 p-6 md:grid-cols-4 md:gap-0 md:divide-x-[2.5px] md:divide-border md:p-8">
                  <CountUpStat
                    target={totalXpMinted}
                    label={t("statXpMinted")}
                    color="text-xp"
                    href={XP_MINT_EXPLORER}
                  />
                  {enrolledBuilders >= STAT_FLOOR_BUILDERS ? (
                    <CountUpStat
                      target={enrolledBuilders}
                      label={t("statBuilders")}
                      color="text-text"
                    />
                  ) : (
                    <CountUpStat
                      target={ONCHAIN_INSTRUCTION_COUNT}
                      label={t("statInstructions")}
                      color="text-text"
                      href={PROGRAM_EXPLORER}
                    />
                  )}
                  <CountUpStat
                    target={credentialsIssued}
                    label={t("statCredentials")}
                    color="text-text"
                    href={PROGRAM_EXPLORER}
                  />
                  <CountUpStat
                    target={courseCount}
                    label={t("statCourses")}
                    color="text-text"
                  />
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── How it works: build → earn → prove ── */}
        <section className="border-y-[2.5px] border-border bg-subtle">
          <div className="container px-4 py-12 sm:py-20 md:py-28">
            <Reveal>
              <div className="mb-10 flex items-end justify-between sm:mb-16">
                <h2 className="font-display text-2xl font-black tracking-[-0.5px] sm:text-3xl md:text-4xl">
                  {t("howTitle")}
                </h2>
                <div className="hidden text-sm font-medium text-text-3 md:block">
                  {t("howComment")}
                </div>
              </div>
            </Reveal>

            <div className="space-y-14 md:space-y-24">
              {steps.map((step, i) => (
                <Reveal key={step.n}>
                  <div className="grid items-center gap-6 md:grid-cols-2 md:gap-12">
                    <div className={i % 2 === 1 ? "md:order-2" : ""}>
                      <div className="mb-3 font-mono text-xs font-bold uppercase tracking-widest">
                        <span className="text-primary">{step.n}</span>
                        <span className="mx-2 text-text-3">·</span>
                        <span className="text-xp">{step.kicker}</span>
                      </div>
                      <h3 className="mb-3 font-display text-2xl font-black sm:text-3xl">
                        {step.title}
                      </h3>
                      <p className="max-w-md text-base leading-relaxed text-text-2">
                        {step.desc}
                      </p>
                      <p className="mt-3 font-mono text-xs text-text-3">
                        {"// "}
                        {step.hint}
                      </p>
                    </div>
                    <div className={i % 2 === 1 ? "md:order-1" : ""}>
                      {step.widget}
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>

            {/* The rest of the platform, quietly */}
            <div className="mt-14 grid grid-cols-1 gap-4 md:mt-24 md:grid-cols-3">
              {extras.map((extra, i) => {
                const Icon = extra.icon;
                return (
                  <Reveal key={extra.title} delay={i * 90} className="h-full">
                    <div className="card-chunky flex h-full items-start gap-4 p-5">
                      <Icon
                        size={22}
                        weight="bold"
                        className="mt-0.5 shrink-0 text-primary"
                      />
                      <div>
                        <h4 className="mb-1 font-display font-black">
                          {extra.title}
                        </h4>
                        <p className="text-sm leading-relaxed text-text-3">
                          {extra.description}
                        </p>
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Gamification Showcase ── */}
        {achievements.length > 0 && (
          <section className="py-12 sm:py-20 md:py-28">
            <div className="container px-4">
              <Reveal>
                <div className="mb-8 flex items-end justify-between sm:mb-14">
                  <h2 className="font-display text-2xl font-black tracking-[-0.5px] sm:text-3xl md:text-4xl">
                    {t("gamificationTitle")}
                  </h2>
                  <div className="hidden text-sm font-medium text-text-3 md:block">
                    {t("gamificationComment")}
                  </div>
                </div>
              </Reveal>
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

              {/* Two IDENTICAL groups, each animating -100% of its own width:
                  the loop is pixel-seamless at any viewport. A single strip
                  sliding -25% left blank space on wide monitors before each
                  reset. Each group repeats the set 4× so it outspans even
                  ultra-wide viewports. */}
              <div className="landing-marquee flex w-max py-2">
                {[0, 1].map((group) => (
                  <div
                    key={group}
                    className="landing-marquee-group"
                    aria-hidden={group === 1 || undefined}
                  >
                    {[
                      ...achievements,
                      ...achievements,
                      ...achievements,
                      ...achievements,
                    ].map((ach, i) => (
                      <div key={`${group}-${ach.id}-${i}`} className="ach-item">
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
              {/* LX-A1: bottom "Get Started" deep-links into flagship lesson 1
                  instead of opening the auth modal. */}
              {!isLoggedIn && (
                <Button variant="push" size="lg" asChild>
                  <Link href={flagshipLessonHref}>
                    {tCommon("getStarted")} {"\u2192"}
                  </Link>
                </Button>
              )}
              <Button
                variant="push"
                size="lg"
                className="border-none bg-white text-[var(--secondary)] shadow-[0_4px_0_0_var(--shadow-push-color)] hover:bg-white/95 active:shadow-[0_1px_0_0_var(--shadow-push-color)]"
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
