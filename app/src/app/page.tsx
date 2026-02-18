import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  GraduationCap,
  Zap,
  Shield,
  Users,
  ArrowRight,
  BookOpen,
  Trophy,
  Flame,
  Code,
  Layers,
} from "lucide-react";

const FEATURES = [
  {
    icon: Zap,
    title: "Soulbound XP",
    description:
      "Earn non-transferable XP tokens on Solana. Your score is your on-chain reputation.",
    color: "text-solana-green",
  },
  {
    icon: Shield,
    title: "Verifiable Credentials",
    description:
      "ZK compressed credentials that upgrade as you progress through learning tracks.",
    color: "text-solana-purple",
  },
  {
    icon: Flame,
    title: "Streak System",
    description:
      "Build daily learning habits. Earn freezes and unlock streak milestones.",
    color: "text-orange-400",
  },
  {
    icon: Trophy,
    title: "Achievements",
    description:
      "Unlock 256 achievements through learning, consistency, and community engagement.",
    color: "text-yellow-400",
  },
  {
    icon: Users,
    title: "Creator Rewards",
    description:
      "Course authors earn XP when students complete their content.",
    color: "text-solana-blue",
  },
  {
    icon: Layers,
    title: "Season Progression",
    description:
      "New seasons bring fresh competition. Old tokens remain as historical proof.",
    color: "text-indigo-400",
  },
];

const STATS = [
  { label: "Courses", value: "6" },
  { label: "Learners", value: "12K+" },
  { label: "Lessons", value: "56" },
  { label: "XP Minted", value: "4.2M" },
];

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-solana-purple/5 via-transparent to-transparent" />
        <div className="absolute top-1/4 left-1/4 h-96 w-96 bg-solana-purple/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 h-64 w-64 bg-solana-green/10 rounded-full blur-3xl" />

        <div className="container relative pt-24 pb-20 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border bg-card/50 text-sm mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-solana-green opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-solana-green" />
            </span>
            Season 1 Active on Devnet
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight max-w-4xl leading-tight">
            Learn Solana.{" "}
            <span className="gradient-text">Earn On-Chain.</span>
          </h1>

          <p className="mt-6 text-lg text-muted-foreground max-w-2xl">
            The decentralized learning platform where your progress lives on
            Solana. Soulbound XP, verifiable credentials, and gamified
            progression for every developer.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mt-10">
            <Link href="/courses">
              <Button size="lg" variant="solana" className="text-base px-8">
                <BookOpen className="mr-2 h-5 w-5" />
                Browse Courses
              </Button>
            </Link>
            <Link href="/leaderboard">
              <Button size="lg" variant="outline" className="text-base px-8">
                <Trophy className="mr-2 h-5 w-5" />
                Leaderboard
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 w-full max-w-2xl">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold gradient-text">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold">
            Everything on-chain. Nothing to hide.
          </h2>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
            Built with Anchor, Token-2022, and ZK Compression. Every XP point
            and credential is verifiable on Solana.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card
                key={feature.title}
                className="group hover:border-primary/30 transition-all duration-300"
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 rounded-lg bg-muted flex-shrink-0">
                      <Icon className={`h-5 w-5 ${feature.color}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Tech Stack */}
      <section className="container py-20">
        <Card className="overflow-hidden">
          <CardContent className="p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-4">
                  Built for Solana developers,
                  <br />
                  <span className="gradient-text">by Solana developers.</span>
                </h2>
                <p className="text-muted-foreground mb-6">
                  Master Anchor, Rust, DeFi, Security, and more through
                  interactive courses with on-chain verification.
                </p>
                <Link href="/courses">
                  <Button>
                    Start Learning
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Anchor 0.31+", icon: Code },
                  { label: "Token-2022", icon: Zap },
                  { label: "ZK Compression", icon: Layers },
                  { label: "Next.js 14", icon: GraduationCap },
                ].map((tech) => (
                  <div
                    key={tech.label}
                    className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border"
                  >
                    <tech.icon className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-sm font-medium">{tech.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* CTA */}
      <section className="container pb-20">
        <div className="relative rounded-2xl overflow-hidden p-8 md:p-16 text-center">
          <div className="absolute inset-0 bg-gradient-to-r from-solana-purple/20 via-solana-blue/10 to-solana-green/20" />
          <div className="absolute inset-0 bg-card/80" />
          <div className="relative">
            <h2 className="text-3xl font-bold mb-4">
              Ready to build on Solana?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Connect your wallet, pick a course, and start earning XP today.
              Your on-chain learning journey begins here.
            </p>
            <Link href="/courses">
              <Button size="lg" variant="solana" className="text-base px-10">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
