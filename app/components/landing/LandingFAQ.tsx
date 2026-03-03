'use client';

/**
 * Landing FAQ Section — expandable accordion.
 * Client Component — needs state for open/close.
 */

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown } from 'lucide-react';

const FAQ_KEYS = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6'] as const;

export function LandingFAQ() {
    const t = useTranslations('landing');
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    function toggle(index: number) {
        setOpenIndex((prev) => (prev === index ? null : index));
    }

    return (
        <section
            aria-label="Frequently asked questions"
            className="mx-auto max-w-[1100px] px-4 py-16 sm:px-8 sm:py-24"
        >
            {/* Section header */}
            <div className="mb-12 max-w-[640px] sm:mb-16">
                <p className="mb-3 font-supreme text-sm font-semibold tracking-wide text-brand-green-dark dark:text-brand-yellow sm:text-base">
                    {t('faq.tagline')}
                </p>
                <h2 className="mb-6 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                    {t('faq.title')}
                </h2>
                <p className="font-supreme text-base leading-relaxed text-muted-foreground sm:text-lg">
                    {t('faq.subtitle')}
                </p>
            </div>

            {/* Accordion */}
            <div className="mx-auto max-w-[720px] divide-y divide-brand-green-dark/10 border-t border-brand-green-dark/10 dark:divide-white/10 dark:border-white/10">
                {FAQ_KEYS.map((key, i) => {
                    const isOpen = openIndex === i;
                    return (
                        <div key={key}>
                            <button
                                type="button"
                                onClick={() => toggle(i)}
                                aria-expanded={isOpen}
                                className="flex w-full cursor-pointer items-center justify-between gap-4 py-5 text-left font-supreme text-sm font-semibold text-foreground transition-colors hover:text-brand-green-dark dark:hover:text-brand-yellow sm:text-base"
                            >
                                {t(`faq.${key}.question`)}
                                <ChevronDown
                                    size={18}
                                    strokeWidth={2}
                                    aria-hidden="true"
                                    className={`shrink-0 text-brand-green-dark transition-transform duration-200 dark:text-brand-yellow ${isOpen ? 'rotate-180' : ''
                                        }`}
                                />
                            </button>
                            <div
                                className="grid transition-[grid-template-rows] duration-300 ease-in-out"
                                style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
                            >
                                <div className="overflow-hidden min-h-0">
                                    <p className="pb-5 font-supreme text-sm leading-relaxed text-[#3a4d40] dark:text-[#c8d5cc]">
                                        {t(`faq.${key}.answer`)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
