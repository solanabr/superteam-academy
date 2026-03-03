'use client';

/**
 * Own profile page — bento-grid layout inspired by TUF/GitHub profiles.
 * Left sidebar: avatar, name, edit/share, wallet info, track progress, streak calendar.
 * Right grid: stat cards, course progress, heatmap, skills, achievements, credentials.
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { PublicKey, Connection, LAMPORTS_PER_SOL } from '@solana/web3.js';
import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
    Sparkles,
    BarChart3,
    Flame,
    Trophy,
    Shield,
    Award,
    GraduationCap,
    Pencil,
    Share2,
    Calendar,
    Wallet,
    BookOpen,
    Target,
    Loader2,
    Copy,
    Check,
    ExternalLink,
    Twitter,
    Github,
    Globe,
} from 'lucide-react';
import { useStreak } from '@/context/hooks/useStreak';
import { useDailyLogin } from '@/context/hooks/useDailyLogin';
import { useAchievements } from '@/context/hooks/useAchievements';
import { useCredentials } from '@/context/hooks/useCredentials';
import { useUserStats } from '@/context/hooks/useUserStats';
import { ActivityHeatmap, type ActivityEvent } from '@/components/profile/ActivityHeatmap';
import { SkillChart } from '@/components/profile/SkillRadar';
import { AchievementShowcase } from '@/components/profile/AchievementShowcase';
import { CredentialDisplay } from '@/components/profile/CredentialDisplay';
import { useAnalytics } from '@/context/hooks/useAnalytics';
import { calculateLevel } from '@/context/xp-calculations';
import { goeyToast } from 'goey-toast';

/* ── Dynamic import for streak calendar (same pattern as dashboard) ── */
const DailyLoginStreak = dynamic(
    () => import('@/components/streak/DailyLoginStreak').then(m => ({ default: m.DailyLoginStreak })),
    { ssr: false }
);

interface ProfileData {
    name: string | null;
    username: string | null;
    avatar_url: string | null;
    bio: string | null;
    social_links: { twitter?: string | null; github?: string | null; website?: string | null } | null;
    is_public: boolean;
    wallet_address: string | null;
    created_at: string;
}

/** Hook to fetch SOL balance via Helius RPC (with fallback to default Solana RPC) */
function useSolBalance(walletAddress: string | null) {
    const [balance, setBalance] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!walletAddress) return;
        let cancelled = false;

        async function fetchBalance() {
            setLoading(true);
            try {
                const rpcUrl =
                    process.env.NEXT_PUBLIC_HELIUS_RPC_URL ||
                    process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
                    'https://api.devnet.solana.com';
                const conn = new Connection(rpcUrl, 'confirmed');
                const pubkey = new PublicKey(walletAddress!);
                const lamports = await conn.getBalance(pubkey);
                if (!cancelled) setBalance(lamports / LAMPORTS_PER_SOL);
            } catch (err) {
                console.error('Failed to fetch SOL balance:', err);
                if (!cancelled) setBalance(null);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        fetchBalance();
        return () => { cancelled = true; };
    }, [walletAddress]);

    return { balance, loading };
}

export default function ProfilePage() {
    const t = useTranslations('profile');
    const { trackPageView, trackEvent } = useAnalytics();
    const { data: session } = useSession();
    const walletAddress = (session as unknown as { walletAddress?: string })?.walletAddress ?? null;
    const [copied, setCopied] = useState(false);
    const [shareCopied, setShareCopied] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    const walletPubkey = useMemo(() => {
        if (!walletAddress) return null;
        try { return new PublicKey(walletAddress); } catch { return null; }
    }, [walletAddress]);

    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [xpData, setXpData] = useState<{ totalXp: number; onchainXp: number; offchainXp: number; rank: number } | null>(null);

    const { streak: streakData, activity: streakActivity, isLoading: streakLoading } = useStreak();
    const { dailyLogin } = useDailyLogin();
    const { data: achievements = [], isLoading: achLoading } = useAchievements();
    const { data: credentials = [], isLoading: credLoading } = useCredentials(walletAddress);
    const { data: userStats } = useUserStats();

    // Use session wallet if available, otherwise fall back to profile wallet from DB
    const effectiveWallet = walletAddress || profile?.wallet_address || null;
    const { balance: solBalance, loading: solLoading } = useSolBalance(effectiveWallet);

    useEffect(() => {
        async function fetchProfile() {
            try {
                const res = await fetch('/api/profile');
                if (res.ok) {
                    setProfile(await res.json());
                }
            } catch {
                console.error('Failed to load profile');
            } finally {
                setLoading(false);
            }
        }
        fetchProfile();
    }, []);

    // Fetch combined XP (onchain + offchain) from leaderboard rank API
    useEffect(() => {
        async function fetchXp() {
            try {
                const res = await fetch('/api/leaderboard/rank');
                if (res.ok) {
                    const data = await res.json();
                    setXpData(data);
                }
            } catch {
                console.error('Failed to fetch XP data');
            }
        }
        fetchXp();
    }, []);

    useEffect(() => {
        trackPageView('/profile');
        trackEvent('view_profile', { own: true });
    }, [trackPageView, trackEvent]);

    // Derive data
    const currentStreak = dailyLogin?.currentStreak ?? streakData?.currentStreak ?? 0;
    const longestStreak = dailyLogin?.longestStreak ?? streakData?.longestStreak ?? 0;
    const badgesUnlocked = achievements.filter(a => a.unlocked).length;
    const totalBadges = achievements.length;
    const enrolledCourses = userStats?.enrolled ?? 0;
    const completedCourses = userStats?.completed ?? 0;

    // Build extra activity events for heatmap (badges + daily logins)
    const extraEvents = useMemo<ActivityEvent[]>(() => {
        const events: ActivityEvent[] = [];
        // Unlocked badges
        achievements.filter(a => a.unlocked && a.unlockedAt).forEach(a => {
            const d = new Date(a.unlockedAt!).toISOString().split('T')[0];
            events.push({ date: d, type: 'badge', value: 2 });
        });
        // Daily login streak dates (same logic as StreaksCalendar)
        if (dailyLogin?.lastLoginDate && dailyLogin.currentStreak > 0) {
            const lastLogin = new Date(dailyLogin.lastLoginDate + 'T00:00:00');
            for (let i = 0; i < dailyLogin.currentStreak; i++) {
                const d = new Date(lastLogin);
                d.setDate(d.getDate() - i);
                events.push({ date: d.toISOString().split('T')[0], type: 'xp', value: 1 });
            }
        }
        return events;
    }, [achievements, dailyLogin]);

    // Build skill data from credentials
    const skills = credentials.reduce<{ name: string; level: number; maxLevel: number }[]>((acc, cred) => {
        const trackName = cred.collection || 'General';
        const existing = acc.find(s => s.name === trackName);
        if (existing) {
            existing.level += 1;
        } else {
            acc.push({ name: trackName, level: 1, maxLevel: 5 });
        }
        return acc;
    }, []);

    const handleCopyWallet = useCallback(() => {
        if (!profile?.wallet_address) return;
        navigator.clipboard.writeText(profile.wallet_address);
        setCopied(true);
        goeyToast.success('Wallet address copied!');
        setTimeout(() => setCopied(false), 2000);
    }, [profile?.wallet_address]);

    const handleShareProfile = useCallback(() => {
        if (!profile?.username) return;
        const url = `${window.location.origin}/profile/${profile.username}`;
        navigator.clipboard.writeText(url);
        setShareCopied(true);
        goeyToast.success('Profile link copied!');
        setTimeout(() => setShareCopied(false), 2000);
    }, [profile?.username]);

    const handleShareToX = useCallback(() => {
        const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://academy.superteam.fun';
        const profileUrl = `${appUrl}/profile/${profile?.username || ''}`;
        const level = xpData?.totalXp ? calculateLevel(xpData.totalXp) : 1;
        const totalXp = xpData?.totalXp?.toLocaleString() ?? '0';

        // Gamified progress bar
        const filled = Math.min(badgesUnlocked, 5);
        const empty = 5 - filled;
        const progressBar = '▓'.repeat(filled) + '░'.repeat(empty);

        const lines = [
            `⚔️ Superteam Academy — Player Card`,
            ``,
            `🧑‍💻 ${profile?.name || profile?.username || 'Anon'} · Lv.${level}`,
            `✨ ${totalXp} XP earned`,
            `🔥 ${currentStreak}-day streak (best: ${longestStreak}d)`,
            `🏆 ${badgesUnlocked}/${totalBadges} badges [${progressBar}]`,
            `📚 ${completedCourses}/${enrolledCourses} courses completed`,
            ``,
            `Level up with me 👇`,
            profileUrl,
        ];

        const text = lines.join('\n');
        const tweetUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`;
        window.open(tweetUrl, '_blank', 'noopener,noreferrer,width=550,height=450');
    }, [profile, xpData, currentStreak, longestStreak, badgesUnlocked, totalBadges, enrolledCourses, completedCourses]);

    const solanaNetwork = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';
    const solscanCluster = solanaNetwork === 'mainnet-beta' ? '' : `?cluster=${solanaNetwork}`;
    const solscanUrl = effectiveWallet
        ? `https://solscan.io/account/${effectiveWallet}${solscanCluster}`
        : null;

    if (loading) {
        return (
            <div className="max-w-[1200px] mx-auto flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 text-brand-green-emerald animate-spin" />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="max-w-[1200px] mx-auto p-10 text-center">
                <p className="text-muted-foreground font-supreme">
                    Profile not found. Please sign in.
                </p>
            </div>
        );
    }

    const displayName = profile.name || profile.username || 'Anonymous';
    const joinFormatted = new Date(profile.created_at).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
    });

    return (
        <div className="max-w-[1200px] mx-auto">
            <div className="flex flex-col lg:flex-row gap-6">
                {/* ── Left Sidebar ── */}
                <div className="w-full lg:w-64 shrink-0 space-y-4">
                    {/* Avatar + Name card */}
                    <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--profile-side-bg)', color: 'var(--profile-side-text)', border: '1px solid var(--profile-side-border)', boxShadow: 'var(--profile-side-shadow)' }}>
                        <div className="flex flex-col items-center text-center">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-green-emerald to-emerald-400 flex items-center justify-center text-2xl font-bold text-white overflow-hidden border-2 border-white/30 mb-3">
                                {profile.avatar_url ? (
                                    <Image
                                        src={profile.avatar_url}
                                        alt={displayName}
                                        width={80}
                                        height={80}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="font-supreme font-bold">{displayName[0]?.toUpperCase() || '?'}</span>
                                )}
                            </div>
                            <h1 className="text-lg font-bold font-supreme" style={{ color: 'var(--profile-side-text)' }}>{displayName}</h1>
                            {profile.username && (
                                <p className="text-xs font-supreme" style={{ color: 'var(--profile-side-sub)' }}>@{profile.username}</p>
                            )}

                            {/* Bio */}
                            {profile.bio && (
                                <p className="text-xs font-supreme leading-relaxed mt-2 text-center" style={{ color: 'var(--profile-side-text)', opacity: 0.85 }}>
                                    {profile.bio}
                                </p>
                            )}

                            {/* Social links */}
                            {profile.social_links && (
                                <div className="flex items-center gap-3 mt-3">
                                    {profile.social_links.twitter && (
                                        <a
                                            href={`https://x.com/${profile.social_links.twitter}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="hover:opacity-70 transition-opacity"
                                            title={`@${profile.social_links.twitter}`}
                                        >
                                            <Twitter className="w-4 h-4" style={{ color: 'var(--profile-side-text)' }} />
                                        </a>
                                    )}
                                    {profile.social_links.github && (
                                        <a
                                            href={`https://github.com/${profile.social_links.github}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="hover:opacity-70 transition-opacity"
                                            title={profile.social_links.github}
                                        >
                                            <Github className="w-4 h-4" style={{ color: 'var(--profile-side-text)' }} />
                                        </a>
                                    )}
                                    {profile.social_links.website && (
                                        <a
                                            href={profile.social_links.website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="hover:opacity-70 transition-opacity"
                                            title={profile.social_links.website}
                                        >
                                            <Globe className="w-4 h-4" style={{ color: 'var(--profile-side-text)' }} />
                                        </a>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Action buttons */}
                        <div className="grid grid-cols-2 gap-2 mt-4">
                            <Link
                                href="/settings"
                                className="flex flex-col items-center justify-center gap-1 px-2 py-2.5 rounded-xl text-[10px] font-semibold font-supreme transition-opacity hover:opacity-80"
                                style={{ backgroundColor: 'var(--profile-side-btn-bg)', color: 'var(--profile-side-text)' }}
                            >
                                <Pencil className="w-3.5 h-3.5" />
                                <span>Edit Profile</span>
                            </Link>
                            <button
                                onClick={async () => {
                                    handleShareProfile();
                                    await handleShareToX();
                                }}
                                className="flex flex-col items-center justify-center gap-1 px-2 py-2.5 rounded-xl text-[10px] font-semibold font-supreme transition-opacity hover:opacity-80"
                                style={{ backgroundColor: 'var(--profile-side-btn-bg)', color: 'var(--profile-side-text)' }}
                            >
                                <Share2 className="w-3.5 h-3.5" />
                                <span>Share</span>
                            </button>
                        </div>
                    </div>

                    {/* Daily Login Streak Calendar */}
                    <DailyLoginStreak variant="lime" />

                    {/* Meta info */}
                    <div className="rounded-2xl p-4 space-y-3" style={{ backgroundColor: 'var(--profile-side-bg)', color: 'var(--profile-side-text)', border: '1px solid var(--profile-side-border)', boxShadow: 'var(--profile-side-shadow)' }}>
                        <div className="flex items-center gap-2 text-xs font-supreme" style={{ color: 'var(--profile-side-text)' }}>
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{t('joined')} {joinFormatted}</span>
                        </div>
                        {profile.wallet_address && (
                            <>
                                <div className="flex items-center gap-2 text-xs font-supreme" style={{ color: 'var(--profile-side-text)' }}>
                                    <Wallet className="w-3.5 h-3.5 shrink-0" />
                                    <button
                                        onClick={handleCopyWallet}
                                        className="flex items-center gap-1 hover:opacity-70 transition-opacity truncate"
                                        title="Click to copy wallet address"
                                    >
                                        <span className="truncate">
                                            {profile.wallet_address.slice(0, 6)}...{profile.wallet_address.slice(-4)}
                                        </span>
                                        {copied ? (
                                            <Check className="w-3 h-3 shrink-0" />
                                        ) : (
                                            <Copy className="w-3 h-3 shrink-0" />
                                        )}
                                    </button>
                                </div>
                                {solscanUrl && (
                                    <a
                                        href={solscanUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-xs font-semibold font-supreme hover:opacity-70 transition-opacity"
                                        style={{ color: 'var(--profile-side-text)' }}
                                    >
                                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                                        View on Solscan →
                                    </a>
                                )}
                            </>
                        )}
                    </div>

                    {/* Onchain Wallet Data */}
                    {profile.wallet_address && (
                        <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--profile-side-bg)', color: 'var(--profile-side-text)', border: '1px solid var(--profile-side-border)', boxShadow: 'var(--profile-side-shadow)' }}>
                            <h3 className="text-xs font-bold font-supreme mb-3 flex items-center gap-1.5" style={{ color: 'var(--profile-side-text)' }}>
                                <Wallet className="w-3.5 h-3.5" />
                                Onchain Data
                                <span className="text-[9px] font-normal ml-auto" style={{ color: 'var(--profile-side-sub)' }}>{solanaNetwork}</span>
                            </h3>
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs font-supreme">
                                    <span style={{ color: 'var(--profile-side-sub)' }}>SOL Balance</span>
                                    <span className="font-semibold font-array tabular-nums" style={{ color: 'var(--profile-side-text)' }}>
                                        {solLoading ? (
                                            <Loader2 className="w-3 h-3 animate-spin inline" />
                                        ) : solBalance !== null ? (
                                            `${solBalance.toFixed(4)} SOL`
                                        ) : (
                                            '—'
                                        )}
                                    </span>
                                </div>
                                {solscanUrl && (
                                    <a
                                        href={solscanUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 text-[10px] font-semibold font-supreme mt-1 hover:opacity-70 transition-opacity"
                                        style={{ color: 'var(--profile-side-text)' }}
                                    >
                                        <ExternalLink className="w-3 h-3" />
                                        View on Solscan →
                                    </a>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Track Progress */}
                    <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--profile-side-bg)', color: 'var(--profile-side-text)', border: '1px solid var(--profile-side-border)', boxShadow: 'var(--profile-side-shadow)' }}>
                        <h3 className="text-xs font-bold font-supreme mb-3 flex items-center gap-1.5" style={{ color: 'var(--profile-side-text)' }}>
                            <Target className="w-3.5 h-3.5" />
                            Track Progress
                        </h3>
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs font-supreme">
                                <span style={{ color: 'var(--profile-side-sub)' }}>Courses Enrolled</span>
                                <span className="font-semibold font-array tabular-nums" style={{ color: 'var(--profile-side-text)' }}>{enrolledCourses}</span>
                            </div>
                            <div className="flex justify-between text-xs font-supreme">
                                <span style={{ color: 'var(--profile-side-sub)' }}>Courses Completed</span>
                                <span className="font-semibold font-array tabular-nums" style={{ color: 'var(--profile-side-text)' }}>{completedCourses}</span>
                            </div>
                            <div className="flex justify-between text-xs font-supreme">
                                <span style={{ color: 'var(--profile-side-sub)' }}>Badges Unlocked</span>
                                <span className="font-semibold font-array tabular-nums" style={{ color: 'var(--profile-side-text)' }}>{badgesUnlocked}/{totalBadges}</span>
                            </div>
                            <div className="flex justify-between text-xs font-supreme">
                                <span style={{ color: 'var(--profile-side-sub)' }}>Credentials</span>
                                <span className="font-semibold font-array tabular-nums" style={{ color: 'var(--profile-side-text)' }}>{credentials.length}</span>
                            </div>
                        </div>
                    </div>

                </div>

                {/* ── Right Content Grid ── */}
                <div ref={contentRef} className="flex-1 min-w-0 space-y-5">
                    {/* Stat cards row */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="rounded-3xl p-5" style={{ backgroundColor: 'var(--profile-center-bg)', color: 'var(--profile-center-text)', border: '1px solid var(--profile-center-border)', boxShadow: 'var(--profile-center-shadow)', minHeight: 100 }}>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium font-supreme">Total XP</span>
                                <Sparkles className="w-4 h-4" />
                            </div>
                            <div className="text-2xl font-bold font-array tabular-nums">{xpData?.totalXp?.toLocaleString() ?? 0}</div>
                        </div>
                        <div className="rounded-3xl p-5" style={{ backgroundColor: 'var(--profile-center-bg)', color: 'var(--profile-center-text)', border: '1px solid var(--profile-center-border)', boxShadow: 'var(--profile-center-shadow)', minHeight: 100 }}>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium font-supreme">Level</span>
                                <BarChart3 className="w-4 h-4" />
                            </div>
                            <div className="text-2xl font-bold font-array tabular-nums">{xpData?.totalXp ? calculateLevel(xpData.totalXp) : 1}</div>
                        </div>
                        <div className="rounded-3xl p-5" style={{ backgroundColor: 'var(--profile-center-bg)', color: 'var(--profile-center-text)', border: '1px solid var(--profile-center-border)', boxShadow: 'var(--profile-center-shadow)', minHeight: 100 }}>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium font-supreme">Streak</span>
                                <Flame className="w-4 h-4" />
                            </div>
                            <div className="text-2xl font-bold font-array tabular-nums">{currentStreak}d</div>
                            <span className="text-[10px] font-supreme opacity-70">Max: {longestStreak}d</span>
                        </div>
                        <div className="rounded-3xl p-5" style={{ backgroundColor: 'var(--profile-center-bg)', color: 'var(--profile-center-text)', border: '1px solid var(--profile-center-border)', boxShadow: 'var(--profile-center-shadow)', minHeight: 100 }}>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium font-supreme">Badges</span>
                                <Trophy className="w-4 h-4" />
                            </div>
                            <div className="text-2xl font-bold font-array tabular-nums">{badgesUnlocked}/{totalBadges}</div>
                        </div>
                    </div>

                    {/* Course Progress card */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--profile-center-bg)', border: '1px solid var(--profile-center-border)', boxShadow: 'var(--profile-center-shadow)' }}>
                            <h3 className="text-sm font-bold font-supreme mb-3 flex items-center gap-2" style={{ color: 'var(--profile-center-text)' }}>
                                <BookOpen className="w-4 h-4" style={{ color: 'var(--profile-center-text)' }} />
                                Course Progress
                            </h3>
                            <div className="flex items-center gap-6">
                                {/* Ring chart */}
                                <div className="relative w-20 h-20 shrink-0">
                                    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                                        <circle
                                            cx="18" cy="18" r="15.9155"
                                            fill="none"
                                            stroke="currentColor"
                                            className="text-white/15"
                                            strokeWidth="3"
                                        />
                                        <circle
                                            cx="18" cy="18" r="15.9155"
                                            fill="none"
                                            className="text-brand-green-emerald"
                                            stroke="currentColor"
                                            strokeWidth="3"
                                            strokeDasharray={`${enrolledCourses > 0 ? (completedCourses / enrolledCourses) * 100 : 0}, 100`}
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
                                        <span className="text-lg font-bold font-array" style={{ color: 'var(--profile-center-text)' }}>{completedCourses}</span>
                                        <span className="text-[9px] font-supreme mt-0.5" style={{ color: 'var(--profile-center-sub)' }}>{enrolledCourses} enrolled</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-xs font-supreme">
                                        <div className="w-2 h-2 rounded-full bg-brand-green-emerald shrink-0" />
                                        <span style={{ color: 'var(--profile-center-sub)' }}>Completed: {completedCourses}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs font-supreme">
                                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: 'var(--profile-center-muted-border)' }} />
                                        <span style={{ color: 'var(--profile-center-sub)' }}>In Progress: {Math.max(0, enrolledCourses - completedCourses)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Skills */}
                        <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--profile-center-bg)', border: '1px solid var(--profile-center-border)', boxShadow: 'var(--profile-center-shadow)' }}>
                            <h3 className="text-sm font-bold font-supreme mb-3 flex items-center gap-2" style={{ color: 'var(--profile-center-text)' }}>
                                <Shield className="w-4 h-4" style={{ color: 'var(--profile-center-text)' }} />
                                Skills
                            </h3>
                            <SkillChart skills={skills} />
                        </div>
                    </div>

                    {/* Activity Heatmap */}
                    <ActivityHeatmap activity={streakActivity} extraEvents={extraEvents} isLoading={streakLoading} />

                    {/* Badges */}
                    <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--profile-center-bg)', border: '1px solid var(--profile-center-border)', boxShadow: 'var(--profile-center-shadow)' }}>
                        <h3 className="text-sm font-bold font-supreme mb-3 flex items-center gap-2" style={{ color: 'var(--profile-center-text)' }}>
                            <Trophy className="w-4 h-4" style={{ color: 'var(--profile-center-text)' }} />
                            Badges
                        </h3>
                        <AchievementShowcase
                            achievements={achievements
                                .filter(a => a.unlocked)
                                .map(a => ({
                                    achievement_id: a.id,
                                    awarded_at: a.unlockedAt ? new Date(a.unlockedAt).toISOString() : new Date().toISOString(),
                                    asset_address: a.asset,
                                }))}
                            isLoading={achLoading}
                        />
                    </div>

                    {/* Credentials */}
                    <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--profile-center-bg)', border: '1px solid var(--profile-center-border)', boxShadow: 'var(--profile-center-shadow)' }}>
                        <h3 className="text-sm font-bold font-supreme mb-3 flex items-center gap-2" style={{ color: 'var(--profile-center-text)' }}>
                            <GraduationCap className="w-4 h-4" style={{ color: 'var(--profile-center-text)' }} />
                            {t('credentials')}
                        </h3>
                        <CredentialDisplay credentials={credentials} isLoading={credLoading} />
                    </div>
                </div>
            </div>
        </div>
    );
}
