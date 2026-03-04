"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowRight, GraduationCap, Globe, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LearningTracks } from "@/components/course/learning-tracks";
import { GlowButton } from "@/components/ui/glow-button";
import { useLocale } from "@/providers/locale-provider";

const SocialProof = dynamic(
  () => import("@/components/course/social-proof").then((m) => m.SocialProof),
  { ssr: false },
);
const PlatformFeatures = dynamic(
  () =>
    import("@/components/course/platform-features").then(
      (m) => m.PlatformFeatures,
    ),
  { ssr: false },
);

/* ── Data ── */

const codeLines = [
  {
    indent: 0,
    tokens: [
      { text: "use ", c: "#c792ea" },
      { text: "anchor_lang", c: "#82aaff" },
      { text: "::prelude::*;", c: "#89ddff" },
    ],
  },
  { indent: 0, tokens: [] },
  { indent: 0, tokens: [{ text: "#[program]", c: "#c3e88d" }] },
  {
    indent: 0,
    tokens: [
      { text: "pub mod ", c: "#c792ea" },
      { text: "superteam_academy ", c: "#82aaff" },
      { text: "{", c: "#89ddff" },
    ],
  },
  {
    indent: 1,
    tokens: [
      { text: "pub fn ", c: "#c792ea" },
      { text: "enroll", c: "#82aaff" },
      { text: "(ctx: Context<Enroll>) ", c: "#babed8" },
      { text: "-> Result<()> {", c: "#89ddff" },
    ],
  },
  {
    indent: 2,
    tokens: [
      { text: "let enrollment = ", c: "#babed8" },
      { text: "&mut ", c: "#c792ea" },
      { text: "ctx.accounts.enrollment;", c: "#babed8" },
    ],
  },
  {
    indent: 2,
    tokens: [
      { text: "enrollment.course = ", c: "#babed8" },
      { text: "ctx.accounts.course.key();", c: "#82aaff" },
    ],
  },
  {
    indent: 2,
    tokens: [
      { text: "enrollment.enrolled_at = ", c: "#babed8" },
      { text: "Clock::get()?.unix_timestamp;", c: "#82aaff" },
    ],
  },
  {
    indent: 2,
    tokens: [
      { text: "// Mint soulbound XP tokens", c: "#546e7a", italic: true },
    ],
  },
  {
    indent: 2,
    tokens: [
      { text: "mint_xp(", c: "#82aaff" },
      { text: "&ctx, ", c: "#babed8" },
      { text: "100", c: "#f78c6c" },
      { text: ")?;", c: "#89ddff" },
    ],
  },
  { indent: 2, tokens: [{ text: "Ok(())", c: "#c3e88d" }] },
  { indent: 1, tokens: [{ text: "}", c: "#89ddff" }] },
  { indent: 0, tokens: [{ text: "}", c: "#89ddff" }] },
];

export default function LandingPage() {
  const { t } = useLocale();

  return (
    <div>
      {/* ── Hero ── */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-hero animate-drift-1" />
        <div className="pointer-events-none absolute top-[10%] right-[15%] h-72 w-72 rounded-full bg-emerald-500/15 blur-[100px] animate-float-1" />
        <div className="pointer-events-none absolute bottom-[20%] left-[10%] h-56 w-56 rounded-full bg-amber-500/10 blur-[80px] animate-float-2" />

        <div className="relative z-10 mx-auto max-w-3xl px-6 pt-24 text-center">
          <h1 className="animate-blur-in text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl">
            {t("landing.heroTitle")} <br />
            <span className="text-primary">{t("landing.heroHighlight")}</span>
          </h1>

          <p className="animate-blur-in delay-200 mx-auto mt-4 max-w-xl text-lg leading-relaxed text-muted-foreground">
            {t("landing.heroSubtitle")}
          </p>

          <div className="animate-blur-in delay-300 mt-12 flex flex-wrap items-center justify-center gap-6">
            <Button size="lg" asChild>
              <Link href="/settings">{t("landing.signUp")}</Link>
            </Button>
            <GlowButton>
              <Button
                variant="outline"
                size="lg"
                asChild
                className="relative bg-[#0a0a0c] dark:bg-[#0a0a0c] border-transparent"
              >
                <Link href="/courses">
                  {t("landing.exploreCourses")}
                  <ArrowRight />
                </Link>
              </Button>
            </GlowButton>
          </div>

          {/* Terminal (decorative) */}
          <div className="animate-blur-in delay-400 mt-20" aria-hidden="true">
            <Card className="terminal terminal-glow mx-auto max-w-2xl overflow-hidden rounded-xl border-primary/10 p-0 gap-0 text-left">
              <div className="flex items-center gap-2 border-b border-border/50 px-4 py-2.5">
                <div className="flex gap-1.5">
                  <div className="terminal-dot bg-[#ff5f57]" />
                  <div className="terminal-dot bg-[#febc2e]" />
                  <div className="terminal-dot bg-[#28c840]" />
                </div>
                <span className="flex-1 text-center text-xs text-muted-foreground">
                  lib.rs
                </span>
                <div className="w-10" />
              </div>

              <CardContent className="p-0">
                <div className="px-5 py-4 text-[13px] leading-[1.8] overflow-x-auto">
                  {codeLines.map((line, i) => (
                    <div key={i} className="flex">
                      <span className="w-7 shrink-0 select-none pr-3 text-right text-[11px] text-muted-foreground/50">
                        {i + 1}
                      </span>
                      <span style={{ paddingLeft: `${line.indent * 18}px` }}>
                        {line.tokens.length === 0 ? (
                          <span>&nbsp;</span>
                        ) : (
                          line.tokens.map((token, j) => (
                            <span
                              key={j}
                              style={{ color: token.c }}
                              className={
                                "italic" in token && token.italic
                                  ? "italic"
                                  : ""
                              }
                            >
                              {token.text}
                            </span>
                          ))
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ── Learning Tracks ── */}
      <LearningTracks />

      {/* ── Social Proof ── */}
      <SocialProof />

      {/* ── Features ── */}
      <PlatformFeatures />

      {/* ── How it works ── */}
      <section className="relative py-28">
        <div className="absolute inset-0 bg-glow-center animate-drift-1" />

        <div className="relative z-10 mx-auto max-w-5xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-semibold tracking-tight">
              {t("landing.howItWorks")}
            </h2>
            <p className="mt-3 text-muted-foreground">
              {t("landing.howItWorksSubtitle")}
            </p>
          </div>

          {/* Connector line (desktop only) */}
          <div className="relative mt-16">
            <div className="pointer-events-none absolute top-[52px] left-[16.67%] right-[16.67%] hidden h-px md:block">
              <div className="h-full w-full border-t border-dashed border-primary/20" />
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {/* Step 1 — Connect Wallet */}
              <div className="text-center">
                <div className="relative mx-auto mb-5 flex size-[104px] items-center justify-center">
                  <div className="absolute inset-0 rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm" />
                  <div className="absolute -top-2 -right-2 flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    1
                  </div>
                  <Globe className="relative z-10 size-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold tracking-tight">
                  {t("landing.step1Title")}
                </h3>
                <p className="mx-auto mt-2 max-w-[220px] text-sm leading-relaxed text-muted-foreground">
                  {t("landing.step1Description")}
                </p>
                {/* Mini wallet mockup */}
                <div className="mx-auto mt-5 max-w-[200px] overflow-hidden rounded-lg border border-border/50 bg-[#0c0c0e]" aria-hidden="true">
                  <div className="flex items-center gap-2 border-b border-border/30 px-3 py-2">
                    <div className="size-4 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500" />
                    <span className="text-[10px] font-medium text-muted-foreground/60">
                      {t("common.selectWallet")}
                    </span>
                  </div>
                  {/* Phantom */}
                  <div className="flex items-center gap-2.5 px-3 py-2 border-b border-border/20">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 108 108"
                      fill="none"
                      className="shrink-0 rounded"
                    >
                      <rect width="108" height="108" rx="26" fill="#AB9FF2" />
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M46.5267 69.9229C42.0054 76.8509 34.4292 85.6182 24.348 85.6182C19.5824 85.6182 15 83.6563 15 75.1342C15 53.4305 44.6326 19.8327 72.1268 19.8327C87.768 19.8327 94 30.6846 94 43.0079C94 58.8258 83.7355 76.9122 73.5321 76.9122C70.2939 76.9122 68.7053 75.1342 68.7053 72.314C68.7053 71.5783 68.8275 70.7812 69.0719 69.9229C65.5893 75.8699 58.8685 81.3878 52.5754 81.3878C47.993 81.3878 45.6713 78.5063 45.6713 74.4598C45.6713 72.9884 45.9768 71.4556 46.5267 69.9229ZM83.6761 42.5794C83.6761 46.1704 81.5575 47.9658 79.1875 47.9658C76.7816 47.9658 74.6989 46.1704 74.6989 42.5794C74.6989 38.9885 76.7816 37.1931 79.1875 37.1931C81.5575 37.1931 83.6761 38.9885 83.6761 42.5794ZM70.2103 42.5795C70.2103 46.1704 68.0916 47.9658 65.7216 47.9658C63.3157 47.9658 61.233 46.1704 61.233 42.5795C61.233 38.9885 63.3157 37.1931 65.7216 37.1931C68.0916 37.1931 70.2103 38.9885 70.2103 42.5795Z"
                        fill="#FFFDF8"
                      />
                    </svg>
                    <span className="text-[11px] font-medium text-muted-foreground/70">
                      Phantom
                    </span>
                  </div>
                  {/* Solflare */}
                  <div className="flex items-center gap-2.5 px-3 py-2 border-b border-border/20">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 50 50"
                      fill="none"
                      className="shrink-0 rounded"
                    >
                      <rect width="50" height="50" rx="12" fill="#FFEF46" />
                      <path
                        d="M24.23,26.42l2.46-2.38,4.59,1.5c3.01,1,4.51,2.84,4.51,5.43,0,1.96-.75,3.26-2.25,4.93l-.46.5.17-1.17c.67-4.26-.58-6.09-4.72-7.43l-4.3-1.38h0ZM18.05,11.85l12.52,4.17-2.71,2.59-6.51-2.17c-2.25-.75-3.01-1.96-3.3-4.51v-.08h0ZM17.3,33.06l2.84-2.71,5.34,1.75c2.8.92,3.76,2.13,3.46,5.18l-11.65-4.22h0ZM13.71,20.95c0-.79.42-1.54,1.13-2.17.75,1.09,2.05,2.05,4.09,2.71l4.42,1.46-2.46,2.38-4.34-1.42c-2-.67-2.84-1.67-2.84-2.96M26.82,42.87c9.18-6.09,14.11-10.23,14.11-15.32,0-3.38-2-5.26-6.43-6.72l-3.34-1.13,9.14-8.77-1.84-1.96-2.71,2.38-12.81-4.22c-3.97,1.29-8.97,5.09-8.97,8.89,0,.42.04.83.17,1.29-3.3,1.88-4.63,3.63-4.63,5.8,0,2.05,1.09,4.09,4.55,5.22l2.75.92-9.52,9.14,1.84,1.96,2.96-2.71,14.73,5.22h0Z"
                        fill="#02050a"
                      />
                    </svg>
                    <span className="text-[11px] font-medium text-muted-foreground/70">
                      Solflare
                    </span>
                  </div>
                  {/* Backpack */}
                  <div className="flex items-center gap-2.5 px-3 py-2">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="shrink-0 rounded"
                    >
                      <rect width="24" height="24" rx="5" fill="#E33E3F" />
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M13.061 5.25807C13.6531 5.25807 14.2085 5.33603 14.7228 5.48062C14.2193 4.32817 13.174 4 12.0106 4C10.8449 4 9.7978 4.32946 9.29548 5.4874C9.80594 5.33773 10.359 5.25807 10.9491 5.25807H13.061ZM10.8136 6.41507C8.00198 6.41507 6.40002 8.58749 6.40002 11.2673V14.0201C6.40002 14.2881 6.62795 14.5002 6.90912 14.5002H17.0909C17.3721 14.5002 17.6 14.2881 17.6 14.0201V11.2673C17.6 8.58749 15.7372 6.41507 12.9255 6.41507H10.8136ZM11.996 11.2911C12.9801 11.2911 13.7779 10.5076 13.7779 9.5411C13.7779 8.57459 12.9801 7.79107 11.996 7.79107C11.012 7.79107 10.2142 8.57459 10.2142 9.5411C10.2142 10.5076 11.012 11.2911 11.996 11.2911ZM6.40002 16.1182C6.40002 15.8502 6.62795 15.633 6.90912 15.633H17.0909C17.3721 15.633 17.6 15.8502 17.6 16.1182V19.0295C17.6 19.5655 17.1442 20 16.5818 20H7.41821C6.85588 20 6.40002 19.5655 6.40002 19.0295V16.1182Z"
                        fill="white"
                      />
                    </svg>
                    <span className="text-[11px] font-medium text-muted-foreground/70">
                      Backpack
                    </span>
                  </div>
                </div>
              </div>

              {/* Step 2 — Complete Lessons */}
              <div className="text-center">
                <div className="relative mx-auto mb-5 flex size-[104px] items-center justify-center">
                  <div className="absolute inset-0 rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm" />
                  <div className="absolute -top-2 -right-2 flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    2
                  </div>
                  <Code className="relative z-10 size-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold tracking-tight">
                  {t("landing.step2Title")}
                </h3>
                <p className="mx-auto mt-2 max-w-[220px] text-sm leading-relaxed text-muted-foreground">
                  {t("landing.step2Description")}
                </p>
                {/* Mini editor mockup */}
                <div className="mx-auto mt-5 max-w-[200px] overflow-hidden rounded-lg border border-border/50 bg-[#0c0c0e]" aria-hidden="true">
                  <div className="flex items-center gap-1.5 border-b border-border/30 px-3 py-1.5">
                    <div className="size-1.5 rounded-full bg-[#ff5f57]" />
                    <div className="size-1.5 rounded-full bg-[#febc2e]" />
                    <div className="size-1.5 rounded-full bg-[#28c840]" />
                  </div>
                  <div className="px-3 py-2.5 font-mono text-[10px] leading-[1.7] text-left">
                    <div>
                      <span className="text-muted-foreground/50">1 </span>
                      <span style={{ color: "#c792ea" }}>pub fn </span>
                      <span style={{ color: "#82aaff" }}>swap</span>
                      <span style={{ color: "#babed8" }}>(ctx) {"{"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground/50">2 </span>
                      <span style={{ color: "#546e7a" }}>
                        {"  // your code"}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-muted-foreground/50">3 </span>
                      <span className="ml-1 inline-block h-3 w-px animate-pulse bg-primary" />
                    </div>
                    <div>
                      <span className="text-muted-foreground/50">4 </span>
                      <span style={{ color: "#89ddff" }}>{"}"}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-border/30 px-3 py-1.5">
                    <span className="text-[9px] text-emerald-400/80">
                      1/2 passing
                    </span>
                    <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[8px] font-medium text-primary">
                      RUN
                    </span>
                  </div>
                </div>
              </div>

              {/* Step 3 — Earn Credentials */}
              <div className="text-center">
                <div className="relative mx-auto mb-5 flex size-[104px] items-center justify-center">
                  <div className="absolute inset-0 rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm" />
                  <div className="absolute -top-2 -right-2 flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    3
                  </div>
                  <GraduationCap className="relative z-10 size-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold tracking-tight">
                  {t("landing.step3Title")}
                </h3>
                <p className="mx-auto mt-2 max-w-[220px] text-sm leading-relaxed text-muted-foreground">
                  {t("landing.step3Description")}
                </p>
                {/* Mini NFT certificate mockup */}
                <div className="mx-auto mt-5 max-w-[200px] overflow-hidden rounded-lg border border-border/50 bg-[#0c0c0e] p-4" aria-hidden="true">
                  <div className="mx-auto flex size-12 items-center justify-center rounded-xl border border-primary/30 bg-primary/10">
                    <GraduationCap className="size-6 text-primary" />
                  </div>
                  <p className="mt-3 text-[11px] font-semibold">
                    {t("courses.pathSolanaFundamentals")}
                  </p>
                  <p className="text-[9px] text-muted-foreground/60 mt-0.5">
                    {t("landing.completedLessons", { count: 24 })}
                  </p>
                  <div className="mt-3 flex items-center justify-center gap-1.5">
                    <div className="h-px flex-1 bg-border/30" />
                    <span className="text-[8px] font-bold uppercase tracking-widest text-primary/60">
                      NFT
                    </span>
                    <div className="h-px flex-1 bg-border/30" />
                  </div>
                  <p className="mt-2 font-mono text-[8px] text-muted-foreground/60 truncate">
                    mint: 7xKp...3nFq
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative overflow-hidden py-28">
        <div className="absolute inset-0 bg-glow-bottom animate-drift-2" />
        <div className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 h-64 w-[600px] rounded-full bg-primary/20 blur-[100px] animate-float-1" />

        <div className="relative z-10 mx-auto max-w-2xl px-6 text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("landing.ctaTitle")}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {t("landing.ctaSubtitle")}
          </p>
          <div className="mt-10">
            <Button size="lg" asChild>
              <Link href="/courses">
                {t("landing.exploreCourses")}
                <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
