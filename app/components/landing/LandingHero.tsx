'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/context/i18n/navigation';
import Image from 'next/image';
import { LiquidMetal } from '@/components/ui/liquid-metal';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';



function RotatingWord({ words }: { words: string[] }) {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % words.length);
        }, 2500);
        return () => clearInterval(interval);
    }, [words.length]);

    // Use the longest word to reserve fixed width
    const longestWord = words.reduce((a, b) => (a.length > b.length ? a : b), '');

    return (
        <span className="relative inline-block text-left align-baseline">
            {/* Invisible longest word to reserve space */}
            <span className="invisible font-array font-bold">{longestWord}</span>
            {/* Animated word positioned absolutely on top */}
            <AnimatePresence mode="wait">
                <motion.span
                    key={words[index]}
                    className="absolute bottom-0 left-0 inline-block font-array font-bold text-brand-green-dark dark:text-brand-yellow"
                    initial={{ y: '40%', opacity: 0, filter: 'blur(4px)' }}
                    animate={{ y: '0%', opacity: 1, filter: 'blur(0px)' }}
                    exit={{ y: '-40%', opacity: 0, filter: 'blur(4px)' }}
                    transition={{ duration: 0.4, ease: 'easeInOut' }}
                >
                    {words[index]}
                </motion.span>
            </AnimatePresence>
        </span>
    );
}

export function LandingHero() {
    const t = useTranslations('landing');
    const keywords = t('hero.keywords').split(',');


    return (
        <section className="hero-grain relative flex min-h-[100dvh] flex-col items-center overflow-hidden rounded-b-3xl px-4 pt-24 pb-5 sm:px-8 sm:pt-36 sm:pb-8 md:pt-40 lg:pt-44">
            {/* ── Mesh gradient background (light mode) ── */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 dark:hidden"
                style={{
                    background: [
                        'radial-gradient(ellipse 90% 70% at 25% 100%, rgba(255,210,63,0.50), transparent)',
                        'radial-gradient(ellipse 50% 40% at 80% 15%, rgba(0,140,76,0.22), transparent)',
                        'radial-gradient(ellipse 80% 50% at 50% 90%, rgba(47,107,63,0.30), transparent)',
                        'radial-gradient(ellipse 40% 35% at 15% 40%, rgba(255,210,63,0.20), transparent)',
                        'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(247,234,203,0.45), transparent)',
                        'radial-gradient(ellipse 35% 30% at 75% 65%, rgba(0,140,76,0.12), transparent)',
                        'radial-gradient(ellipse 100% 40% at 50% 100%, rgba(47,107,63,0.15), transparent)',
                    ].join(', '),
                }}
            />
            {/* ── Mesh gradient background (dark mode) ── */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 hidden dark:block"
                style={{
                    background: [
                        'radial-gradient(ellipse 90% 60% at 25% 100%, rgba(255,210,63,0.25), transparent)',
                        'radial-gradient(ellipse 50% 40% at 80% 15%, rgba(0,140,76,0.30), transparent)',
                        'radial-gradient(ellipse 80% 50% at 50% 90%, rgba(47,107,63,0.28), transparent)',
                        'radial-gradient(ellipse 40% 35% at 15% 35%, rgba(0,140,76,0.15), transparent)',
                        'radial-gradient(ellipse 60% 60% at 50% 40%, rgba(0,140,76,0.12), transparent)',
                        'radial-gradient(ellipse 35% 30% at 70% 70%, rgba(255,210,63,0.10), transparent)',
                        'radial-gradient(ellipse 120% 50% at 50% 0%, rgba(27,35,29,0.40), transparent)',
                    ].join(', '),
                }}
            />

            {/* ── Centered content — fills available space ── */}
            <div className="relative z-[2] flex flex-1 items-center pb-8 sm:pb-20">
                <div className="mx-auto -mt-2 max-w-[900px] text-center">
                    {/* Powered by Solana badge with liquid metal border */}
                    <div className="mb-3 inline-block sm:mb-4">
                        <div className="relative overflow-hidden rounded-full shadow-[0_0_12px_rgba(0,0,0,0.15)] dark:shadow-[0_0_12px_rgba(255,255,255,0.1)]" style={{ padding: '1px 1.5px' }}>
                            {/* Liquid metal border layer */}
                            <LiquidMetal
                                colorBack="#c0c0c4"
                                colorTint="#ffffff"
                                speed={0.4}
                                repetition={6}
                                distortion={0.12}
                                scale={1}
                                className="absolute inset-0 z-0 rounded-full"
                            />
                            {/* Inner badge content */}
                            <div className="relative z-10 inline-flex items-center gap-1.5 rounded-full bg-background px-3 py-1">
                                <span className="glow-text font-supreme text-[10px] font-medium text-brand-black dark:text-brand-cream/80">{t('hero.poweredBy')}</span>
                                {/* Solana logo — filtered dark for light mode, native white for dark */}
                                <Image
                                    src="/solana-brandkit/Logos/solanaLogo.svg"
                                    alt="Solana"
                                    width={72}
                                    height={16}
                                    className="h-3 w-auto brightness-0 dark:hidden"
                                />
                                <Image
                                    src="/solana-brandkit/Logos/solanaLogo.svg"
                                    alt="Solana"
                                    width={72}
                                    height={16}
                                    className="hidden h-3 w-auto dark:block"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Heading — Quilon for main, Array for animated keyword */}
                    <h1 className="mb-4 text-[clamp(1.75rem,5vw,3.75rem)] leading-[1.15] tracking-tight sm:mb-5">
                        <span className="inline-block whitespace-nowrap">
                            <span className="font-display font-bold">{t('hero.headingPrefix')}</span>{' '}
                            <RotatingWord words={keywords} />
                        </span>
                        <br />
                        <span className="font-display font-bold">{t('hero.headingAccent')}</span>
                    </h1>

                    {/* Subtitle — Supreme */}
                    <p className="mx-auto mb-6 max-w-[540px] font-supreme text-sm font-medium leading-relaxed text-muted-foreground sm:mb-10 sm:text-lg">
                        {t('hero.subtitle')}
                    </p>

                    {/* CTAs */}
                    <div className="flex items-center justify-center gap-2.5 sm:gap-4">
                        <Link
                            href="/login"
                            className="cta-primary"
                        >
                            {t('hero.cta.start')}
                        </Link>
                        <Link
                            href="/courses"
                            className="cta-secondary"
                        >
                            {t('hero.cta.explore')}
                        </Link>
                    </div>
                </div>
            </div>

            {/* ── Bottom bar — pinned to bottom, left + right ── */}
            <div className="relative z-[2] flex w-full flex-col items-start gap-1 px-4 sm:flex-row sm:items-end sm:justify-between sm:px-10">
                <p className="font-supreme text-[11px] font-semibold text-foreground/70 sm:text-base">
                    {t('hero.metrics.studentsTaught', { count: 0 })}
                </p>
                <p className="font-supreme text-[11px] font-semibold text-foreground/70 sm:text-base sm:text-right">
                    {t('hero.metrics.certificatesIssued', { count: 0 })}
                </p>
            </div>
        </section>
    );
}
