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
      <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#090d16] p-8 sm:p-12">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(153,69,255,0.35),transparent_45%),radial-gradient(circle_at_80%_22%,rgba(20,241,149,0.25),transparent_40%),radial-gradient(circle_at_65%_80%,rgba(153,69,255,0.18),transparent_35%)]" />

        {floatingShapes.map((shape) => (
          <motion.div
            key={shape.id}
            className="pointer-events-none absolute rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm"
            style={{ width: shape.size, height: shape.size, top: shape.top, left: shape.left }}
            animate={{ y: [-8, 8, -8], rotate: [0, 18, 0], opacity: [0.35, 0.6, 0.35] }}
            transition={{ duration: 5 + shape.id * 0.35, repeat: Infinity, delay: shape.delay }}
          />
        ))}

        <div className="relative max-w-3xl space-y-5">
          <Badge className="w-fit border-[#14F195]/35 bg-[#14F195]/10 text-[#14F195]">
            <Sparkles className="mr-1 size-3.5" />
            Now with Solana 2.0 Support
          </Badge>
          <h1 className="text-3xl font-semibold text-white sm:text-5xl">
            Level up your Solana skills with on-chain learning.
          </h1>
          <p className="max-w-2xl text-zinc-300">
            Build production-ready dApps, earn verifiable credentials, and learn from practical,
            security-focused lessons built for ecosystem contributors.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild className="bg-gradient-to-r from-[#9945FF] to-[#14F195] text-black">
              <Link href="/courses">
                Start learning
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="border-white/20 bg-transparent text-white">
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
        <h2 className="text-2xl font-semibold text-zinc-100">Learning paths</h2>
        <div className="grid gap-4 lg:grid-cols-3">
          {learningTracks.map((track) => (
            <Card key={track.title} className="border-white/10 bg-zinc-900/70">
              <CardHeader>
                <CardTitle className="text-zinc-100">{track.title}</CardTitle>
                <p className="text-sm text-zinc-400">{track.description}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {track.modules.map((module, index) => (
                  <div
                    key={module}
                    className="flex items-center gap-3 rounded-lg border border-white/10 bg-zinc-950/60 px-3 py-2"
                  >
                    <span className="inline-flex size-6 items-center justify-center rounded-full border border-[#14F195]/50 text-xs text-[#14F195]">
                      {index + 1}
                    </span>
                    <p className="text-sm text-zinc-200">{module}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-zinc-100">Why builders choose Superteam Academy</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {featureGrid.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.article
                key={feature.title}
                className="rounded-xl border border-white/10 bg-zinc-900/70 p-4"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35 }}
              >
                <div className="mb-3 inline-flex rounded-lg border border-[#9945FF]/40 bg-[#9945FF]/15 p-2 text-[#14F195]">
                  <Icon className="size-4" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-100">{feature.title}</h3>
                <p className="mt-2 text-sm text-zinc-400">{feature.description}</p>
              </motion.article>
            );
          })}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-zinc-100">What learners are shipping</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {landingTestimonials.map((item) => (
            <article key={item.name} className="rounded-xl border border-white/10 bg-zinc-900/70 p-4">
              <p className="text-sm leading-relaxed text-zinc-200">"{item.quote}"</p>
              <div className="mt-4 flex items-center gap-3">
                <Avatar className="border border-white/15 bg-zinc-950">
                  <AvatarFallback className="bg-zinc-900 text-xs text-zinc-200">
                    {item.name
                      .split(" ")
                      .map((chunk) => chunk[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold text-zinc-100">{item.name}</p>
                  <p className="text-xs text-zinc-400">{item.role}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/75 p-8">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(153,69,255,0.18),transparent_40%,rgba(20,241,149,0.18))]" />
        <div className="relative flex flex-col items-start justify-between gap-5 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-semibold text-zinc-100">Ready to Build the Future?</h2>
            <p className="mt-2 max-w-xl text-zinc-300">
              Join Solana engineers advancing from fundamentals to production architecture.
            </p>
          </div>
          <Button asChild className="bg-gradient-to-r from-[#9945FF] to-[#14F195] text-black">
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
    <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-3">
      <p className="text-2xl font-semibold text-zinc-100">{formatNumber(count)}</p>
      <p className="text-xs text-zinc-400">{label}</p>
    </div>
  );
}
