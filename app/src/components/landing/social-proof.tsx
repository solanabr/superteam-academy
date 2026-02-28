'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { MessageSquare, Users } from 'lucide-react';

interface Testimonial {
  quote: string;
  author: string;
  role: string;
  walletPrefix: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote: 'Superteam Academy gave me the structured path I needed. I went from zero Rust knowledge to deploying my first program in two weeks.',
    author: 'Alex K.',
    role: 'Solana Developer',
    walletPrefix: '4xRt',
  },
  {
    quote: 'The XP system kept me motivated. Earning real on-chain credentials I can show to employers made every lesson feel valuable.',
    author: 'Maria S.',
    role: 'DeFi Builder',
    walletPrefix: '9kBm',
  },
  {
    quote: 'The security track opened my eyes to how many subtle vulnerabilities exist. Best investment in my career as an auditor.',
    author: 'Chen W.',
    role: 'Security Researcher',
    walletPrefix: '2nLe',
  },
];

interface EcosystemPartner {
  name: string;
  /** First letter displayed as the badge icon */
  initial: string;
  /** Tailwind gradient classes for the badge icon background */
  gradient: string;
}

const ECOSYSTEM_PARTNERS: EcosystemPartner[] = [
  { name: 'Solana Foundation', initial: 'S', gradient: 'from-violet-500 to-purple-600' },
  { name: 'Metaplex', initial: 'M', gradient: 'from-pink-500 to-rose-600' },
  { name: 'Helius', initial: 'H', gradient: 'from-orange-400 to-amber-600' },
  { name: 'Jupiter', initial: 'J', gradient: 'from-emerald-400 to-teal-600' },
  { name: 'Phantom', initial: 'P', gradient: 'from-indigo-400 to-blue-600' },
  { name: 'Superteam', initial: 'ST', gradient: 'from-cyan-400 to-sky-600' },
];

interface StatItem {
  value: string;
  label: string;
}

const COMMUNITY_STATS: StatItem[] = [
  { value: '2,500+', label: 'Active Learners' },
  { value: '40+', label: 'Interactive Courses' },
  { value: '95%', label: 'Completion Rate' },
  { value: '500+', label: 'Credentials Minted' },
];

export function SocialProof() {
  const t = useTranslations('landing');

  return (
    <section
      className="py-16 md:py-24"
      aria-labelledby="social-proof-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="flex flex-col items-center gap-4 text-center">
          <Badge variant="outline" className="gap-1.5">
            <Users className="h-3.5 w-3.5" />
            Community
          </Badge>
          <h2
            id="social-proof-heading"
            className="text-3xl font-bold tracking-tight sm:text-4xl"
          >
            {t('social_proof_title')}
          </h2>
          <p className="max-w-2xl text-muted-foreground">
            Join thousands of Solana developers building the future of
            decentralized applications.
          </p>
        </div>

        {/* Community stats */}
        <div className="mt-12 grid grid-cols-2 gap-6 sm:grid-cols-4">
          {COMMUNITY_STATS.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-1 text-center">
              <p className="text-3xl font-bold tracking-tight">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        <Separator className="my-12" />

        {/* Testimonials */}
        <div className="grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((testimonial) => (
            <Card key={testimonial.walletPrefix} className="relative">
              <CardContent className="pt-6">
                <MessageSquare className="mb-3 h-5 w-5 text-primary/40" />
                <blockquote className="text-sm leading-relaxed text-foreground">
                  &ldquo;{testimonial.quote}&rdquo;
                </blockquote>
                <div className="mt-4 flex items-center gap-3">
                  {/* Avatar placeholder */}
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {testimonial.author.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{testimonial.author}</p>
                    <p className="text-xs text-muted-foreground">
                      {testimonial.role}
                      <span className="ml-1.5 font-mono text-[10px] text-muted-foreground/60">
                        {testimonial.walletPrefix}...
                      </span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Ecosystem partners */}
        <div className="mt-16 flex flex-col items-center gap-6">
          <p className="text-sm font-medium text-muted-foreground">
            Trusted by the Solana ecosystem
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {ECOSYSTEM_PARTNERS.map((partner) => (
              <div
                key={partner.name}
                className="group flex items-center gap-2.5 rounded-xl border bg-card px-4 py-2.5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${partner.gradient} text-xs font-bold text-white shadow-sm`}
                >
                  {partner.initial}
                </div>
                <span className="text-sm font-medium text-muted-foreground transition-colors group-hover:text-foreground">
                  {partner.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
