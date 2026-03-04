"use client";
import {
  Play,
  Code,
  ChevronRight,
  Users,
  Trophy,
  Store,
  Wallet,
  Flame,
  Repeat,
  Zap,
  Cloud,
} from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { CourseCard, FeatureCard } from "@workspace/ui/components/custom-card";
import { appDomainUrl } from "@/lib/constant";

const companies = [
  { name: "Metaplex", icon: Store },
  { name: "Phantom", icon: Wallet },
  { name: "Magic Eden", icon: Flame },
  { name: "Jupiter", icon: Repeat },
  { name: "Solana Labs", icon: Zap },
  { name: "Helius", icon: Cloud },
];

export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative flex items-center justify-center overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 z-0">
          <Image
            width={800}
            height={800}
            src="/hero-bg.png"
            priority
            alt="Background"
            className="w-full h-full object-cover  grayscale-50 dark:grayscale-0 opacity-20 dark:opacity-30"
          />
          <div className="absolute inset-0 bg-linear-to-b from-background/0 via-background/80 to-background" />
          <div className="absolute inset-0 bg-linear-to-r from-background via-transparent to-background" />
        </div>

        <div className="container relative z-10 px-4 py-28 flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge
              variant="outline"
              className="mb-6 px-4 py-1.5 border-primary/20 bg-primary/5 text-primary rounded-full uppercase tracking-wider text-xs font-bold shadow-[0_0_15px_-3px_rgba(20,241,149,0.3)]"
            >
              Now Live on Devnet
            </Badge>
          </motion.div>

          <motion.h1
            className="text-5xl md:text-7xl lg:text-7xl font-heading font-bold tracking-tighter mb-6 max-w-4xl bg-clip-text text-accent-foreground/90 dark:text-accent-foreground/80 bg-linear-to-b from-white via-white to-white/50"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Master Solana <br /> Development
          </motion.h1>

          <motion.p
            className="text-lg tracking-tight font-medium text-muted-foreground mb-10 max-w-2xl leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Learn Solana from fundamentals to deployment with
            <br /> interactive lessons and practical challenges.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Link target="_blank" className="grid" href={appDomainUrl}>
              <Button
                size="lg"
                className="h-14 px-8 text-base hover:scale-105 transition-all duration-300 font-bold"
              >
                Start Learning <Play className="ml-2 w-4 h-4 fill-primary" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="h-14 px-8 text-base   backdrop-blur-sm"
            >
              View Bounties
            </Button>
          </motion.div>

          {/* Tech Stack Slider */}
          {/* Used By Section */}
          <motion.div
            className="mt-20 max-w-sm lg:max-w-2xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            {/* Company Logos Slider */}
            <div className="relative overflow-hidden">
              {/* Gradient overlays for blur effect */}
              <div className="absolute left-0 top-0 bottom-0 w-24 bg-linear-to-r from-background to-transparent z-10 pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-0 w-24 bg-linear-to-l from-background to-transparent z-10 pointer-events-none" />

              <motion.div
                className="flex gap-10 md:gap-16 opacity-40 grayscale"
                animate={{ x: "-50%" }}
                transition={{
                  duration: 25,
                  repeat: Infinity,
                  ease: "linear",
                }}
              >
                {[...companies, ...companies].map((company, index) => (
                  <div
                    key={`${company.name}-${index}`}
                    className="flex items-center gap-3 whitespace-nowrap shrink-0"
                  >
                    <company.icon className="w-6 h-6" />
                    <span className="font-heading text-base  font-bold tracking-tight">
                      {company.name}
                    </span>
                  </div>
                ))}
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 border-t border-white/5 bg-black/50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Code className="w-8 h-8 text-primary" />}
              title="Interactive Coding"
              description="Write, test, and deploy Rust smart contracts directly in your browser. No setup required."
            />
            <FeatureCard
              icon={<Trophy className="w-8 h-8 text-secondary" />}
              title="On-Chain Rewards"
              description="Earn verifiable XP tokens and NFTs for completing lessons and challenges."
            />
            <FeatureCard
              icon={<Users className="w-8 h-8 text-blue-400" />}
              title="Community Bounties"
              description="Graduates get access to exclusive paid opportunities from top Solana projects."
            />
          </div>
        </div>
      </section>

      {/* Learning Tracks */}
      <section className="py-24 bg-grid-white/[0.02]">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
                Learning Tracks
              </h2>
              <p className="text-muted-foreground">
                Structured paths from zero to hero.
              </p>
            </div>
            <Button
              variant="ghost"
              className="text-primary hover:text-primary/80"
            >
              View All <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <CourseCard
              title="Solana Fundamentals"
              level="Beginner"
              modules={8}
              xp={500}
              image="https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&q=80&w=800"
              progress={0}
            />
            <CourseCard
              title="Rust for Smart Contracts"
              level="Intermediate"
              modules={12}
              xp={1200}
              image="https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=800"
              progress={35}
            />
            <CourseCard
              title="DeFi Architecture"
              level="Advanced"
              modules={15}
              xp={2500}
              image="https://images.unsplash.com/photo-1642104704074-907c0698cbd9?auto=format&fit=crop&q=80&w=800"
              progress={0}
            />
          </div>
        </div>
      </section>
    </>
  );
}
