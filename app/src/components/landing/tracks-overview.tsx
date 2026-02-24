'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  Blocks,
  Code2,
  Gem,
  GraduationCap,
  Shield,
} from 'lucide-react';

interface Track {
  title: string;
  description: string;
  courseCount: number;
  difficultyRange: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  accentBorder: string;
}

const TRACKS: Track[] = [
  {
    title: 'Solana Core',
    description: 'Accounts, transactions, PDAs, CPIs, and the Solana runtime. The essential foundation for every Solana developer.',
    courseCount: 8,
    difficultyRange: 'Beginner \u2013 Intermediate',
    icon: Blocks,
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    accentBorder: 'border-l-primary',
  },
  {
    title: 'DeFi Development',
    description: 'AMMs, lending protocols, order books, and token economics. Build the financial primitives of tomorrow.',
    courseCount: 10,
    difficultyRange: 'Intermediate \u2013 Advanced',
    icon: Code2,
    iconBg: 'bg-accent/10',
    iconColor: 'text-accent',
    accentBorder: 'border-l-accent',
  },
  {
    title: 'NFT & Metaplex',
    description: 'Core NFTs, collections, candy machines, and marketplace integrations using the Metaplex standard.',
    courseCount: 6,
    difficultyRange: 'Beginner \u2013 Intermediate',
    icon: Gem,
    iconBg: 'bg-yellow-500/10',
    iconColor: 'text-yellow-600 dark:text-yellow-400',
    accentBorder: 'border-l-yellow-500',
  },
  {
    title: 'Security & Auditing',
    description: 'Vulnerability patterns, exploit analysis, secure coding practices, and formal verification techniques.',
    courseCount: 5,
    difficultyRange: 'Advanced',
    icon: Shield,
    iconBg: 'bg-red-500/10',
    iconColor: 'text-red-600 dark:text-red-400',
    accentBorder: 'border-l-red-500',
  },
];

export function TracksOverview() {
  const t = useTranslations('landing');

  return (
    <section
      className="py-16 md:py-24"
      aria-labelledby="tracks-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="flex flex-col items-center gap-4 text-center">
          <Badge variant="outline" className="gap-1.5">
            <GraduationCap className="h-3.5 w-3.5" />
            Structured Learning
          </Badge>
          <h2
            id="tracks-heading"
            className="text-3xl font-bold tracking-tight sm:text-4xl"
          >
            {t('tracks_title')}
          </h2>
          <p className="max-w-2xl text-muted-foreground">
            Follow curated tracks from beginner to expert, or pick individual
            courses that match your goals.
          </p>
        </div>

        {/* Tracks grid */}
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {TRACKS.map((track) => (
            <Card
              key={track.title}
              className={`group border-l-4 ${track.accentBorder} transition-shadow hover:shadow-md`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl ${track.iconBg}`}
                  >
                    <track.icon className={`h-6 w-6 ${track.iconColor}`} />
                  </div>
                  <Badge variant="secondary" className="text-[10px]">
                    {track.courseCount} courses
                  </Badge>
                </div>
                <CardTitle className="text-lg">{track.title}</CardTitle>
                <CardDescription className="leading-relaxed">
                  {track.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {track.difficultyRange}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-xs text-primary"
                    asChild
                  >
                    <Link href="/courses">
                      Explore
                      <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
