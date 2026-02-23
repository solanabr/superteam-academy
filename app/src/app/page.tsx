"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { landingTestimonials } from "@/lib/data/mock-courses";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Code2,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const learningTracks = [
  {
    title: "Solana Developer",
    description: "Accounts, transactions, and production-grade program workflows.",
    modules: ["Solana Fundamentals", "Anchor 101", "Token-2022 in Practice"],
  },
  {
    title: "DeFi Engineer",
    description: "AMM math, oracle safety, and liquidation architecture on Solana.",
    modules: ["DeFi Developer", "Security Auditing", "Protocol Simulation Labs"],
  },
  {
    title: "Security Specialist",
    description: "Threat modeling, exploit reproduction, and audit-grade reporting.",
    modules: ["Security Auditing", "Anchor Constraint Hardening", "Incident Playbooks"],
  },
] as const;

const featureGrid = [
  {
    title: "Interactive Code Editor",
    description: "Write and validate challenge code with instant runtime feedback.",
    icon: Code2,
  },
  {
    title: "Gamified Learning",
    description: "Earn XP, maintain streaks, and level up with every completed lesson.",
    icon: Sparkles,
  },
  {
    title: "On-Chain Credentials",
    description: "Mint verifiable completion records anchored to Solana transactions.",
    icon: CheckCircle2,
  },
  {
    title: "Security First",
    description: "Audit patterns, exploit drills, and defensive coding practices built in.",
    icon: ShieldCheck,
  },
  {
    title: "Instant Feedback",
    description: "Challenge lessons surface implementation gaps before you ship.",
    icon: Zap,
  },
  {
    title: "Community Driven",
    description: "Learn from ecosystem builders shipping real protocols and products.",
    icon: Users,
  },
] as const;

const stats = [
  { label: "Active learners", value: 9200 },
  { label: "Courses live", value: 12 },
  { label: "Credentials minted", value: 1860 },
] as const;

function formatNumber(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return value.toString();
}

function useCountUp(target: number, durationMs = 1200): number {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    let rafId = 0;
    const start = performance.now();

    const step = (now: number) => {
      const progress = Math.min((now - start) / durationMs, 1);
      setCurrent(Math.floor(target * progress));
      if (progress < 1) {
        rafId = window.requestAnimationFrame(step);
      }
    };

    rafId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(rafId);
  }, [target, durationMs]);

  return current;
}

export default function HomePage() {
  const floatingShapes = useMemo(
    () =>
      Array.from({ length: 9 }, (_, index) => ({
        id: index,
        size: 28 + index * 6,
        top: `${8 + (index % 4) * 20}%`,
        left: `${5 + (index * 11) % 90}%`,
        delay: index * 0.18,
      })),
    [],
  );

  return (
    <div className="space-y-10 pb-4">
      <section className="relative overflow-hidden rounded-2xl border border-border bg-st-dark p-8 sm:p-12">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(153,69,255,0.35),transparent_45%),radial-gradient(circle_at_80%_22%,rgba(255,210,63,0.25),transparent_40%),radial-gradient(circle_at_65%_80%,rgba(153,69,255,0.18),transparent_35%)]" />

        {floatingShapes.map((shape) => (
          <motion.div
            key={shape.id}
            className="pointer-events-none absolute rounded-lg border border-border bg-foreground/5 backdrop-blur-sm"
            style={{ width: shape.size, height: shape.size, top: shape.top, left: shape.left }}
            animate={{ y: [-8, 8, -8], rotate: [0, 18, 0], opacity: [0.35, 0.6, 0.35] }}
            transition={{ duration: 5 + shape.id * 0.35, repeat: Infinity, delay: shape.delay }}
          />
        ))}

        <div className="relative max-w-3xl space-y-5">
          <Badge className="w-fit border-[#ffd23f]/35 bg-[#ffd23f]/10 text-[#ffd23f]">
            <Sparkles className="mr-1 size-3.5" />
            Now with Solana 2.0 Support
          </Badge>
          <h1 className="text-3xl font-semibold text-foreground sm:text-5xl">
            Level up your Solana skills with on-chain learning.
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            Build production-ready dApps, earn verifiable credentials, and learn from practical,
            security-focused lessons built for ecosystem contributors.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild className="bg-gradient-to-r from-[#2f6b3f] to-[#ffd23f] text-st-dark">
              <Link href="/courses">
                Start learning
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="border-border bg-transparent text-foreground">
              <Link href="/dashboard">View dashboard</Link>
            </Button>
          </div>
          <div className="grid max-w-xl grid-cols-1 gap-3 pt-3 sm:grid-cols-3">
            {stats.map((item) => (
              <AnimatedStat key={item.label} label={item.label} value={item.value} />
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">Learning paths</h2>
        <div className="grid gap-4 lg:grid-cols-3">
          {learningTracks.map((track) => (
            <Card key={track.title} className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-foreground">{track.title}</CardTitle>
                <p className="text-sm text-muted-foreground">{track.description}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {track.modules.map((module, index) => (
                  <div
                    key={module}
                    className="flex items-center gap-3 rounded-lg border border-border bg-st-dark/60 px-3 py-2"
                  >
                    <span className="inline-flex size-6 items-center justify-center rounded-full border border-[#ffd23f]/50 text-xs text-[#ffd23f]">
                      {index + 1}
                    </span>
                    <p className="text-sm text-foreground/90">{module}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">Why builders choose Superteam Academy</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {featureGrid.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.article
                key={feature.title}
                className="rounded-xl border border-border bg-card p-4"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35 }}
              >
                <div className="mb-3 inline-flex rounded-lg border border-[#2f6b3f]/40 bg-[#2f6b3f]/15 p-2 text-[#ffd23f]">
                  <Icon className="size-4" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
              </motion.article>
            );
          })}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">What learners are shipping</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {landingTestimonials.map((item) => (
            <article key={item.name} className="rounded-xl border border-border bg-card p-4">
              <p className="text-sm leading-relaxed text-foreground/90">"{item.quote}"</p>
              <div className="mt-4 flex items-center gap-3">
                <Avatar className="border border-border bg-st-dark">
                  <AvatarFallback className="bg-card text-xs text-foreground/90">
                    {item.name
                      .split(" ")
                      .map((chunk) => chunk[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold text-foreground">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.role}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden rounded-2xl border border-border bg-card/75 p-8">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(153,69,255,0.18),transparent_40%,rgba(255,210,63,0.18))]" />
        <div className="relative flex flex-col items-start justify-between gap-5 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Ready to Build the Future?</h2>
            <p className="mt-2 max-w-xl text-muted-foreground">
              Join Solana engineers advancing from fundamentals to production architecture.
            </p>
          </div>
          <Button asChild className="bg-gradient-to-r from-[#2f6b3f] to-[#ffd23f] text-st-dark">
            <Link href="/courses">
              Start your path
              <Bot className="size-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

function AnimatedStat({ label, value }: { label: string; value: number }) {
  const count = useCountUp(value);

  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <p className="text-2xl font-semibold text-foreground">{formatNumber(count)}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
