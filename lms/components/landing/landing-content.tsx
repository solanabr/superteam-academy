"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Trophy,
  Flame,
  Shield,
  Code,
  Users,
  Wallet,
  GraduationCap,
  Award,
} from "lucide-react";
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
  {
    icon: BookOpen,
    title: "Interactive Courses",
    description:
      "Learn by building with hands-on code challenges and real Solana programs.",
  },
  {
    icon: Trophy,
    title: "On-Chain XP",
    description:
      "Earn soulbound XP tokens tracked on Solana. Your progress is verifiable.",
  },
  {
    icon: Flame,
    title: "Streak System",
    description:
      "Build consistency with daily learning streaks and unlock streak-based achievements.",
  },
  {
    icon: Shield,
    title: "Verifiable Credentials",
    description:
      "Earn ZK-compressed credentials that prove your skills on-chain.",
  },
  {
    icon: Code,
    title: "Code Challenges",
    description:
      "Write real Rust and TypeScript code in an integrated editor with instant feedback.",
  },
  {
    icon: Users,
    title: "Community Driven",
    description:
      "Join a community of Solana builders and climb the leaderboard together.",
  },
];

const TRACKS = [
  {
    name: "Anchor Framework",
    color: "from-[#008c4c] to-[#2f6b3f]",
    courses: 3,
    description: "Build Solana programs with Anchor",
  },
  {
    name: "Rust for Solana",
    color: "from-[#ffd23f] to-[#f7eacb]",
    courses: 2,
    description: "Master Rust for blockchain development",
  },
  {
    name: "DeFi Development",
    color: "from-[#2f6b3f] to-[#1b231d]",
    courses: 2,
    description: "Build decentralized finance protocols",
  },
  {
    name: "Program Security",
    color: "from-[#1b231d] to-[#2f6b3f]",
    courses: 1,
    description: "Audit and secure Solana programs",
  },
];

const STEPS = [
  {
    icon: Wallet,
    title: "Connect Wallet",
    description: "Link your Solana wallet to start tracking progress on-chain.",
  },
  {
    icon: GraduationCap,
    title: "Learn & Build",
    description:
      "Complete interactive lessons and hands-on code challenges.",
  },
  {
    icon: Award,
    title: "Earn Credentials",
    description:
      "Get verifiable on-chain credentials as you master each track.",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

export function LandingContent() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 py-20 sm:py-28">
        {/* Animated gradient blobs */}
        <motion.div
          className="absolute top-20 left-1/4 -z-10 h-72 w-72 rounded-full bg-[#008c4c]/10 blur-3xl"
          animate={{
            x: [0, 30, -20, 0],
            y: [0, -20, 15, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute top-40 right-1/4 -z-10 h-72 w-72 rounded-full bg-[#ffd23f]/10 blur-3xl"
          animate={{
            x: [0, -25, 20, 0],
            y: [0, 25, -15, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute bottom-10 left-1/2 -z-10 h-56 w-56 rounded-full bg-[#2f6b3f]/8 blur-3xl"
          animate={{
            x: [0, 20, -30, 0],
            y: [0, -15, 20, 0],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        />

        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
          {/* Left: text */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={fadeUp}>
              <Badge variant="secondary" className="mb-6">
                Built on Solana
              </Badge>
            </motion.div>
            <motion.h1
              variants={fadeUp}
              className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
            >
              Learn Solana.
              <br />
              <span className="rounded-md bg-white/60 px-2 -mx-2 dark:bg-transparent">
                <span className="bg-gradient-to-r from-[#008c4c] to-[#ffd23f] bg-clip-text text-transparent">
                  Earn On-Chain.
                </span>
              </span>
            </motion.h1>
            <motion.p
              variants={fadeUp}
              className="mt-6 max-w-lg text-lg text-muted-foreground"
            >
              Master Solana development through interactive courses, code
              challenges, and gamified progression. Your XP and credentials live
              on-chain — forever verifiable.
            </motion.p>
            <motion.div
              variants={fadeUp}
              className="mt-8 flex flex-col gap-4 sm:flex-row"
            >
              <Button asChild size="xl" variant="solana">
                <Link href="/courses">
                  Start Learning <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="xl" variant="outline">
                <Link href="/leaderboard">View Leaderboard</Link>
              </Button>
            </motion.div>
          </motion.div>

          {/* Right: toucan mascot */}
          <motion.div
            className="relative mx-auto w-full max-w-md lg:max-w-none"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Image
                src="/hero-toucan.jpg"
                alt="Superteam Brasil mascot"
                width={500}
                height={500}
                className="rounded-2xl"
                priority
              />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y bg-muted/30 px-4 py-12">
        <motion.div
          className="mx-auto grid max-w-5xl grid-cols-2 gap-8 md:grid-cols-4"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {STATS.map((stat) => (
            <motion.div
              key={stat.label}
              variants={fadeUp}
              className="text-center"
            >
              <p className="text-3xl font-bold">
                <span className="rounded bg-white/60 px-1 -mx-1 dark:bg-transparent">
                  <span className="bg-gradient-to-r from-[#008c4c] to-[#ffd23f] bg-clip-text text-transparent">
                    {stat.value}
                  </span>
                </span>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* How It Works */}
      <section className="px-4 py-24">
        <div className="mx-auto max-w-5xl">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold sm:text-4xl">How It Works</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Three steps to start your Solana journey.
            </p>
          </motion.div>

          <motion.div
            className="relative mt-16 grid gap-8 sm:grid-cols-3"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            {/* Connecting line (desktop only) */}
            <div className="absolute top-10 left-[16.67%] right-[16.67%] hidden h-px bg-border sm:block" />

            {STEPS.map((step, i) => (
              <motion.div
                key={step.title}
                variants={fadeUp}
                className="relative flex flex-col items-center text-center"
              >
                <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full border-2 border-primary bg-background">
                  <step.icon className="h-8 w-8 text-primary" />
                </div>
                <span className="mt-1 text-xs font-bold text-primary">
                  Step {i + 1}
                </span>
                <h3 className="mt-3 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground max-w-[250px]">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Learning Paths */}
      <section className="border-t bg-muted/20 px-4 py-24">
        <div className="mx-auto max-w-6xl">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold sm:text-4xl">Learning Paths</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Choose a track and progress from beginner to expert.
            </p>
          </motion.div>
          <motion.div
            className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            {TRACKS.map((track) => (
              <motion.div key={track.name} variants={fadeUp}>
                <Link href="/courses">
                  <motion.div
                    whileHover={{ scale: 1.03, y: -4 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <Card className="group cursor-pointer transition-shadow hover:shadow-lg">
                      <CardContent className="p-6">
                        <div
                          className={`h-2 w-12 rounded-full bg-gradient-to-r ${track.color} mb-4`}
                        />
                        <h3 className="font-semibold group-hover:text-solana-purple transition-colors">
                          {track.name}
                        </h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {track.description}
                        </p>
                        <p className="mt-4 text-xs font-medium text-muted-foreground">
                          {track.courses} courses
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-24">
        <div className="mx-auto max-w-6xl">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold sm:text-4xl">
              Why Superteam Academy?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Everything you need to become a Solana developer.
            </p>
          </motion.div>
          <motion.div
            className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            {FEATURES.map((feature) => (
              <motion.div key={feature.title} variants={fadeUp}>
                <Card className="border-0 bg-transparent shadow-none">
                  <CardContent className="p-0">
                    <motion.div
                      className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10"
                      whileHover={{ scale: 1.1 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 20,
                      }}
                    >
                      <feature.icon className="h-6 w-6 text-primary" />
                    </motion.div>
                    <h3 className="mt-4 font-semibold">{feature.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden px-4 py-24">
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#008c4c]/5 via-transparent to-transparent" />
        <motion.div
          className="mx-auto max-w-3xl text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl font-bold sm:text-4xl">
            Ready to start building?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Connect your wallet and begin earning on-chain XP today.
          </p>
          <Button asChild size="xl" variant="solana" className="mt-8 group">
            <Link href="/courses">
              Browse Courses{" "}
              <motion.span
                className="inline-flex"
                animate={{ x: [0, 4, 0] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <ArrowRight className="h-5 w-5" />
              </motion.span>
            </Link>
          </Button>
        </motion.div>
      </section>
    </div>
  );
}
