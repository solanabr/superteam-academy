/**
 * DailyLoginStreak — Pink pastel calendar card with solid dark text.
 * Streak tracking, month navigation, emoji states, info tooltip, Twitter share.
 * Users manually claim daily login XP via the Claim button.
 */
'use client';

import { useMemo, useState, useCallback } from 'react';
import { useDailyLogin } from '@/context/hooks/useDailyLogin';
import { useNotifications } from '@/context/stores/notificationStore';
import { dailyLoginClaimNotification } from '@/context/services/notification-service';
import { ChevronLeft, ChevronRight, Info, Share2, Gift, Check, Loader2 } from 'lucide-react';
import { goeyToast } from 'goey-toast';
import { ClaimXpPopup } from './ClaimXpPopup';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

/* ── Fixed color tokens for bright pastel pink card ── */
const PINK = {
    bg: 'var(--dash-card-pink)',
    text: '#0a1510',
    sub: '#0c2e28',
    icon: '#0e3530',
    pillBg: 'rgba(0,0,0,0.08)',
    hoverBg: 'rgba(255,255,255,0.35)',
    cellBg: '#ffffff',
    streakBg: '#fff3b0',
    todayBg: '#ffd54f',
    todayRing: '#c49000',
    statsBg: '#ffffff',
    monthPillBg: 'rgba(0,0,0,0.18)',
    monthPillText: '#ffffff',
    statBarBg: 'rgba(0,0,0,0.15)',
    statBarText: '#ffffff',
    dimmedText: 'rgba(0,0,0,0.35)',
    normalText: '#1b231d',
    emojiCircleBg: 'rgba(0, 0, 0, 0.12)',
    emojiCircleBorder: 'rgba(0, 0, 0, 0.15)',
    claimBg: '#1b231d',
    border: 'transparent',
    shadow: '0 1px 3px rgba(0,0,0,0.06)',
};

/* ── Lime-cream tokens for profile page — uses CSS vars for dark mode ── */
const LIME = {
    bg: 'var(--profile-side-bg)',
    text: 'var(--profile-side-text)',
    sub: 'var(--profile-side-text)',
    icon: 'var(--profile-side-text)',
    pillBg: 'var(--profile-side-btn-bg)',
    hoverBg: 'rgba(255,255,255,0.35)',
    cellBg: '#ffffff',
    streakBg: '#fff3b0',
    todayBg: '#ffd54f',
    todayRing: '#c49000',
    statsBg: '#ffffff',
    monthPillBg: 'var(--profile-side-btn-bg)',
    monthPillText: 'var(--profile-side-text)',
    statBarBg: 'var(--profile-side-btn-bg)',
    statBarText: 'var(--profile-side-text)',
    dimmedText: 'var(--profile-side-sub)',
    normalText: 'var(--profile-side-text)',
    emojiCircleBg: 'var(--profile-side-btn-bg)',
    emojiCircleBorder: 'var(--profile-side-border)',
    claimBg: 'var(--profile-side-text)',
    border: 'var(--profile-side-border)',
    shadow: 'var(--profile-side-shadow)',
};

interface DailyLoginStreakProps {
    variant?: 'pink' | 'lime';
}

export function DailyLoginStreak({ variant = 'pink' }: DailyLoginStreakProps) {
    const C = variant === 'lime' ? LIME : PINK;
    const { dailyLogin, isLoading, recordLogin } = useDailyLogin();
    const { addNotification } = useNotifications();
    const [viewDate, setViewDate] = useState(() => new Date());
    const [showTooltip, setShowTooltip] = useState(false);
    const [showClaimPopup, setShowClaimPopup] = useState(false);
    const [claimedXp, setClaimedXp] = useState(0);
    const [claimedStreak, setClaimedStreak] = useState(0);

    const today = useMemo(() => {
        const d = new Date();
        return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    }, []);

    const isCurrentMonth = viewDate.getMonth() === today.getMonth()
        && viewDate.getFullYear() === today.getFullYear();

    const prevMonth = useCallback(() => {
        setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
    }, []);

    const nextMonth = useCallback(() => {
        if (!isCurrentMonth) {
            setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
        }
    }, [isCurrentMonth]);

    const calendarWeeks = useMemo(() => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const totalDays = lastDay.getDate();
        let startDow = firstDay.getDay() - 1;
        if (startDow < 0) startDow = 6;

        // Build cells as { date: Date, display: number, isCurrentMonth: boolean }
        type CalendarCell = { date: Date; display: number; isCurrentMonth: boolean };
        const weeks: CalendarCell[][] = [];
        let week: CalendarCell[] = [];

        // Previous month trailing days
        const prevMonthLast = new Date(year, month, 0).getDate();
        for (let i = startDow - 1; i >= 0; i--) {
            const d = prevMonthLast - i;
            week.push({ date: new Date(year, month - 1, d), display: d, isCurrentMonth: false });
        }

        // Current month days
        for (let d = 1; d <= totalDays; d++) {
            week.push({ date: new Date(year, month, d), display: d, isCurrentMonth: true });
            if (week.length === 7) { weeks.push(week); week = []; }
        }

        // Next month leading days
        let nextDay = 1;
        if (week.length > 0) {
            while (week.length < 7) {
                week.push({ date: new Date(year, month + 1, nextDay), display: nextDay, isCurrentMonth: false });
                nextDay++;
            }
            weeks.push(week);
        }
        return weeks;
    }, [viewDate]);

    /** Determine the status for any calendar date */
    const getDayStatus = useCallback((cellDate: Date): 'streak' | 'today' | 'missed' | 'future' | 'none' => {
        if (!dailyLogin) return 'none';
        if (cellDate > today) return 'future';
        if (cellDate.getTime() === today.getTime()) {
            return dailyLogin.todayCredited ? 'today' : 'none';
        }
        // Past day — check if it falls within the current streak window
        const diffMs = today.getTime() - cellDate.getTime();
        const daysAgo = Math.round(diffMs / (1000 * 60 * 60 * 24));
        // The current streak of N means today + (N-1) previous days if today is credited,
        // or the last N days ending at lastLoginDate if today is not yet credited
        const streakLen = dailyLogin.currentStreak;
        const lastLogin = dailyLogin.lastLoginDate;
        if (lastLogin) {
            const lastLoginDate = new Date(lastLogin + 'T00:00:00');
            const lastLoginMs = lastLoginDate.getTime();
            const cellMs = cellDate.getTime();
            // The streak covers [lastLoginDate - (streakLen-1) days  ...  lastLoginDate]
            const streakStartMs = lastLoginMs - (streakLen - 1) * 86400000;
            if (cellMs >= streakStartMs && cellMs <= lastLoginMs) {
                return 'streak';
            }
        }
        // Past day not in streak = missed (only show missed for days in the current month's range that have passed)
        if (cellDate < today) return 'missed';
        return 'none';
    }, [dailyLogin, today]);

    const handleShare = useCallback(() => {
        if (!dailyLogin) return;
        const text = `🔥 I'm on a ${dailyLogin.currentStreak}-day streak on Superteam Academy! My best: ${dailyLogin.longestStreak} days. Can you beat it?`;
        const url = typeof window !== 'undefined' ? window.location.origin : 'https://academy.superteam.fun';
        const tweetUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        window.open(tweetUrl, '_blank', 'noopener,noreferrer,width=550,height=420');
    }, [dailyLogin]);

    if (isLoading) {
        return (
            <div className="rounded-3xl p-5 font-supreme" style={{ backgroundColor: C.bg, border: `1px solid ${C.border}`, boxShadow: C.shadow }}>
                <div className="h-5 w-32 rounded animate-pulse mx-auto mb-4" style={{ backgroundColor: C.pillBg }} />
                <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: 35 }).map((_, i) => (
                        <div key={i} className="aspect-square rounded-md animate-pulse" style={{ backgroundColor: C.pillBg }} />
                    ))}
                </div>
            </div>
        );
    }

    if (!dailyLogin) return null;

    const streak = dailyLogin.currentStreak;
    const longest = dailyLogin.longestStreak;

    return (
        <div className="rounded-3xl p-4 font-supreme" style={{ backgroundColor: C.bg, color: C.text, border: `1px solid ${C.border}`, boxShadow: C.shadow }}>
            {/* Header */}
            <div className="flex items-center justify-center gap-1.5 mb-3 relative">
                <div className="relative">
                    <button
                        className="p-1 rounded transition-colors"
                        style={{ color: C.icon }}
                        aria-label="Streak info"
                        onMouseEnter={() => setShowTooltip(true)}
                        onMouseLeave={() => setShowTooltip(false)}
                        onClick={() => setShowTooltip(prev => !prev)}
                    >
                        <Info size={14} />
                    </button>
                    {showTooltip && (
                        <div
                            className="absolute left-0 top-full mt-1 z-50 w-52 rounded-lg p-2.5 text-[10px] shadow-lg"
                            style={{ backgroundColor: '#fff', color: C.text, border: '1px solid rgba(0,0,0,0.1)' }}
                        >
                            <p className="font-bold mb-1">Daily Login Streak</p>
                            <p style={{ color: C.sub }} className="leading-relaxed">
                                🔥 = logged in that day. 😢 = missed.
                                Claim your daily login XP to build your streak!
                            </p>
                            <p style={{ color: C.sub }} className="leading-relaxed mt-1 opacity-70">
                                💡 Login XP is off-chain — no wallet or transaction needed.
                            </p>
                        </div>
                    )}
                </div>
                <button
                    className="p-1 rounded transition-colors"
                    style={{ color: C.icon }}
                    onClick={prevMonth}
                    aria-label="Previous month"
                >
                    <ChevronLeft size={14} />
                </button>
                <span
                    className="text-xs font-bold px-3 py-1 rounded-full backdrop-blur-md"
                    style={{ backgroundColor: C.monthPillBg, color: C.monthPillText }}
                >
                    {MONTH_NAMES[viewDate.getMonth()]}
                </span>
                <button
                    className="p-1 rounded transition-colors disabled:opacity-30"
                    style={{ color: C.icon }}
                    onClick={nextMonth}
                    disabled={isCurrentMonth}
                    aria-label="Next month"
                >
                    <ChevronRight size={14} />
                </button>
                <button
                    className="p-1 rounded transition-colors"
                    style={{ color: C.icon }}
                    onClick={handleShare}
                    aria-label="Share streak on X"
                >
                    <Share2 size={12} />
                </button>
            </div>

            {/* Day labels */}
            <div className="grid grid-cols-7 gap-1 mb-1">
                {DAY_LABELS.map(l => (
                    <span key={l} className="text-center text-[9px] font-semibold" style={{ color: C.sub }}>
                        {l}
                    </span>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="flex flex-col gap-1">
                {calendarWeeks.map((week, wi) => (
                    <div key={wi} className="grid grid-cols-7 gap-1">
                        {week.map((cell, di) => {
                            const status = getDayStatus(cell.date);
                            const dimmed = !cell.isCurrentMonth;
                            return (
                                <div
                                    key={di}
                                    className="aspect-square flex items-center justify-center rounded-md text-[10px]"
                                >
                                    {status === 'streak' || status === 'today' ? (
                                        <span
                                            role="img"
                                            aria-label="fire"
                                            className="text-sm leading-none flex items-center justify-center"
                                            style={{
                                                width: 28,
                                                height: 28,
                                                borderRadius: '50%',
                                                background: 'rgba(255,255,255,0.25)',
                                                border: `1px solid rgba(255,255,255,0.35)`,
                                                boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                                                opacity: dimmed ? 0.5 : 1,
                                            }}
                                        >🔥</span>
                                    ) : status === 'missed' ? (
                                        <span
                                            role="img"
                                            aria-label="missed"
                                            className="text-sm leading-none flex items-center justify-center"
                                            style={{
                                                width: 28,
                                                height: 28,
                                                borderRadius: '50%',
                                                background: 'rgba(255,255,255,0.25)',
                                                border: `1px solid rgba(255,255,255,0.35)`,
                                                boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                                                opacity: dimmed ? 0.5 : 1,
                                            }}
                                        >😭</span>
                                    ) : (
                                        <span className="font-bold tabular-nums" style={{ color: dimmed ? C.dimmedText : C.normalText }}>{cell.display}</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>

            {/* Bottom stats + Claim pill */}
            <div
                className="flex items-center mt-3 rounded-xl px-3 py-1.5 text-[11px] backdrop-blur-md"
                style={{ backgroundColor: C.statBarBg, color: C.statBarText }}
            >
                <div className="flex items-center gap-1 font-semibold">
                    <span>Current 🔥</span>
                    <strong className="tabular-nums">{streak}</strong>
                </div>
                <div className="w-px h-3.5 mx-2" style={{ backgroundColor: 'rgba(255,255,255,0.25)' }} />
                <div className="flex items-center gap-1 font-semibold">
                    <span>Max &lt;/&gt;</span>
                    <strong className="tabular-nums">{longest}</strong>
                </div>

                {/* Spacer pushes claim pill to the right */}
                <div className="flex-1" />

                {/* Claim XP pill */}
                <button
                    className="flex items-center gap-1.5 rounded-full px-3.5 py-1 font-semibold text-[11px] transition-all"
                    style={{
                        backgroundColor: dailyLogin.todayCredited ? 'rgba(255,255,255,0.15)' : C.claimBg,
                        color: '#ffffff',
                        opacity: dailyLogin.todayCredited ? 0.6 : 1,
                        cursor: dailyLogin.todayCredited || recordLogin.isPending ? 'not-allowed' : 'pointer',
                    }}
                    disabled={dailyLogin.todayCredited || recordLogin.isPending}
                    onClick={() => {
                        if (dailyLogin.todayCredited || recordLogin.isPending) return;
                        recordLogin.mutate(undefined, {
                            onSuccess: (result) => {
                                const xp = result.todayXp || ((result.currentStreak) * 10);
                                setClaimedXp(xp);
                                setClaimedStreak(result.currentStreak);
                                setShowClaimPopup(true);
                                addNotification(dailyLoginClaimNotification(xp, result.currentStreak));
                                if (result.streakBroken) {
                                    goeyToast.warning('Streak reset! Starting fresh 🔄');
                                } else {
                                    goeyToast.success(`+${xp} XP claimed! 🎉`);
                                }
                            },
                            onError: () => {
                                goeyToast.error('Failed to claim XP. Try again!');
                            },
                        });
                    }}
                >
                    {recordLogin.isPending ? (
                        <><Loader2 size={12} className="animate-spin" /> ...</>
                    ) : dailyLogin.todayCredited ? (
                        <><Check size={12} /> Claimed</>
                    ) : (
                        <><Gift size={12} /> +{(dailyLogin.currentStreak + 1) * 10} XP</>
                    )}
                </button>
            </div>

            {/* Claim celebration popup */}
            {showClaimPopup && (
                <ClaimXpPopup
                    xpAmount={claimedXp}
                    streakDay={claimedStreak}
                    onClose={() => setShowClaimPopup(false)}
                />
            )}
        </div>
    );
}
