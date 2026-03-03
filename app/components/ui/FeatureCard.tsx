import type { ReactNode } from 'react';

interface FeatureCardProps {
    /** Visual demo element rendered in the top area */
    visual: ReactNode;
    /** Feature title */
    title: string;
    /** Feature description */
    description: string;
    /** Solid background color (light mode) */
    bgColor?: string;
    /** Solid background color (dark mode) */
    bgColorDark?: string;
    /** Optional extra className */
    className?: string;
}

/**
 * Feature card — vibrant solid background with noise texture.
 * Noise is sandwiched between background and content using isolation.
 */
export function FeatureCard({
    visual,
    title,
    description,
    bgColor = '#b39ddb',
    bgColorDark = '#7e57c2',
    className = '',
}: FeatureCardProps) {
    return (
        <div
            className={`fc-root relative flex flex-col overflow-hidden rounded-2xl h-full isolate ${className}`}
            style={{
                '--fc-bg': bgColor,
                '--fc-bg-dark': bgColorDark,
            } as React.CSSProperties}
        >
            {/* Noise texture — sits behind content, above solid bg */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-[1] opacity-30"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                    backgroundSize: '150px 150px',
                }}
            />

            {/* Visual area — content above noise */}
            <div className="relative z-[2] flex min-h-[200px] sm:min-h-[220px] flex-1 items-center justify-center px-5 py-5 sm:px-6 sm:py-6">
                {visual}
            </div>

            {/* Text area — content above noise */}
            <div className="relative z-[2] px-5 pb-5 pt-4 sm:px-6 sm:pb-6 border-t border-black/10 dark:border-white/10">
                <h3 className="mb-1.5 font-display text-base font-bold text-gray-900 dark:text-white sm:text-lg">
                    {title}
                </h3>
                <p className="font-supreme text-sm leading-relaxed text-gray-800 dark:text-white/85">
                    {description}
                </p>
            </div>

            <style jsx>{`
                .fc-root {
                    background-color: var(--fc-bg);
                }
                :global(.dark) .fc-root {
                    background-color: var(--fc-bg-dark);
                }
            `}</style>
        </div>
    );
}
