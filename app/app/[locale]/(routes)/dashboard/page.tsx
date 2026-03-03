/**
 * Dashboard page — user's main home after login.
 * Bright stat cards, streak calendar, profile, quick actions, and leaderboard widget.
 *
 * Auth enforcement is handled server-side by proxy.ts.
 * Layout provides sidebar + topbar — no DashboardHeader needed.
 *
 * Performance: below-fold widgets are dynamically imported to reduce initial bundle.
 */
'use client';

import { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/app/providers/AuthProvider';
import { useTranslations } from 'next-intl';
import {
    CheckCircle,
    BookOpen,
    Clock,
    Award,
} from 'lucide-react';
import { MobileTabBar, MobileStreaksView } from '@/components/dashboard/MobileStreakLeaderboard';
import { useAchievements } from '@/context/hooks/useAchievements';
import { useDailyLogin } from '@/context/hooks/useDailyLogin';
import { useUserStats } from '@/context/hooks/useUserStats';
import { useActiveCourses } from '@/context/hooks/useCourses';
import { goeyToast } from 'goey-toast';
import { useLeaderboard } from '@/context/hooks/useLeaderboard';
import { useQuery } from '@tanstack/react-query';

/* ── Skeleton helpers for dynamic import loading states ── */
function CardSkeleton({ h = 240, bg = 'rgba(255,255,255,0.06)' }: { h?: number; bg?: string }) {
    return (
        <div
            className="rounded-3xl animate-pulse"
            style={{ backgroundColor: bg, minHeight: h }}
        />
    );
}

/* ── Dynamic imports with inline skeleton loading states (code splitting) ── */
const DailyLoginStreak = dynamic(
    () => import('@/components/streak/DailyLoginStreak').then(m => ({ default: m.DailyLoginStreak })),
    { ssr: false, loading: () => <CardSkeleton h={320} /> }
);
const CommunityFeed = dynamic(
    () => import('@/components/dashboard/CommunityFeed').then(m => ({ default: m.CommunityFeed })),
    { ssr: false, loading: () => <CardSkeleton h={220} /> }
);
const ActiveCourses = dynamic(
    () => import('@/components/dashboard/ActiveCourses').then(m => ({ default: m.ActiveCourses })),
    { ssr: false, loading: () => <CardSkeleton h={240} /> }
);
const CredentialsWidget = dynamic(
    () => import('@/components/dashboard/CredentialsWidget').then(m => ({ default: m.CredentialsWidget })),
    { ssr: false, loading: () => <CardSkeleton h={240} /> }
);
const DashboardLeaderboard = dynamic(
    () => import('@/components/dashboard/DashboardLeaderboard').then(m => ({ default: m.DashboardLeaderboard })),
    { ssr: false, loading: () => <CardSkeleton h={220} /> }
);

export default function DashboardPage() {
    const { user, isLoading } = useAuth();
    const t = useTranslations('dashboard');
    const { data: achievements } = useAchievements();
    const { dailyLogin } = useDailyLogin();
    const { data: userStats } = useUserStats();
    const [mobileTab, setMobileTab] = useState<'dashboard' | 'streaks'>('dashboard');
    const isLg = useIsLargeScreen();

    // Prefetch data at page level so it's in React Query cache before widgets mount.
    // This fires API calls in parallel immediately instead of waiting for each
    // dynamic chunk to download → mount → then fetch data (waterfall).
    useLeaderboard('all-time', 10);
    useActiveCourses();
    useQuery({
        queryKey: ['community-threads-dashboard'],
        queryFn: async () => {
            const res = await fetch('/api/community/threads?page=1');
            if (!res.ok) throw new Error('Failed');
            return res.json();
        },
        staleTime: 60_000,
    });

    // Derive real-time stats
    const badgesUnlocked = achievements?.filter((a) => a.unlocked).length ?? 0;
    const totalBadges = achievements?.length ?? 0;
    const currentStreak = dailyLogin?.currentStreak ?? 0;
    const enrolledCourses = userStats?.enrolled ?? 0;
    const coursesCompleted = userStats?.completed ?? 0;

    useEffect(() => {
        if (sessionStorage.getItem('auth_success')) {
            sessionStorage.removeItem('auth_success');
            goeyToast.success('Signed in successfully');
        }
    }, []);

    if (isLoading) {
        return <DashboardSkeleton />;
    }

    if (!user) return null;

    const displayName = user.name ?? user.email ?? 'Learner';

    return (
        <div className="max-w-[1400px] mx-auto min-w-0">
            {/* Welcome — spans full width above the two-column layout */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-foreground font-display">
                    {t('welcome', { name: displayName.split(' ')[0] })}
                </h1>
                <p className="text-sm text-muted-foreground font-supreme mt-1">
                    {t('readyToLearn')}
                </p>
            </div>

            {/* Mobile floating tab bar */}
            <MobileTabBar active={mobileTab} onSwitch={setMobileTab} />

            {/* Two-column layout — cards start at the same row */}
            <div className="flex gap-6 min-w-0">
                {/* Left — Main content */}
                <div className="flex-1 min-w-0 space-y-6">
                    {!isLg ? (
                        /* ── Mobile layout ── */
                        mobileTab === 'streaks' ? (
                            <MobileStreaksView />
                        ) : (
                            <>
                                {/* Stat cards */}
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <StatBlock
                                        icon={CheckCircle}
                                        label="Courses Completed"
                                        value={coursesCompleted}
                                        bgLight="#16a34a"
                                        bgDark="#15803d"
                                        iconColor="#1b231d"
                                        textColor="#1b231d"
                                    />
                                    <StatBlock
                                        icon={BookOpen}
                                        label="Enrolled"
                                        value={enrolledCourses}
                                        bgLight="#f97316"
                                        bgDark="#ea580c"
                                        iconColor="#1b231d"
                                        textColor="#1b231d"
                                    />
                                    <StatBlock
                                        icon={Clock}
                                        label="Streak"
                                        value={`${currentStreak}d`}
                                        bgLight="#34d399"
                                        bgDark="#059669"
                                        iconColor="#1b231d"
                                        textColor="#1b231d"
                                    />
                                    <StatBlock
                                        icon={Award}
                                        label="Badges"
                                        value={`${badgesUnlocked}/${totalBadges}`}
                                        bgLight="#f472b6"
                                        bgDark="#ec4899"
                                        iconColor="#1b231d"
                                        textColor="#1b231d"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <ActiveCourses />
                                    <CredentialsWidget />
                                </div>

                                <CommunityFeed />
                            </>
                        )
                    ) : (
                        /* ── Desktop layout ── */
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <StatBlock
                                    icon={CheckCircle}
                                    label={t('stats.coursesCompleted')}
                                    value={coursesCompleted}
                                    bgLight="#a78bfa"
                                    bgDark="#7c3aed"
                                    iconColor="#1b231d"
                                    textColor="#1b231d"
                                />
                                <StatBlock
                                    icon={BookOpen}
                                    label="Enrolled"
                                    value={enrolledCourses}
                                    bgLight="#f97316"
                                    bgDark="#ea580c"
                                    iconColor="#1b231d"
                                    textColor="#1b231d"
                                />
                                <StatBlock
                                    icon={Clock}
                                    label="Streak"
                                    value={`${currentStreak}d`}
                                    bgLight="#34d399"
                                    bgDark="#059669"
                                    iconColor="#1b231d"
                                    textColor="#1b231d"
                                />
                                <StatBlock
                                    icon={Award}
                                    label="Badges"
                                    value={`${badgesUnlocked}/${totalBadges}`}
                                    bgLight="#f472b6"
                                    bgDark="#ec4899"
                                    iconColor="#1b231d"
                                    textColor="#1b231d"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <ActiveCourses />
                                <CredentialsWidget />
                            </div>

                            <CommunityFeed />
                        </div>
                    )}
                </div>

                {/* Right — Calendar + Leaderboard (desktop only) */}
                {isLg && (
                    <div className="w-80 shrink-0">
                        <div className="sticky top-20 space-y-6">
                            <DailyLoginStreak />
                            <DashboardLeaderboard />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ── Inline StatBlock — bright solid colors ── */
interface StatBlockProps {
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
    label: string;
    value: string | number;
    bgLight: string;
    bgDark: string;
    iconColor: string;
    textColor: string;
}

function StatBlock({ icon: Icon, label, value, bgLight, iconColor, textColor }: StatBlockProps) {
    return (
        <div
            className="rounded-3xl p-5 border-0 shadow-sm"
            style={{ backgroundColor: bgLight, color: textColor, minHeight: 120 }}
            role="status"
            aria-label={`${label}: ${value}`}
        >
            <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium font-supreme">
                    {label}
                </span>
                <Icon className="w-5 h-5" style={{ color: iconColor }} aria-hidden="true" />
            </div>
            <div className="text-2xl font-bold font-supreme tabular-nums">
                {value}
            </div>
        </div>
    );
}

/* ── Skeleton placeholder block ── */
function SkeletonBlock({ className = '' }: { className?: string }) {
    return (
        <div
            className={`rounded-3xl animate-pulse ${className}`}
            style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
        />
    );
}

/* ── Full-page dashboard skeleton ── */
function DashboardSkeleton() {
    return (
        <div className="max-w-[1400px] mx-auto min-w-0">
            {/* Welcome skeleton */}
            <div className="mb-6">
                <div className="h-7 w-64 rounded-lg animate-pulse mb-2" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }} />
                <div className="h-4 w-44 rounded-lg animate-pulse" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }} />
            </div>

            {/* Two-column layout */}
            <div className="flex gap-6 min-w-0">
                {/* Left column */}
                <div className="flex-1 min-w-0 space-y-6">
                    {/* 4 stat card skeletons */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <SkeletonBlock key={i} className="h-[120px]" />
                        ))}
                    </div>

                    {/* Courses + Credentials skeletons */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <SkeletonBlock className="h-[240px]" />
                        <SkeletonBlock className="h-[240px]" />
                    </div>

                    {/* Community skeleton */}
                    <SkeletonBlock className="h-[220px]" />
                </div>

                {/* Right column */}
                <div className="hidden lg:block w-80 shrink-0 space-y-6">
                    {/* Calendar skeleton */}
                    <SkeletonBlock className="h-[320px]" />
                    {/* Leaderboard skeleton */}
                    <SkeletonBlock className="h-[220px]" />
                </div>
            </div>
        </div>
    );
}

/* ── Responsive breakpoint hook — matches Tailwind lg (1024px) ── */
function useIsLargeScreen() {
    const [isLg, setIsLg] = useState(true); // default true to match SSR
    useEffect(() => {
        const mql = window.matchMedia('(min-width: 1024px)');
        setIsLg(mql.matches);
        const handler = (e: MediaQueryListEvent) => setIsLg(e.matches);
        mql.addEventListener('change', handler);
        return () => mql.removeEventListener('change', handler);
    }, []);
    return isLg;
}
