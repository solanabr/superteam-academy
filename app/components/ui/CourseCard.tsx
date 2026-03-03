import type { ReactNode } from 'react';

interface CourseCardProps {
    /** Image or visual element for the top area */
    image?: ReactNode;
    /** Text content for the bottom area */
    children?: ReactNode;
    /** Optional extra className */
    className?: string;
}

/**
 * Course card — large image area on top, compact text below, subtle separator.
 */
export function CourseCard({ image, children, className = '' }: CourseCardProps) {
    return (
        <div
            className={`
                relative flex flex-col overflow-hidden rounded-[20px]

                bg-[#f7eacb] border-[3px] border-[#d4c4a0]
                shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_2px_0_#c4b48e,0_4px_8px_rgba(0,0,0,0.10),0_8px_24px_rgba(0,0,0,0.08)]

                dark:bg-[#2f6b3f] dark:border-[3px] dark:border-[#245530]
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
                    ].join(', '),
                }}
            />

            {/* Image area — ~70% */}
            <div className="relative z-[1] flex aspect-[3/2] w-full items-center justify-center overflow-hidden">
                {image}
            </div>

            {/* Subtle separator line */}
            <div
                aria-hidden="true"
                className="relative z-[1] mx-4 h-px bg-[#c4b48e]/40 dark:bg-[#4a6b52]/50 sm:mx-5"
            />

            {/* Text area — compact */}
            <div className="relative z-[1] flex flex-1 flex-col px-5 pb-5 pt-3 sm:px-6 sm:pb-6 sm:pt-4">
                {children}
            </div>
        </div>
    );
}
