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

const ECOSYSTEM_PARTNERS = [
  'Solana Foundation',
  'Metaplex',
  'Helius',
  'Jupiter',
  'Phantom',
  'Superteam',
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
          <div className="flex flex-wrap items-center justify-center gap-8">
            {ECOSYSTEM_PARTNERS.map((partner) => (
              <div
                key={partner}
                className="flex h-10 items-center rounded-lg bg-muted/50 px-5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {partner}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
