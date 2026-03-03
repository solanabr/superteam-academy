import type { ReactNode } from 'react';

interface LandingCardProps {
    children: ReactNode;
    className?: string;
}

/**
 * Reusable landing page card with mesh gradient (like hero section).
 */
export function LandingCard({ children, className = '' }: LandingCardProps) {
    return (
        <div
            className={`
                relative overflow-hidden rounded-[20px] p-6 sm:p-8

                border-[3px] border-[#d4c4a0]
                shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_2px_0_#c4b48e,0_4px_8px_rgba(0,0,0,0.10),0_8px_24px_rgba(0,0,0,0.08)]

                dark:border-[3px] dark:border-[#245530]
                dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_2px_0_#1a3d25,0_4px_8px_rgba(0,0,0,0.25),0_8px_24px_rgba(0,0,0,0.20)]

                ${className}
            `}
        >
            {/* Light mode gradient */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 dark:hidden"
                style={{
                    background: [
                        'radial-gradient(ellipse 80% 60% at 20% 90%, rgba(255,210,63,0.35), transparent)',
                        'radial-gradient(ellipse 60% 50% at 80% 20%, rgba(0,140,76,0.15), transparent)',
                        'radial-gradient(ellipse 100% 80% at 50% 50%, rgba(247,234,203,0.60), transparent)',
                        'radial-gradient(ellipse 50% 40% at 10% 30%, rgba(255,210,63,0.15), transparent)',
                    ].join(', '),
                }}
            />
            {/* Dark mode gradient */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 hidden dark:block"
                style={{
                    background: [
                        'radial-gradient(ellipse 80% 60% at 20% 90%, rgba(255,210,63,0.18), transparent)',
                        'radial-gradient(ellipse 60% 50% at 80% 20%, rgba(0,140,76,0.25), transparent)',
                        'radial-gradient(ellipse 100% 80% at 50% 50%, rgba(47,107,63,0.40), transparent)',
                        'radial-gradient(ellipse 50% 40% at 10% 30%, rgba(0,140,76,0.12), transparent)',
                    ].join(', '),
                }}
            />

            {/* Content */}
            <div className="relative z-[1]">
                {children}
            </div>
        </div>
    );
}
