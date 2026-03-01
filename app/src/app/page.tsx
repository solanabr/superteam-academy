"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, BookOpen, Code2, GamepadIcon, Medal, Shield, Sparkles, Terminal, Zap } from "lucide-react";
import Link from "next/link";

const learningTracks = [
  {
    title: "Solana Core",
    description: "Accounts, transactions, PDAs, and production-grade program workflows.",
    icon: Terminal,
    modules: ["Solana Development Fundamentals", "Token-2022 & SPL Tokens"],
    hours: 12,
    color: "from-st-green/20 to-st-emerald/10",
  },
  {
    title: "Program Engineering",
    description: "Anchor macros, account constraints, events, and integration testing.",
    icon: BookOpen,
    modules: ["Anchor Framework 101", "Solana Development Fundamentals"],
    hours: 18,
    color: "from-st-emerald/20 to-st-green/10",
  },
  {
    title: "Security & Auditing",
    description: "Threat modeling, safe arithmetic, CPI guards, and audit checklists.",
    icon: Shield,
    modules: ["Solana Security Essentials", "Anchor Framework 101"],
    hours: 10,
    color: "from-st-yellow/15 to-st-green/10",
  },
] as const;

const features = [
  {
    icon: Code2,
    title: "Interactive Code Editor",
    description: "Write and validate challenge code with instant runtime feedback.",
  },
  {
    icon: GamepadIcon,
    title: "Gamified Learning",
    description: "Earn XP, maintain streaks, and level up with every completed lesson.",
  },
  {
    icon: Medal,
    title: "On-Chain Credentials",
    description: "Mint verifiable completion records anchored to Solana transactions.",
  },
] as const;


export default function HomePage() {
  return (
    <div className="space-y-12 pb-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-card p-8 sm:p-12">
        <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-st-green/6 via-transparent to-st-yellow/4" />
        <div className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-st-green/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 size-56 rounded-full bg-st-yellow/4 blur-3xl" />

        <div className="relative max-w-2xl space-y-6">
          <Badge className="w-fit border-st-emerald/25 bg-st-emerald/10 text-st-emerald dark:text-st-emerald gap-1.5 px-3 py-1">
            <Sparkles className="size-3" />
            Now with Solana 2.0 Support
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]">
            Level up your Solana skills with on-chain learning.
          </h1>
          <p className="max-w-xl text-[15px] leading-relaxed text-muted-foreground">
            Build production-ready dApps, earn verifiable credentials, and learn from practical, security-focused lessons built for ecosystem contributors.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="bg-gradient-cta text-cta-foreground shadow-lg shadow-st-green/10 transition-shadow hover:shadow-xl hover:shadow-st-green/15">
              <Link href="/courses">
                Start learning
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-border text-foreground">
              <Link href="/dashboard">View dashboard</Link>
            </Button>
          </div>
        </div>


      </section>

      {/* Learning paths */}
      <section className="space-y-5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Learning paths</h2>
          <p className="mt-1 text-sm text-muted-foreground">Structured tracks from fundamentals to audit-ready engineering.</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {learningTracks.map((track) => {
            const Icon = track.icon;
            return (
              <Card key={track.title} className="group relative overflow-hidden border-border bg-card transition-all hover:border-primary/25 hover:shadow-lg hover:shadow-primary/5">
                <div className={`pointer-events-none absolute inset-0 bg-linear-to-br ${track.color} opacity-0 transition-opacity group-hover:opacity-100`} />
                <CardHeader className="relative">
                  <div className="mb-3 inline-flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <CardTitle className="text-foreground">{track.title}</CardTitle>
                  <p className="text-sm leading-relaxed text-muted-foreground">{track.description}</p>
                  <p className="text-xs font-medium text-muted-foreground/60">{track.hours}h estimated</p>
                </CardHeader>
                <CardContent className="relative space-y-2">
                  {track.modules.map((module, index) => (
                    <div
                      key={module}
                      className="flex items-center gap-3 rounded-lg border border-border/60 bg-surface/50 px-3 py-2.5 transition-colors group-hover:border-border"
                    >
                      <span className="inline-flex size-6 items-center justify-center rounded-md bg-primary/10 text-[11px] font-bold text-primary">
                        {index + 1}
                      </span>
                      <p className="text-sm text-foreground/90">{module}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Why builders choose */}
      <section className="space-y-5">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Why builders choose Superteam Academy</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="group rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/25 hover:shadow-md hover:shadow-primary/5">
                <div className="mb-4 inline-flex size-10 items-center justify-center rounded-xl bg-st-emerald/10 text-st-emerald dark:bg-st-yellow/10 dark:text-st-yellow">
                  <Icon className="size-5" />
                </div>
                <h3 className="font-semibold text-foreground">{feature.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it works CTA */}
      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="relative px-6 py-8 sm:px-8">
          <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-st-green/4 to-st-yellow/3" />
          <div className="relative flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Zap className="size-5 text-st-yellow" />
                <h2 className="text-lg font-bold text-foreground">How it works</h2>
              </div>
              <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">
                Enroll in a course, complete lessons with hands-on code challenges, earn soulbound XP on Solana, and mint credential NFTs on completion.
              </p>
            </div>
            <Button asChild className="shrink-0 bg-gradient-cta text-cta-foreground shadow-md shadow-st-green/10">
              <Link href="/courses">
                Get started
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
