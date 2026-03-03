/**
 * Landing About Section — explains what Superteam Academy is + 3 stat cards.
 * Server Component (no client JS) for optimal FCP/LCP.
 */
import { useTranslations } from 'next-intl';
import { MonitorPlay, GraduationCap, Film } from 'lucide-react';
import { LandingCard } from '@/components/ui/LandingCard';

const STATS = [
    {
        key: 'lessons' as const,
        icon: <MonitorPlay size={28} strokeWidth={1.5} aria-hidden="true" />,
    },
    {
        key: 'learners' as const,
        icon: <GraduationCap size={28} strokeWidth={1.5} aria-hidden="true" />,
    },
    {
        key: 'content' as const,
        icon: <Film size={28} strokeWidth={1.5} aria-hidden="true" />,
    },
];

export function LandingAbout() {
    const t = useTranslations('landing');

    return (
        <section
            aria-label={t('about.title')}
            className="mx-auto max-w-[1100px] px-4 py-16 sm:px-8 sm:py-24"
        >
            {/* Left-aligned text block */}
            <div className="max-w-[640px]">
                {/* Accent tagline */}
                <p className="mb-3 font-supreme text-sm font-semibold tracking-wide text-brand-green-dark dark:text-brand-yellow sm:text-base">
                    {t('about.tagline')}
                </p>

                {/* Heading — Quilon */}
                <h2 className="mb-6 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                    {t('about.title')}
                </h2>

                {/* Description — Supreme */}
                <p className="font-supreme text-base leading-relaxed text-muted-foreground sm:text-lg">
                    {t('about.description')}
                </p>
            </div>

            {/* Stat cards */}
            <div className="mt-12 grid grid-cols-1 gap-5 sm:mt-16 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
                {STATS.map((stat) => (
                    <LandingCard key={stat.key}>
                        <div className="flex flex-col items-center py-4 text-center sm:py-6">
                            {/* Icon */}
                            <div className="mb-4 text-brand-green-dark dark:text-brand-yellow">
                                {stat.icon}
                            </div>

                            {/* Number — Array Bold */}
                            <p className="font-array text-3xl font-bold text-foreground sm:text-4xl">
                                {t(`about.stats.${stat.key}.value`)}
                            </p>

                            {/* Label — Supreme */}
                            <p className="mt-2 font-supreme text-sm text-muted-foreground">
                                {t(`about.stats.${stat.key}.label`)}
                            </p>
                        </div>
                    </LandingCard>
                ))}
            </div>
        </section>
    );
}
