"use client";

import Link from "next/link";
import { ArrowRight, Code2, Award, Gamepad2, Globe, Github, Users, Zap, BookOpen, Trophy, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/provider";

const stats = [
  { label: "Interactive Courses", value: "12+", icon: BookOpen },
  { label: "Active Learners", value: "2,400+", icon: Users },
  { label: "XP Awarded", value: "185K", icon: Trophy },
  { label: "Challenges Solved", value: "9,200+", icon: Zap },
];

const features = [
  {
    icon: Code2,
    title: "Interactive Coding",
    description: "Write, test, and deploy Solana programs directly in your browser with our Monaco-powered editor.",
  },
  {
    icon: Award,
    title: "On-Chain Credentials",
    description: "Earn verifiable compressed NFTs on Solana devnet as proof of your skills and course completions.",
  },
  {
    icon: Gamepad2,
    title: "Gamified Learning",
    description: "Earn XP, level up, maintain streaks, and climb the leaderboard as you master new concepts.",
  },
  {
    icon: Globe,
    title: "Multi-Language",
    description: "Learn in English, Portuguese, or Spanish. Full i18n support across every page and lesson.",
  },
  {
    icon: Github,
    title: "Open Source",
    description: "Built in the open. Contribute courses, fix bugs, or fork it for your own community.",
  },
  {
    icon: Users,
    title: "Community Driven",
    description: "Built by Superteam Brazil for the global Solana ecosystem. Learn together, build together.",
  },
];

const testimonials = [
  {
    name: "Marina Santos",
    role: "Solana Developer, São Paulo",
    quote: "Superteam Academy took me from zero blockchain knowledge to deploying my first Anchor program in under a week. The interactive challenges are incredibly effective.",
    avatar: "MS",
  },
  {
    name: "Carlos Mendez",
    role: "Full-Stack Engineer, Buenos Aires",
    quote: "The gamification keeps me coming back every day. My 30-day streak is proof. Best Solana learning resource I've found, period.",
    avatar: "CM",
  },
  {
    name: "Alex Rivera",
    role: "DeFi Builder, Miami",
    quote: "Finally, a platform that teaches real-world Solana development — not just theory. The on-chain credentials are a brilliant touch for my portfolio.",
    avatar: "AR",
  },
];

const partners = [
  { name: "Solana", width: "w-28" },
  { name: "Superteam", width: "w-32" },
  { name: "Metaplex", width: "w-28" },
  { name: "Helius", width: "w-24" },
  { name: "Anchor", width: "w-24" },
];

export default function LandingPage(): JSX.Element {
  const { t } = useI18n();

  return (
    <div className="flex w-full flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="gradient-mesh absolute inset-0" />
        <div className="absolute inset-0 overflow-hidden">
          <div className="animate-float absolute -right-20 top-20 h-72 w-72 rounded-full bg-solana-purple/10 blur-3xl" />
          <div className="animate-float absolute -left-20 bottom-20 h-72 w-72 rounded-full bg-solana-green/10 blur-3xl" style={{ animationDelay: "3s" }} />
        </div>
        <div className="relative mx-auto flex w-full max-w-7xl flex-col items-center gap-8 px-4 py-24 text-center md:py-32">
          <div className="animate-fade-in-up inline-flex items-center gap-2 rounded-full border border-solana-purple/30 bg-solana-purple/10 px-4 py-1.5 text-sm font-medium text-solana-purple">
            <Star className="h-3.5 w-3.5" />
            Powered by Solana
          </div>
          <h1 className="animate-fade-in-up max-w-4xl text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl" style={{ animationDelay: "100ms" }}>
            {t("landing.heroTitle").split("Solana").map((part, i) =>
              i === 0 ? (
                <span key={i}>
                  {part}
                  <span className="solana-gradient-text">Solana</span>
                </span>
              ) : (
                <span key={i}>{part}</span>
              )
            )}
          </h1>
          <p className="animate-fade-in-up max-w-2xl text-lg text-muted-foreground md:text-xl" style={{ animationDelay: "200ms" }}>
            {t("landing.heroSubtitle")}
          </p>
          <div className="animate-fade-in-up flex flex-wrap justify-center gap-4" style={{ animationDelay: "300ms" }}>
            <Button asChild size="lg" className="animate-pulse-glow h-12 rounded-full bg-solana-purple px-8 text-base font-semibold text-white hover:bg-solana-purple/90">
              <Link href="/courses">{t("landing.primaryCta")}</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 rounded-full px-8 text-base">
              <Link href="/courses">
                {t("landing.secondaryCta")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          {/* Terminal preview */}
          <div className="animate-fade-in-up mt-8 w-full max-w-2xl overflow-hidden rounded-xl border border-border/50 bg-card/80 shadow-2xl backdrop-blur-sm" style={{ animationDelay: "400ms" }}>
            <div className="flex items-center gap-2 border-b border-border/50 px-4 py-3">
              <div className="h-3 w-3 rounded-full bg-red-500/70" />
              <div className="h-3 w-3 rounded-full bg-yellow-500/70" />
              <div className="h-3 w-3 rounded-full bg-green-500/70" />
              <span className="ml-2 text-xs text-muted-foreground">challenge.ts</span>
            </div>
            <div className="p-4 font-mono text-sm">
              <div className="text-muted-foreground">
                <span className="text-solana-purple">import</span> {"{ "}
                <span className="text-solana-green">PublicKey</span>
                {" } "}
                <span className="text-solana-purple">from</span>{" "}
                <span className="text-amber-400">&quot;@solana/web3.js&quot;</span>;
              </div>
              <div className="mt-1 text-muted-foreground">&nbsp;</div>
              <div className="text-muted-foreground">
                <span className="text-solana-purple">export async function</span>{" "}
                <span className="text-solana-green">derivePDA</span>(
                <span className="text-orange-400">seed</span>: <span className="text-blue-400">string</span>
                ) {"{"}
              </div>
              <div className="text-muted-foreground">
                {"  "}
                <span className="text-solana-purple">const</span> [pda] ={" "}
                <span className="text-solana-green">PublicKey</span>.findProgramAddressSync(
              </div>
              <div className="text-muted-foreground">
                {"    "}[Buffer.from(<span className="text-orange-400">seed</span>)], <span className="text-solana-green">PROGRAM_ID</span>
              </div>
              <div className="text-muted-foreground">{"  "});</div>
              <div className="text-muted-foreground">
                {"  "}
                <span className="text-solana-purple">return</span> pda;
              </div>
              <div className="text-muted-foreground">{"}"}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-border/50 bg-muted/30">
        <div className="stagger-children mx-auto grid w-full max-w-7xl grid-cols-2 gap-8 px-4 py-16 md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-2 text-center">
              <stat.icon className="h-6 w-6 text-solana-green" />
              <span className="text-3xl font-bold tracking-tight md:text-4xl">{stat.value}</span>
              <span className="text-sm text-muted-foreground">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="mx-auto w-full max-w-7xl px-4 py-24">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Everything you need to{" "}
            <span className="solana-gradient-text">master Solana</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            A complete learning platform built for developers, by developers.
          </p>
        </div>
        <div className="stagger-children grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} className="group relative overflow-hidden transition-all hover:border-solana-purple/40 hover:shadow-lg hover:shadow-solana-purple/5">
              <div className="absolute inset-0 bg-gradient-to-br from-solana-purple/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <CardHeader className="relative">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-solana-purple/10">
                  <feature.icon className="h-5 w-5 text-solana-purple" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Learning Paths */}
      <section className="border-y border-border/50 bg-muted/30">
        <div className="mx-auto w-full max-w-7xl px-4 py-24">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">{t("landing.pathTitle")}</h2>
            <p className="mt-4 text-lg text-muted-foreground">{t("landing.pathSubtitle")}</p>
          </div>
          <div className="stagger-children grid gap-6 md:grid-cols-3">
            {(["foundations", "programs", "fullstack"] as const).map((key, i) => (
              <Card key={key} className="group relative overflow-hidden transition-all hover:shadow-lg">
                <div className="absolute inset-x-0 top-0 h-1 solana-gradient" />
                <CardHeader>
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-solana-purple/10 text-lg font-bold text-solana-purple">
                    {i + 1}
                  </div>
                  <CardTitle>{t(`landing.paths.${key}.title`)}</CardTitle>
                  <p className="text-sm text-muted-foreground">{t(`landing.paths.${key}.description`)}</p>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="secondary" className="w-full">
                    <Link href="/courses">{t("landing.primaryCta")}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof / Partners */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16">
        <p className="mb-8 text-center text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Built with the best in the Solana ecosystem
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
          {partners.map((partner) => (
            <div
              key={partner.name}
              className={`${partner.width} flex h-12 items-center justify-center rounded-lg border border-border/50 bg-muted/50 px-4 text-sm font-semibold text-muted-foreground transition-colors hover:border-solana-purple/30 hover:text-foreground`}
            >
              {partner.name}
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-y border-border/50 bg-muted/30">
        <div className="mx-auto w-full max-w-7xl px-4 py-24">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Loved by <span className="solana-gradient-text">builders</span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Join thousands of developers leveling up their Solana skills.
            </p>
          </div>
          <div className="stagger-children grid gap-6 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.name} className="relative">
                <CardContent className="pt-6">
                  <div className="mb-4 flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-solana-green text-solana-green" />
                    ))}
                  </div>
                  <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
                    &ldquo;{testimonial.quote}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-solana-purple/20 text-sm font-bold text-solana-purple">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{testimonial.name}</p>
                      <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="mx-auto w-full max-w-7xl px-4 py-24">
        <div className="relative overflow-hidden rounded-2xl p-px">
          <div className="solana-gradient absolute inset-0 opacity-20" />
          <div className="relative rounded-2xl bg-card px-8 py-16 text-center md:px-16">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Ready to build on{" "}
              <span className="solana-gradient-text">Solana</span>?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
              Start your journey today. Free, open-source, and powered by the community.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Button asChild size="lg" className="h-12 rounded-full bg-solana-purple px-8 text-base font-semibold text-white hover:bg-solana-purple/90">
                <Link href="/courses">{t("landing.primaryCta")}</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 rounded-full px-8 text-base">
                <Link href="https://github.com/solanabr/superteam-academy" target="_blank" rel="noopener noreferrer">
                  <Github className="mr-2 h-4 w-4" />
                  Star on GitHub
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
