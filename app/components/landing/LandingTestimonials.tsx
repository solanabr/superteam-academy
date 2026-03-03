'use client';

/**
 * Landing Testimonials Section — quotes from learners.
 */
import Image from 'next/image';
import { useTranslations } from 'next-intl';

const TESTIMONIALS = [
    {
        i18nKey: 't1',
        avatar: '/avatars/female_avatar2.png',
        imageClass: 'scale-[1.3] object-[center_30%]',
    },
    {
        i18nKey: 't2',
        avatar: '/avatars/male_avatar1.png',
        imageClass: 'scale-[1.1] object-[center_25%]',
    },
    {
        i18nKey: 't3',
        avatar: '/avatars/female_avatar3.png',
        imageClass: 'scale-[1.3] object-[center_30%]',
    },
];

export function LandingTestimonials() {
    const t = useTranslations('landing');
    return (
        <section
            aria-label="Testimonials"
            className="mx-auto max-w-[1100px] px-4 py-16 sm:px-8 sm:py-24"
        >
            {/* Section header */}
            <div className="mb-12 max-w-[640px] sm:mb-16">
                <p className="mb-3 font-supreme text-sm font-semibold tracking-wide text-brand-green-dark dark:text-brand-yellow sm:text-base">
                    {t('testimonials.tagline')}
                </p>
                <h2 className="mb-6 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                    {t('testimonials.title')}
                </h2>
            </div>

            {/* Testimonial cards */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {TESTIMONIALS.map((item) => (
                    <blockquote
                        key={item.i18nKey}
                        className="flex flex-col rounded-2xl border-[3px] border-[#d4c4a0] bg-white/80 px-6 py-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_2px_0_#c4b48e,0_4px_8px_rgba(0,0,0,0.08),0_8px_24px_rgba(0,0,0,0.06)] dark:border-[#245530] dark:bg-[#1a3d25]/60 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_2px_0_#1a3d25,0_4px_8px_rgba(0,0,0,0.2),0_8px_24px_rgba(0,0,0,0.15)]"
                    >
                        {/* Quote mark */}
                        <span
                            aria-hidden="true"
                            className="mb-3 font-display text-4xl leading-none text-brand-green-emerald dark:text-brand-yellow"
                        >
                            &ldquo;
                        </span>

                        {/* Quote text */}
                        <p className="mb-6 flex-1 font-supreme text-sm leading-relaxed text-[#2a3d30] dark:text-[#d4e0d7]">
                            {t(`testimonials.${item.i18nKey}.quote`)}
                        </p>

                        {/* Attribution */}
                        <footer className="flex items-center gap-3 border-t border-brand-green-dark/10 pt-4 dark:border-white/10">
                            <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full">
                                <Image
                                    src={item.avatar}
                                    alt={t(`testimonials.${item.i18nKey}.name`)}
                                    width={44}
                                    height={44}
                                    className={`h-full w-full object-cover ${item.imageClass}`}
                                />
                            </div>
                            <div>
                                <p className="font-display text-sm font-bold text-foreground">
                                    {t(`testimonials.${item.i18nKey}.name`)}
                                </p>
                                <p className="font-supreme text-xs text-brand-green-dark dark:text-brand-yellow">
                                    {t(`testimonials.${item.i18nKey}.role`)}
                                </p>
                            </div>
                        </footer>
                    </blockquote>
                ))}
            </div>
        </section>
    );
}
