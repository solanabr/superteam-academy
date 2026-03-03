import React from "react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getAllCourses } from "@/lib/sanity";
import type { Metadata } from "next";
import { TestimonialsMarquee } from "@/components/landing/TestimonialsMarquee";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home.hero" });
  return { title: "Superteam Academy", description: t("subtitle") };
}

const TRACKS = [
  {
    id: 1,
    name: "Solana Basics",
    difficulty: "beginner",
    color: "#14F195",
    courses: 3,
    description:
      "Core concepts: accounts, transactions, PDAs, and the programming model from scratch.",
  },
  {
    id: 2,
    name: "Anchor Framework",
    difficulty: "intermediate",
    color: "#9945FF",
    courses: 3,
    description:
      "Build on-chain programs with Anchor — PDAs, CPIs, constraints, error handling.",
  },
  {
    id: 3,
    name: "DeFi & AMMs",
    difficulty: "intermediate",
    color: "#00D4FF",
    courses: 2,
    description:
      "Liquidity pools, constant-product AMMs, swap mechanics, and protocol design.",
  },
  {
    id: 4,
    name: "NFTs & Digital Assets",
    difficulty: "intermediate",
    color: "#F5A623",
    courses: 4,
    description:
      "Metaplex Core, Token-2022 extensions, soulbound credentials, on-chain metadata.",
  },
  {
    id: 5,
    name: "Full-Stack Solana",
    difficulty: "advanced",
    color: "#FF4444",
    courses: 2,
    description:
      "End-to-end dApp development — program architecture, client SDKs, wallet integration.",
  },
] as const;

const HOW_IT_WORKS = [
  {
    key: "enroll",
    cmd: "academy enroll <course-slug>",
    color: "#14F195",
    stepNum: 1,
  },
  {
    key: "learn",
    cmd: "academy learn --interactive",
    color: "#00D4FF",
    stepNum: 2,
  },
  { key: "earn", cmd: "academy earn --on-chain", color: "#9945FF", stepNum: 3 },
] as const;

export default async function LandingPage() {
  const t = await getTranslations("home");
  const courses = await getAllCourses().catch(() => []);

  const stats = [
    { label: "500+", sublabel: t("hero.stats.developers") },
    {
      label: `${Math.max(courses.length, 10)}+`,
      sublabel: t("hero.stats.courses"),
    },
    { label: "∞", sublabel: t("hero.stats.xpMinted") },
  ];

  return (
    <div className="bg-background text-foreground">
      {/* ── Hero ── */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center grid-pattern overflow-hidden px-4">
        {/* Background glow */}
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(20,241,149,0.06) 0%, transparent 70%)",
          }}
        />

        <div className="relative z-10 text-center max-w-4xl mx-auto">
          {/* H1 */}
          <h1 className="font-mono font-black text-5xl sm:text-7xl md:text-8xl leading-[0.9] tracking-tight mb-6">
            <span className="block text-foreground">Master</span>
            <span className="block text-foreground">Solana</span>
            <span className="block text-accent">Development</span>
          </h1>

          <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto leading-relaxed mb-10 font-mono">
            {t("hero.subtitle")}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 bg-[#14F195] text-black font-mono font-semibold text-sm px-6 py-2.5 rounded-full hover:bg-accent-dim transition-colors"
            >
              <span>◎</span>
              {t("hero.cta")}
            </Link>
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 border border-border text-foreground font-mono text-sm px-6 py-2.5 rounded-full hover:bg-card hover:border-border-hover transition-colors"
            >
              Find your starting point →
            </Link>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 sm:gap-16">
            {stats.map(({ label, sublabel }) => (
              <div key={sublabel} className="text-center">
                <div className="font-mono text-2xl font-bold text-foreground mono-numbers">
                  {label}
                </div>
                <div className="text-[10px] text-muted-foreground font-mono mt-0.5 uppercase tracking-wider">
                  {sublabel}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Learning Paths ── */}
      <section id="tracks" className="py-20 px-4 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12">
            <p className="font-mono text-xs text-accent uppercase tracking-widest mb-3">
              {t("tracks.subtitle")}
            </p>
            <h2 className="font-mono font-black text-3xl sm:text-4xl text-foreground">
              {t("tracks.title")}
            </h2>
          </div>

          <div className="divide-y divide-border">
            {TRACKS.map((track, i) => (
              <Link
                key={track.id}
                href={{
                  pathname: "/courses",
                  query: { track: String(track.id) },
                }}
                className="group flex items-center gap-4 sm:gap-8 py-5 -mx-4 px-4 transition-colors hover:bg-card relative overflow-hidden"
              >
                {/* Accent line left */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-0 group-hover:w-0.5 transition-all duration-300"
                  style={{ backgroundColor: track.color }}
                />
                {/* Number */}
                <span
                  className="font-mono text-3xl sm:text-5xl font-black shrink-0 w-10 sm:w-16 transition-colors duration-300 text-border group-hover:text-[var(--track-color)]"
                  style={
                    { "--track-color": track.color } as React.CSSProperties
                  }
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                {/* Track info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-3 mb-1">
                    <h3 className="font-mono font-black text-lg sm:text-2xl text-foreground leading-tight">
                      {track.name}
                    </h3>
                    <span
                      className="font-mono text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border hidden sm:inline-block"
                      style={{
                        color: track.color,
                        borderColor: `${track.color}40`,
                        backgroundColor: `${track.color}10`,
                      }}
                    >
                      {track.difficulty}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed hidden sm:block max-w-lg">
                    {track.description}
                  </p>
                </div>
                {/* Right side */}
                <div className="flex items-center gap-3 sm:gap-5 shrink-0">
                  <span className="font-mono text-[10px] text-muted-foreground hidden sm:block">
                    {track.courses}+ {t("tracks.coursesCount")}
                  </span>
                  <span className="font-mono text-xl text-border group-hover:translate-x-1.5 transition-transform duration-200">
                    →
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-border flex justify-between items-center">
            <p className="font-mono text-xs text-muted-foreground">
              5 tracks · {courses.length}+ courses
            </p>
            <Link
              href="/courses"
              className="font-mono text-xs text-muted-foreground hover:text-accent transition-colors flex items-center gap-1"
            >
              {t("tracks.viewAll")} →
            </Link>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-20 px-4 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12 text-center">
            <p className="font-mono text-xs text-accent uppercase tracking-widest mb-3">
              {t("howItWorks.subtitle")}
            </p>
            <h2 className="font-mono font-black text-3xl sm:text-4xl text-foreground">
              {t("howItWorks.title")}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {HOW_IT_WORKS.map(({ key, cmd, color, stepNum }) => (
              <div
                key={key}
                className="bg-card border border-border rounded-lg overflow-hidden"
                style={{ borderTopColor: color, borderTopWidth: "2px" }}
              >
                {/* Terminal chrome */}
                <div className="flex items-center gap-1.5 px-4 py-3 border-b border-border bg-elevated">
                  <span className="w-2 h-2 rounded-full bg-[#FF5F57]" />
                  <span className="w-2 h-2 rounded-full bg-[#FFBD2E]" />
                  <span className="w-2 h-2 rounded-full bg-[#28C840]" />
                  <span className="font-mono text-[10px] text-muted-foreground ml-3 uppercase tracking-widest">
                    {t(`howItWorks.steps.${key}.label`)}
                  </span>
                  <span className="ml-auto font-mono text-[10px] text-muted-foreground">
                    step {stepNum}/3
                  </span>
                </div>
                {/* Content */}
                <div className="p-5">
                  <p className="font-mono text-sm mb-5 flex items-center gap-0.5">
                    <span className="text-muted-foreground select-none">
                      ${" "}
                    </span>
                    <span style={{ color }}>{cmd}</span>
                    <span
                      className="terminal-cursor inline-block w-[7px] h-[14px] ml-0.5 align-middle"
                      style={{ backgroundColor: color }}
                    />
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t(`howItWorks.steps.${key}.description`)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-20 border-t border-border overflow-hidden">
        <div className="text-center mb-12 px-4">
          <h2 className="font-mono text-2xl font-bold text-foreground">
            {t("socialProof.testimonials")}
          </h2>
        </div>
        <TestimonialsMarquee />
      </section>

      {/* ── CTA ── */}
      <section className="py-20 px-4 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left: mock JSON profile */}
            <div className="bg-[#0D1117] border border-border rounded-lg overflow-hidden font-mono text-xs">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-elevated">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#14F195]" />
                  <span className="text-[10px] text-muted-foreground">
                    on-chain-profile.json
                  </span>
                </div>
                <span className="text-[10px] text-accent font-mono">
                  ✓ verified
                </span>
              </div>
              <div className="p-5 leading-6 text-[13px]">
                <div className="text-muted-foreground">{"{"}</div>
                <div className="pl-5 space-y-0.5">
                  <div>
                    <span className="text-[#9945FF]">&quot;wallet&quot;</span>
                    <span className="text-muted-foreground">: </span>
                    <span className="text-accent">
                      &quot;8RER7...sB1f&quot;
                    </span>
                    <span className="text-muted-foreground">,</span>
                  </div>
                  <div>
                    <span className="text-[#9945FF]">&quot;xp&quot;</span>
                    <span className="text-muted-foreground">: </span>
                    <span className="text-[#F5A623]">2500</span>
                    <span className="text-muted-foreground">,</span>
                  </div>
                  <div>
                    <span className="text-[#9945FF]">&quot;level&quot;</span>
                    <span className="text-muted-foreground">: </span>
                    <span className="text-[#F5A623]">5</span>
                    <span className="text-muted-foreground">,</span>
                  </div>
                  <div>
                    <span className="text-[#9945FF]">
                      &quot;credentials&quot;
                    </span>
                    <span className="text-muted-foreground">: [</span>
                    <div className="pl-5 space-y-0.5">
                      <div>
                        <span className="text-[#00D4FF]">
                          &quot;Solana Basics NFT&quot;
                        </span>
                        <span className="text-muted-foreground">,</span>
                      </div>
                      <div>
                        <span className="text-[#00D4FF]">
                          &quot;Anchor Developer NFT&quot;
                        </span>
                      </div>
                    </div>
                    <span className="text-muted-foreground">],</span>
                  </div>
                  <div>
                    <span className="text-[#9945FF]">
                      &quot;streak_days&quot;
                    </span>
                    <span className="text-muted-foreground">: </span>
                    <span className="text-[#F5A623]">14</span>
                  </div>
                </div>
                <div className="text-muted-foreground">{"}"}</div>
              </div>
            </div>

            {/* Right: CTA */}
            <div>
              <p className="font-mono text-xs text-accent uppercase tracking-widest mb-4">
                {t("socialProof.title")}
              </p>
              <h2 className="font-mono text-3xl sm:text-4xl font-black text-foreground mb-4 leading-tight">
                Your credentials,
                <br />
                <span className="text-accent">on-chain forever.</span>
              </h2>
              <p className="text-sm text-muted-foreground mb-8 leading-relaxed max-w-sm">
                Join hundreds of developers building on Solana. Every lesson
                mints XP. Every course earns a soulbound NFT.
              </p>
              <Link
                href="/courses"
                className="inline-flex items-center gap-2 bg-[#14F195] text-black font-mono font-semibold text-sm px-8 py-3 rounded-full hover:bg-accent-dim transition-colors"
              >
                <span>◎</span>
                {t("hero.cta")}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
