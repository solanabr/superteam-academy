import Link from "next/link";
import { ArrowRight, BookOpen, Trophy, Flame, Shield, Code, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const STATS = [
  { label: "Courses", value: "20+" },
  { label: "Learners", value: "5,000+" },
  { label: "XP Earned", value: "2M+" },
  { label: "Credentials", value: "1,200+" },
];

const FEATURES = [
  { icon: BookOpen, title: "Interactive Courses", description: "Learn by building with hands-on code challenges and real Solana programs." },
  { icon: Trophy, title: "On-Chain XP", description: "Earn soulbound XP tokens tracked on Solana. Your progress is verifiable." },
  { icon: Flame, title: "Streak System", description: "Build consistency with daily learning streaks and unlock streak-based achievements." },
  { icon: Shield, title: "Verifiable Credentials", description: "Earn ZK-compressed credentials that prove your skills on-chain." },
  { icon: Code, title: "Code Challenges", description: "Write real Rust and TypeScript code in an integrated editor with instant feedback." },
  { icon: Users, title: "Community Driven", description: "Join a community of Solana builders and climb the leaderboard together." },
];

const TRACKS = [
  { name: "Anchor Framework", color: "from-purple-500 to-indigo-600", courses: 3, description: "Build Solana programs with Anchor" },
  { name: "Rust for Solana", color: "from-orange-500 to-red-600", courses: 2, description: "Master Rust for blockchain development" },
  { name: "DeFi Development", color: "from-green-400 to-emerald-600", courses: 2, description: "Build decentralized finance protocols" },
  { name: "Program Security", color: "from-red-500 to-rose-600", courses: 1, description: "Audit and secure Solana programs" },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 py-24 sm:py-32">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-solana-purple/5 via-transparent to-transparent" />
        <div className="absolute top-20 left-1/4 -z-10 h-72 w-72 rounded-full bg-solana-purple/10 blur-3xl" />
        <div className="absolute top-40 right-1/4 -z-10 h-72 w-72 rounded-full bg-solana-green/10 blur-3xl" />
        <div className="mx-auto max-w-4xl text-center">
          <Badge variant="secondary" className="mb-6">
            Built on Solana
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            Learn Solana.{" "}
            <span className="bg-gradient-to-r from-solana-purple to-solana-green bg-clip-text text-transparent">
              Earn On-Chain.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Master Solana development through interactive courses, code challenges, and gamified progression.
            Your XP and credentials live on-chain — forever verifiable.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button asChild size="xl" variant="solana">
              <Link href="/courses">
                Start Learning <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="xl" variant="outline">
              <Link href="/leaderboard">View Leaderboard</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y bg-muted/30 px-4 py-12">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 md:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl font-bold bg-gradient-to-r from-solana-purple to-solana-green bg-clip-text text-transparent">
                {stat.value}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Learning Paths */}
      <section className="px-4 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">Learning Paths</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Choose a track and progress from beginner to expert.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {TRACKS.map((track) => (
              <Link key={track.name} href="/courses">
                <Card className="group cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1">
                  <CardContent className="p-6">
                    <div className={`h-2 w-12 rounded-full bg-gradient-to-r ${track.color} mb-4`} />
                    <h3 className="font-semibold group-hover:text-solana-purple transition-colors">{track.name}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{track.description}</p>
                    <p className="mt-4 text-xs font-medium text-muted-foreground">{track.courses} courses</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-muted/20 px-4 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">Why Superteam Academy?</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Everything you need to become a Solana developer.
            </p>
          </div>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <Card key={feature.title} className="border-0 bg-transparent shadow-none">
                <CardContent className="p-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mt-4 font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">Ready to start building?</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Connect your wallet and begin earning on-chain XP today.
          </p>
          <Button asChild size="xl" variant="solana" className="mt-8">
            <Link href="/courses">
              Browse Courses <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
