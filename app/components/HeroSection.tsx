'use client';

import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { useState, useEffect } from 'react';
import { courses } from '@/lib/data/courses';
import { useI18n } from '@/lib/i18n/context';

const totalLessons = courses.reduce((s, c) => s + c.lessons.length, 0);

function WalletIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4h-4z" />
    </svg>
  );
}

export function HeroSection() {
  const { publicKey } = useWallet();
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    if (!publicKey) {
      setCompletedCount(0);
      return;
    }
    const wallet = publicKey.toBase58();
    fetch(`/api/progress?wallet=${encodeURIComponent(wallet)}`)
      .then((r) => r.json())
      .then((data) => {
        const completed = data.completedLessons ?? {};
        const count = Object.values(completed).flat().length;
        setCompletedCount(count);
      })
      .catch(() => setCompletedCount(0));
  }, [publicKey]);

  const isConnected = !!publicKey;
  const { t } = useI18n();

  return (
    <section
      className="relative overflow-hidden border-b border-border/50 bg-[rgb(var(--surface))] transition-colors duration-200"
      aria-labelledby="hero-title"
    >
      {/* Subtle gradient glow for depth */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgb(var(--accent)/0.08),transparent_50%)]" aria-hidden />
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-accent to-transparent opacity-90 sm:w-1.5" aria-hidden />
      <div className="absolute right-0 top-0 h-full w-32 bg-gradient-to-l from-[rgb(var(--surface))] via-[rgb(var(--surface))]/80 to-transparent pointer-events-none" aria-hidden />

      <div className="relative mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="max-w-xl">
          <p className="text-[13px] font-medium uppercase tracking-widest text-[rgb(var(--text-subtle))]">
            {t('heroSubtitle')}
          </p>
          <h1
            id="hero-title"
            className="mt-2 text-2xl font-semibold tracking-tight text-[rgb(var(--text))] sm:text-3xl sm:leading-tight"
          >
            {t('heroTitle')}
          </h1>
          <p className="mt-2 text-[13px] text-[rgb(var(--text-subtle))]">
            {t('heroStatLine')}
          </p>
          <p className="mt-3 text-[15px] leading-snug text-[rgb(var(--text-muted))]">
            {t('heroDescription')}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            <span className="rounded-full border border-accent/40 bg-accent/10 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-accent">
              {t('devnetBadge')}
            </span>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-[rgb(12_16_28)] shadow-[0_0_20px_rgb(var(--accent)/0.35)] transition hover:bg-accent-hover hover:shadow-[0_0_24px_rgb(var(--accent)/0.4)] focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--bg-page))] focus-visible:outline-none"
            >
              <WalletIcon />
              {isConnected ? (completedCount > 0 ? t('heroContinueLearning') : t('heroStartLearning')) : t('heroCtaPrimary')}
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center rounded-lg border border-border/80 bg-[rgb(var(--surface-elevated))]/30 px-4 py-2 text-sm font-medium text-[rgb(var(--text))] transition hover:border-accent/40 hover:bg-[rgb(var(--surface-elevated))]/60 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--bg-page))] focus-visible:outline-none"
            >
              {t('heroCtaSecondary')}
            </Link>
          </div>
          <p className="mt-3 rounded-lg border border-accent/20 bg-[rgb(var(--accent)/0.06)] px-3 py-2 text-[12px] text-[rgb(var(--text-muted))]">
            <strong className="text-accent">Try it:</strong> Connect your wallet (Phantom or any Solana wallet). Use Devnet for testing. No sign-up required.
          </p>

          {isConnected && completedCount > 0 && (
            <p className="mt-3 text-[13px] text-[rgb(var(--text-muted))]">
              {completedCount} of {totalLessons} lessons completed
            </p>
          )}

          <p className="mt-4 text-[12px] text-[rgb(var(--text-subtle))]">
            <a
              href="https://superteam.fun/earn/listing/superteam-academy/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent underline decoration-accent/40 underline-offset-2 hover:decoration-accent"
            >
              {t('footerBounty')}
            </a>
            {' · '}{t('footerCredits')}
          </p>
        </div>
      </div>
    </section>
  );
}
