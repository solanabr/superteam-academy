/**
 * CoursesPageHeader — Hero section for the courses catalog page.
 * Responsive typography and spacing. Uses design-system fonts and colors.
 */
'use client';

interface CoursesPageHeaderProps {
    title: string;
    accentWord: string;
    subtitle: string;
}

export function CoursesPageHeader({ title, accentWord, subtitle }: CoursesPageHeaderProps) {
    return (
        <section className="mb-6 sm:mb-8" aria-labelledby="courses-hero-title">
            <h1
                id="courses-hero-title"
                className="text-2xl sm:text-3xl md:text-4xl font-bold font-display text-foreground leading-tight"
            >
                {title}{' '}
                <span className="text-accent">{accentWord}</span>
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground font-supreme mt-1.5 sm:mt-2 max-w-xl leading-relaxed">
                {subtitle}
            </p>
        </section>
    );
}
