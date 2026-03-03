'use client';

/**
 * Landing Features Section — 6 rich feature cards with visual demos.
 *
 * Features sourced from docs/SPEC.md.
 */
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { FeatureCard } from '@/components/ui/FeatureCard';
import { StreaksCalendar } from '@/components/ui/StreaksCalendar';

/* ─── Visual Demo: Interactive Course Progress ─────────────────── */
function CourseProgressVisual() {
    return (
        <div className="flex w-full flex-col gap-3">
            {/* Course image thumbnail — fills width */}
            <div className="w-full overflow-hidden rounded-xl border-2 border-white/20 dark:border-white/10">
                <Image
                    src="/course/solana_course.png"
                    alt="Solana Fundamentals"
                    width={400}
                    height={200}
                    className="h-auto w-full object-cover"
                />
            </div>
            {/* Progress info */}
            <div className="w-full">
                <div className="mb-2 flex items-center justify-between">
                    <span className="font-supreme text-xs font-bold text-foreground">Solana Fundamentals</span>
                    <span className="font-array text-xs font-bold text-brand-green-dark dark:text-brand-yellow">3/5</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#8a6db8] dark:bg-[#4a2d6b]">
                    <div className="h-full rounded-full bg-brand-green-emerald" style={{ width: '60%' }} />
                </div>
            </div>
        </div>
    );
}

/* ─── Visual Demo: XP Token Balance ────────────────────────────── */
function XpTokenVisual() {
    const breakdown = [
        { label: 'Lessons', value: 1200, max: 2450, color: '#2f9e44' },
        { label: 'Bonus', value: 750, max: 2450, color: '#f59f00' },
        { label: 'Achievements', value: 500, max: 2450, color: '#845ef7' },
    ];
    return (
        <div className="flex w-full flex-col items-center gap-4">
            {/* Circular progress ring */}
            <div className="relative flex h-[100px] w-[100px] items-center justify-center">
                <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full -rotate-90">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="6" className="text-white/20 dark:text-white/15" />
                    <circle cx="50" cy="50" r="42" fill="none" stroke="url(#xp-grad)" strokeWidth="6" strokeLinecap="round" strokeDasharray={`${(2450 / 3000) * 264} 264`} />
                    <defs>
                        <linearGradient id="xp-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#2f9e44" />
                            <stop offset="100%" stopColor="#f59f00" />
                        </linearGradient>
                    </defs>
                </svg>
                <div className="text-center">
                    <p className="font-array text-xl font-bold text-foreground">2,450</p>
                    <p className="font-supreme text-[9px] font-bold text-gray-700 dark:text-white/80">XP</p>
                </div>
            </div>
            {/* Breakdown bars */}
            <div className="flex w-full flex-col gap-2">
                {breakdown.map((item) => (
                    <div key={item.label} className="flex items-center gap-2">
                        <span className="w-[70px] font-supreme text-[10px] font-bold text-gray-800 dark:text-white/80">{item.label}</span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#b2567a] dark:bg-[#8b1f4a]">
                            <div className="h-full rounded-full" style={{ width: `${(item.value / item.max) * 100}%`, backgroundColor: item.color }} />
                        </div>
                        <span className="w-[34px] text-right font-array text-[10px] font-bold text-foreground">{item.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ─── Visual Demo: NFT Credential ──────────────────────────────── */
function CredentialVisual() {
    return (
        <div className="flex w-full flex-col items-center gap-3">
            {/* Certificate SVG — fills width */}
            <div className="relative w-full overflow-hidden rounded-xl border-2 border-white/40 bg-white dark:border-white/20 dark:bg-[#004d40]">
                <Image
                    src="/certificate-template.svg"
                    alt="Certificate Template"
                    width={400}
                    height={250}
                    className="h-auto w-full object-contain p-3"
                />
                <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-brand-green-emerald text-[11px] font-bold text-white">✓</span>
            </div>
            <div className="text-center">
                <p className="font-supreme text-xs font-bold text-foreground">Anchor Track</p>
                <p className="font-supreme text-[10px] font-semibold text-gray-700 dark:text-white/80">Soulbound · Upgradeable</p>
            </div>
        </div>
    );
}

/* ─── Visual Demo: Code Editor Snippet (Hello World in Rust) ───── */
function CodeEditorVisual() {
    return (
        <div className="w-full overflow-hidden rounded-xl bg-[#1b231d] shadow-lg">
            {/* Editor tab bar */}
            <div className="flex items-center gap-1.5 border-b border-white/10 px-3 py-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f]" />
                <span className="ml-3 font-supreme text-[10px] text-white/60">main.rs</span>
            </div>
            {/* Code lines — Hello World in Rust */}
            <div className="px-4 py-4 font-mono text-[12px] leading-[1.8]">
                <p><span className="text-[#c586c0]">fn</span> <span className="text-[#dcdcaa]">main</span>() {'{'}</p>
                <p>  <span className="text-[#dcdcaa]">println!</span>(<span className="text-[#ce9178]">&quot;Hello, Solana!&quot;</span>);</p>
                <p>{'}'}</p>
            </div>
        </div>
    );
}

/* ─── Visual Demo: Achievements ────────────────────────────────── */
function AchievementsVisual() {
    const badges = [
        { label: 'First Steps', src: '/Badges/first_steps.svg', earned: true },
        { label: 'Ten Courses', src: '/Badges/ten_courses.svg', earned: true },
        { label: 'Early Adopter', src: '/Badges/early_adopter.svg', earned: true },
        { label: 'Full Stack', src: '/Badges/full_stack_solana.svg', earned: false },
    ];
    return (
        <div className="grid grid-cols-2 gap-2.5">
            {badges.map((b) => (
                <div
                    key={b.label}
                    className={`flex flex-col items-center gap-2 rounded-xl px-4 py-3.5 ${b.earned
                        ? 'bg-[#e6820a] dark:bg-[#8b4d00]'
                        : 'bg-[#c97a0a] dark:bg-[#5a3500] opacity-50'
                        }`}
                >
                    <Image
                        src={b.src}
                        alt={b.label}
                        width={40}
                        height={40}
                        className="h-10 w-10 object-contain"
                    />
                    <span className="font-supreme text-[10px] font-bold text-foreground">{b.label}</span>
                </div>
            ))}
        </div>
    );
}

/* ─── Visual Demo: Learning Streaks Calendar ───────────────────── */
function StreaksVisual() {
    return <StreaksCalendar />;
}

/* ─── Main Features Component ──────────────────────────────────── */

export function LandingFeatures() {
    const t = useTranslations('landing');
    return (
        <section
            aria-label="Platform features"
            className="mx-auto max-w-[1100px] px-4 py-16 sm:px-8 sm:py-24"
        >
            {/* Section header */}
            <div className="mb-12 max-w-[640px] sm:mb-16">
                <p className="mb-3 font-supreme text-sm font-semibold tracking-wide text-brand-green-dark dark:text-brand-yellow sm:text-base">
                    {t('features.tagline')}
                </p>
                <h2 className="mb-6 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                    {t('features.title')}
                </h2>
                <p className="font-supreme text-base leading-relaxed text-muted-foreground sm:text-lg">
                    {t('features.subtitle')}
                </p>
            </div>

            {/* Feature grid — sticky stacking on mobile, normal 2-col grid on desktop */}
            <div className="flex flex-col gap-5 sm:grid sm:grid-cols-2 sm:gap-6">
                <div className="sticky top-[56px] z-[1] sm:static sm:z-auto">
                    <FeatureCard
                        visual={<CourseProgressVisual />}
                        title={t('features.courses.title')}
                        description={t('features.courses.description')}
                        bgColor="#c5b3e6"
                        bgColorDark="#7e57c2"
                    />
                </div>
                <div className="sticky top-[64px] z-[2] sm:static sm:z-auto">
                    <FeatureCard
                        visual={<StreaksVisual />}
                        title={t('features.streaks.title')}
                        description={t('features.streaks.description')}
                        bgColor="#ffb74d"
                        bgColorDark="#e68a00"
                    />
                </div>
                <div className="sticky top-[72px] z-[3] sm:static sm:z-auto">
                    <FeatureCard
                        visual={<CodeEditorVisual />}
                        title={t('features.editor.title')}
                        description={t('features.editor.description')}
                        bgColor="#80cbc4"
                        bgColorDark="#00897b"
                    />
                </div>
                <div className="sticky top-[80px] z-[4] sm:static sm:z-auto">
                    <FeatureCard
                        visual={<XpTokenVisual />}
                        title={t('features.xp.title')}
                        description={t('features.xp.description')}
                        bgColor="#f48fb1"
                        bgColorDark="#d81b60"
                    />
                </div>
                <div className="sticky top-[88px] z-[5] sm:static sm:z-auto">
                    <FeatureCard
                        visual={<CredentialVisual />}
                        title={t('features.credentials.title')}
                        description={t('features.credentials.description')}
                        bgColor="#4dd0e1"
                        bgColorDark="#0097a7"
                    />
                </div>
                <div className="sticky top-[96px] z-[6] sm:static sm:z-auto">
                    <FeatureCard
                        visual={<AchievementsVisual />}
                        title={t('features.achievements.title')}
                        description={t('features.achievements.description')}
                        bgColor="#ffcc80"
                        bgColorDark="#ef6c00"
                    />
                </div>
            </div>
        </section>
    );
}
