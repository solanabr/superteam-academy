'use client';

import { useTranslations } from 'next-intl';
import { useSession, signIn } from 'next-auth/react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  BookOpen,
  UserPlus,
  Users,
  Zap,
  Wallet,
  Terminal,
} from 'lucide-react';

const STATS = [
  { icon: BookOpen, value: '40+', label: 'Courses' },
  { icon: Users, value: '2,500+', label: 'Learners' },
  { icon: Zap, value: '1.2M', label: 'XP Awarded' },
] as const;

const CODE_LINES = [
  { indent: 0, tokens: [{ text: 'use ', color: 'text-purple-400' }, { text: 'anchor_lang', color: 'text-green-400' }, { text: '::prelude::*;', color: 'text-foreground/70' }] },
  { indent: 0, tokens: [] },
  { indent: 0, tokens: [{ text: '#[program]', color: 'text-yellow-400' }] },
  { indent: 0, tokens: [{ text: 'pub mod ', color: 'text-purple-400' }, { text: 'superteam_academy ', color: 'text-green-400' }, { text: '{', color: 'text-foreground/70' }] },
  { indent: 1, tokens: [{ text: 'pub fn ', color: 'text-purple-400' }, { text: 'complete_lesson', color: 'text-blue-400' }, { text: '(', color: 'text-foreground/70' }] },
  { indent: 2, tokens: [{ text: 'ctx: ', color: 'text-foreground/70' }, { text: 'Context', color: 'text-yellow-400' }, { text: '<CompleteLessonCtx>,', color: 'text-foreground/70' }] },
  { indent: 2, tokens: [{ text: 'xp_reward: ', color: 'text-foreground/70' }, { text: 'u64', color: 'text-yellow-400' }] },
  { indent: 1, tokens: [{ text: ') -> ', color: 'text-foreground/70' }, { text: 'Result', color: 'text-yellow-400' }, { text: '<()> {', color: 'text-foreground/70' }] },
  { indent: 2, tokens: [{ text: 'let learner = &', color: 'text-foreground/70' }, { text: 'mut ', color: 'text-purple-400' }, { text: 'ctx.accounts.learner;', color: 'text-foreground/70' }] },
  { indent: 2, tokens: [{ text: 'learner.xp += xp_reward;', color: 'text-foreground/70' }] },
  { indent: 2, tokens: [{ text: 'emit!', color: 'text-purple-400' }, { text: '(LessonCompleted {', color: 'text-foreground/70' }] },
  { indent: 3, tokens: [{ text: 'learner: ', color: 'text-foreground/70' }, { text: 'learner.key()', color: 'text-blue-400' }, { text: ',', color: 'text-foreground/70' }] },
  { indent: 3, tokens: [{ text: 'xp_earned: xp_reward', color: 'text-foreground/70' }] },
  { indent: 2, tokens: [{ text: '});', color: 'text-foreground/70' }] },
  { indent: 2, tokens: [{ text: 'Ok', color: 'text-green-400' }, { text: '(())', color: 'text-foreground/70' }] },
  { indent: 1, tokens: [{ text: '}', color: 'text-foreground/70' }] },
  { indent: 0, tokens: [{ text: '}', color: 'text-foreground/70' }] },
];

export function HeroSection() {
  const t = useTranslations('landing');
  const tCommon = useTranslations('common');
  const { status: authStatus } = useSession();
  const { connected, select, wallets } = useWallet();

  function handleConnectWallet() {
    const firstWallet = wallets[0];
    if (!connected && firstWallet) {
      select(firstWallet.adapter.name);
    }
  }

  return (
    <section
      className="relative overflow-hidden py-16 md:py-24 lg:py-32"
      aria-labelledby="hero-heading"
    >
      {/* Background grid pattern */}
      <div
        className="absolute inset-0 -z-10 opacity-[0.03] dark:opacity-[0.06]"
        style={{
          backgroundImage:
            'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />

      {/* Gradient orbs */}
      <div className="absolute -left-32 -top-32 -z-10 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[128px]" />
      <div className="absolute -bottom-32 -right-32 -z-10 h-[400px] w-[400px] rounded-full bg-accent/10 blur-[128px]" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left column: Copy + CTAs */}
          <div className="flex flex-col items-start gap-6">
            <Badge variant="secondary" className="gap-1.5 px-3 py-1 text-sm">
              <Zap className="h-3.5 w-3.5 text-accent" />
              Powered by Solana
            </Badge>

            <h1
              id="hero-heading"
              className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
            >
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {t('hero_title')}
              </span>
            </h1>

            <p className="max-w-lg text-lg leading-relaxed text-muted-foreground sm:text-xl">
              {t('hero_subtitle')}
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg" className="gap-2" asChild>
                <Link href="/courses">
                  {t('hero_cta')}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>

              {authStatus !== 'authenticated' && (
                <Button
                  variant="outline"
                  size="lg"
                  className="gap-2"
                  onClick={() => signIn()}
                >
                  <UserPlus className="h-4 w-4" />
                  {t('hero_signup')}
                </Button>
              )}

              {!connected && (
                <Button
                  variant="outline"
                  size="lg"
                  className="gap-2"
                  onClick={handleConnectWallet}
                >
                  <Wallet className="h-4 w-4" />
                  {tCommon('connect_wallet')}
                </Button>
              )}
            </div>

            {/* Stats row */}
            <div className="mt-4 flex flex-wrap items-center gap-8">
              {STATS.map((stat) => (
                <div key={stat.label} className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <stat.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-lg font-bold leading-none">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right column: Code terminal mockup */}
          <div className="relative animate-fade-in-up lg:ml-auto">
            <div className="overflow-hidden rounded-xl border bg-card shadow-2xl shadow-primary/5">
              {/* Terminal header */}
              <div className="flex items-center gap-2 border-b bg-muted/50 px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-400/80" />
                  <div className="h-3 w-3 rounded-full bg-yellow-400/80" />
                  <div className="h-3 w-3 rounded-full bg-green-400/80" />
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Terminal className="h-3.5 w-3.5" />
                  <span>lib.rs</span>
                </div>
              </div>

              {/* Code content */}
              <div className="overflow-x-auto p-4">
                <pre className="font-mono text-[13px] leading-relaxed">
                  <code>
                    {CODE_LINES.map((line, lineIdx) => (
                      <div key={lineIdx} className="whitespace-pre">
                        {'  '.repeat(line.indent)}
                        {line.tokens.map((token, tokenIdx) => (
                          <span key={tokenIdx} className={token.color}>
                            {token.text}
                          </span>
                        ))}
                        {line.tokens.length === 0 && '\u00A0'}
                      </div>
                    ))}
                  </code>
                </pre>
              </div>
            </div>

            {/* Floating accent badge */}
            <div className="absolute -bottom-3 -left-3 rounded-lg border bg-card px-3 py-2 shadow-lg sm:-bottom-4 sm:-left-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10">
                  <Zap className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <p className="text-xs font-medium">+250 XP</p>
                  <p className="text-[10px] text-muted-foreground">Lesson Complete</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
