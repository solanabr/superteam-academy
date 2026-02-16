'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Zap,
  Code,
  Trophy,
  Shield,
  Flame,
  Star,
  ArrowRight,
  ChevronRight,
  Sparkles,
  BookOpen,
  Users,
  Award,
  Globe,
  Terminal,
  Swords,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MOCK_COURSES } from '@/services/mock-data';
import { APP_CONFIG, DIFFICULTY_CONFIG, TRACK_INFO, XP_CONFIG } from '@/config/constants';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

// Stats
const STATS = [
  { label: 'Active Learners', value: '2,847+', icon: Users },
  { label: 'Quests Available', value: '24', icon: BookOpen },
  { label: 'XP Awarded', value: '1.2M+', icon: Zap },
  { label: 'Credentials Minted', value: '850+', icon: Award },
];

// Features
const FEATURES = [
  {
    icon: Swords,
    title: 'Boss Battle Challenges',
    description:
      'Face off against coding challenges with real-time feedback. Defeat the boss to earn massive XP and rare achievements.',
    gradient: 'from-[#9945FF] to-[#E42575]',
  },
  {
    icon: Terminal,
    title: 'Integrated Code Editor',
    description:
      'Write, test, and deploy Solana programs directly in the browser with syntax highlighting and auto-completion.',
    gradient: 'from-[#14F195] to-[#00D1FF]',
  },
  {
    icon: Trophy,
    title: 'On-Chain Credentials',
    description:
      'Earn evolving compressed NFTs that prove your skills. Your credential upgrades as you master new tracks.',
    gradient: 'from-[#F0B90B] to-[#FF6B35]',
  },
  {
    icon: Flame,
    title: 'Streak & XP System',
    description:
      'Build daily streaks, earn XP, level up, and climb the leaderboard. Your progress is tracked as soulbound tokens.',
    gradient: 'from-[#FF6B35] to-[#FF4D4D]',
  },
  {
    icon: Globe,
    title: 'Multi-Language Support',
    description:
      'Learn in English, Portuguese, or Spanish. Built for the global Solana community with LATAM roots.',
    gradient: 'from-[#00D1FF] to-[#9945FF]',
  },
  {
    icon: Shield,
    title: 'Production-Ready Skills',
    description:
      'Every quest is based on real-world Solana development patterns. Build skills you can use immediately.',
    gradient: 'from-[#E42575] to-[#9945FF]',
  },
];

// Learning paths
const LEARNING_PATHS = [
  {
    track: 'solana-fundamentals' as const,
    courses: 3,
    totalXP: 4500,
    duration: '~20 hours',
  },
  {
    track: 'rust-mastery' as const,
    courses: 4,
    totalXP: 8000,
    duration: '~35 hours',
  },
  {
    track: 'anchor-development' as const,
    courses: 3,
    totalXP: 6500,
    duration: '~28 hours',
  },
  {
    track: 'defi-builder' as const,
    courses: 2,
    totalXP: 5000,
    duration: '~25 hours',
  },
];

export default function LandingPage() {
  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 gradient-quest" />
        <div className="absolute top-20 left-1/4 h-72 w-72 rounded-full bg-[#9945FF]/10 blur-[100px]" />
        <div className="absolute bottom-20 right-1/4 h-72 w-72 rounded-full bg-[#14F195]/10 blur-[100px]" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-24 lg:pt-32 lg:pb-32">
          <motion.div
            className="text-center max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary mb-8"
            >
              <Sparkles className="h-4 w-4" />
              <span>Powered by Solana &bull; Built by Superteam Brazil</span>
            </motion.div>

            {/* Title */}
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight mb-6">
              <span className="text-foreground">Your Epic Quest</span>
              <br />
              <span className="bg-gradient-to-r from-[#9945FF] via-[#14F195] to-[#00D1FF] bg-clip-text text-transparent">
                Into Solana Development
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              Level up from zero to deploying production-ready dApps. Interactive quests,
              boss battle coding challenges, and on-chain credentials that prove your skills.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/courses">
                <Button
                  size="lg"
                  className="gap-2 bg-gradient-to-r from-[#9945FF] to-[#14F195] text-white hover:opacity-90 border-0 text-base px-8 h-12"
                >
                  <Zap className="h-5 w-5" />
                  Start Your Quest
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/courses">
                <Button variant="outline" size="lg" className="gap-2 text-base px-8 h-12">
                  <BookOpen className="h-5 w-5" />
                  Explore Courses
                </Button>
              </Link>
            </div>

            {/* Quick stats */}
            <motion.div
              className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-16 max-w-3xl mx-auto"
              variants={stagger}
              initial="initial"
              animate="animate"
            >
              {STATS.map((stat) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={stat.label}
                    variants={fadeInUp}
                    className="text-center"
                  >
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Icon className="h-4 w-4 text-primary" />
                      <span className="text-2xl font-bold">{stat.value}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Learning Paths Section */}
      <section className="py-20 border-t border-border/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <Badge variant="outline" className="mb-4">
              Quest Lines
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Choose Your Path
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Multiple learning tracks designed to take you from beginner to expert.
              Each path is a series of quests that build on each other.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {LEARNING_PATHS.map((path, index) => {
              const info = TRACK_INFO[path.track];
              return (
                <motion.div
                  key={path.track}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link href={`/courses?track=${path.track}`}>
                    <Card className="group cursor-pointer border-border/50 hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5 h-full">
                      <CardContent className="p-6">
                        <div
                          className="text-3xl mb-3 w-12 h-12 flex items-center justify-center rounded-lg"
                          style={{ backgroundColor: `${info.color}15` }}
                        >
                          {info.icon}
                        </div>
                        <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                          {info.name}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          {info.description}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{path.courses} quests</span>
                          <span>&bull;</span>
                          <span className="flex items-center gap-1">
                            <Zap className="h-3 w-3 text-quest-gold" />
                            {path.totalXP.toLocaleString()} XP
                          </span>
                          <span>&bull;</span>
                          <span>{path.duration}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 border-t border-border/40 gradient-quest">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <Badge variant="outline" className="mb-4">
              Features
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Not Your Average Tutorial Site
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We combined the best of gamified learning platforms with real blockchain
              development tools to create something unique.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="group h-full border-border/50 hover:border-primary/20 transition-all">
                    <CardContent className="p-6">
                      <div
                        className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} mb-4`}
                      >
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Course Preview Section */}
      <section className="py-20 border-t border-border/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="flex items-end justify-between mb-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <div>
              <Badge variant="outline" className="mb-4">
                Latest Quests
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold">
                Begin Your Journey
              </h2>
            </div>
            <Link href="/courses">
              <Button variant="ghost" className="gap-2 hidden sm:flex">
                View All Quests
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {MOCK_COURSES.slice(0, 3).map((course, index) => {
              const diffConfig = DIFFICULTY_CONFIG[course.difficulty];
              const trackInfo = TRACK_INFO[course.track];
              return (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link href={`/courses/${course.slug}`}>
                    <Card className="group cursor-pointer border-border/50 hover:border-primary/30 transition-all hover:shadow-lg overflow-hidden h-full">
                      {/* Course image placeholder */}
                      <div
                        className="h-40 relative overflow-hidden"
                        style={{
                          background: `linear-gradient(135deg, ${trackInfo.color}20, ${trackInfo.color}05)`,
                        }}
                      >
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-6xl opacity-30">{trackInfo.icon}</span>
                        </div>
                        <div className="absolute top-3 left-3">
                          <Badge
                            variant="secondary"
                            className="text-xs"
                            style={{
                              backgroundColor: `${diffConfig.color}20`,
                              color: diffConfig.color,
                            }}
                          >
                            {diffConfig.icon} {diffConfig.label}
                          </Badge>
                        </div>
                        <div className="absolute top-3 right-3">
                          <Badge variant="secondary" className="text-xs gap-1">
                            <Zap className="h-3 w-3 text-quest-gold" />
                            {course.totalXP.toLocaleString()} XP
                          </Badge>
                        </div>
                      </div>

                      <CardContent className="p-5">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm">{trackInfo.icon}</span>
                          <span className="text-xs text-muted-foreground">
                            {trackInfo.name}
                          </span>
                        </div>
                        <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                          {course.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                          {course.shortDescription}
                        </p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-3">
                            <span>{course.duration}</span>
                            <span>&bull;</span>
                            <span>{course.modules.length} chapters</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-quest-gold fill-quest-gold" />
                            <span>{course.rating}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </div>

          <div className="text-center mt-8 sm:hidden">
            <Link href="/courses">
              <Button variant="outline" className="gap-2">
                View All Quests
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Gamification Preview */}
      <section className="py-20 border-t border-border/40 gradient-quest">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Badge variant="outline" className="mb-4">
                Gamification
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Learning That Feels Like Gaming
              </h2>
              <p className="text-muted-foreground mb-8">
                Every lesson earns XP. Every challenge is a boss battle. Your progress lives
                on-chain as evolving credentials that showcase your growth.
              </p>
              <ul className="space-y-4">
                {[
                  {
                    icon: Zap,
                    label: 'XP & Leveling',
                    desc: 'Earn soulbound XP tokens. Level = floor(sqrt(xp/100))',
                    color: '#F0B90B',
                  },
                  {
                    icon: Flame,
                    label: 'Daily Streaks',
                    desc: 'Build consistency with streak tracking and milestone rewards',
                    color: '#FF6B35',
                  },
                  {
                    icon: Award,
                    label: 'Achievements',
                    desc: '256 collectible badges from common to legendary rarity',
                    color: '#9945FF',
                  },
                  {
                    icon: Shield,
                    label: 'On-Chain Credentials',
                    desc: 'Evolving cNFTs that upgrade as you progress through tracks',
                    color: '#14F195',
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.label} className="flex items-start gap-3">
                      <div
                        className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${item.color}15` }}
                      >
                        <Icon className="h-5 w-5" style={{ color: item.color }} />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{item.label}</p>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </motion.div>

            {/* Gamification preview card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card className="border-border/50 overflow-hidden">
                <CardContent className="p-6">
                  {/* Mock profile card */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#9945FF] to-[#14F195] flex items-center justify-center text-white text-2xl font-bold">
                      Q
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">QuestHero.sol</h3>
                      <p className="text-sm text-muted-foreground">Scholar &bull; Level 6</p>
                    </div>
                    <div className="ml-auto flex items-center gap-1">
                      <Flame className="h-5 w-5 text-orange-500" />
                      <span className="font-bold text-orange-500">12</span>
                    </div>
                  </div>

                  {/* XP Bar */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="flex items-center gap-1">
                        <Zap className="h-4 w-4 text-quest-gold" />
                        <span className="font-bold">4,250 XP</span>
                      </span>
                      <span className="text-muted-foreground">4,900 XP to Level 7</span>
                    </div>
                    <div className="h-3 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-[#9945FF] to-[#14F195]"
                        initial={{ width: 0 }}
                        whileInView={{ width: '65%' }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: 0.3 }}
                      />
                    </div>
                  </div>

                  {/* Achievements Preview */}
                  <div className="mb-6">
                    <p className="text-sm font-medium mb-3">Recent Achievements</p>
                    <div className="flex gap-3">
                      {['👣', '🔥', '🦀', '💎'].map((icon, i) => (
                        <motion.div
                          key={i}
                          initial={{ scale: 0 }}
                          whileInView={{ scale: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.5 + i * 0.1, type: 'spring' }}
                          className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-xl border border-border/50"
                        >
                          {icon}
                        </motion.div>
                      ))}
                      <div className="w-12 h-12 rounded-lg bg-muted/50 flex items-center justify-center text-muted-foreground text-sm border border-dashed border-border/50">
                        +12
                      </div>
                    </div>
                  </div>

                  {/* Active Quest */}
                  <div className="rounded-lg border border-border/50 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Active Quest</span>
                      <Badge variant="secondary" className="text-xs">
                        60% Complete
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Solana Fundamentals: The Genesis Quest
                    </p>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-[#9945FF] to-[#14F195]"
                        initial={{ width: 0 }}
                        whileInView={{ width: '60%' }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.5 }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 border-t border-border/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="relative text-center rounded-2xl border border-border/50 overflow-hidden p-12 lg:p-20"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#9945FF]/10 via-transparent to-[#14F195]/10" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-1/2 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

            <div className="relative">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                Ready to Begin Your Quest?
              </h2>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
                Join thousands of developers building on Solana. Your adventure starts with
                a single lesson.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/courses">
                  <Button
                    size="lg"
                    className="gap-2 bg-gradient-to-r from-[#9945FF] to-[#14F195] text-white hover:opacity-90 border-0 text-base px-8 h-12"
                  >
                    <Sparkles className="h-5 w-5" />
                    Start Free
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <a
                  href={APP_CONFIG.github}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="lg" className="gap-2 text-base px-8 h-12">
                    <Code className="h-5 w-5" />
                    View Source
                  </Button>
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
