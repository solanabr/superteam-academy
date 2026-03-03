/**
 * Public profile page — server component.
 * Fetches profile data by username with real stats, on-chain data, and credentials.
 */

import { notFound } from 'next/navigation';
import { prisma } from '@/backend/prisma';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { AchievementShowcase } from '@/components/profile/AchievementShowcase';
import { CredentialDisplay } from '@/components/profile/CredentialDisplay';
import { getUserCredentials } from '@/context/solana/credential-service';
import { getXpBalance } from '@/context/solana/xp';
import { Connection, PublicKey } from '@solana/web3.js';
import { calculateLevel } from '@/context/xp-calculations';
import {
    Sparkles,
    BarChart3,
    Flame,
    Trophy,
    Award,
    GraduationCap,
    ExternalLink,
    Wallet,
} from 'lucide-react';

const SOLANA_CLUSTER = process.env.NEXT_PUBLIC_SOLANA_CLUSTER || 'devnet';

interface Props {
    params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props) {
    const { username } = await params;
    return {
        title: `${username} — Superteam Academy`,
        description: `${username}'s profile on Superteam Academy`,
    };
}

export default async function PublicProfilePage({ params }: Props) {
    const { username } = await params;

    const profile = await prisma.profiles.findUnique({
        where: { username },
        select: {
            id: true,
            name: true,
            username: true,
            avatar_url: true,
            bio: true,
            social_links: true,
            is_public: true,
            wallet_address: true,
            created_at: true,
            offchain_xp: true,
            _count: {
                select: {
                    achievements: true,
                },
            },
            achievements: {
                select: {
                    achievement_id: true,
                    awarded_at: true,
                    asset_address: true,
                },
                orderBy: { awarded_at: 'desc' as const },
                take: 12,
            },
            streaks: {
                select: { current_streak: true, longest_streak: true },
            },
            daily_login_streaks: {
                select: { current_streak: true, longest_streak: true },
            },
        },
    });

    if (!profile || !profile.is_public) {
        notFound();
    }

    const socialLinks = profile.social_links as { twitter?: string; github?: string; website?: string } | null;

    // Fetch on-chain data if wallet is linked
    let onchainXp = 0;
    let credentials: Awaited<ReturnType<typeof getUserCredentials>> = [];

    if (profile.wallet_address) {
        try {
            const rpcUrl = process.env.NEXT_PUBLIC_HELIUS_RPC_URL || process.env.HELIUS_RPC_URL || '';
            const connection = new Connection(rpcUrl);
            const walletPk = new PublicKey(profile.wallet_address);
            onchainXp = await getXpBalance(connection, walletPk);
        } catch {
            // RPC may be unavailable
        }

        try {
            credentials = await getUserCredentials(profile.wallet_address);
        } catch {
            // Helius may be unavailable
        }
    }

    const offchainXp = profile.offchain_xp ?? 0;
    const totalXp = onchainXp + offchainXp;
    const level = calculateLevel(totalXp);
    // Use daily_login_streaks first (more accurate), fall back to streaks
    const dailyStreak = profile.daily_login_streaks;
    const legacyStreak = profile.streaks?.[0];
    const currentStreak = dailyStreak?.current_streak ?? legacyStreak?.current_streak ?? 0;
    const longestStreak = dailyStreak?.longest_streak ?? legacyStreak?.longest_streak ?? 0;

    const clusterParam = SOLANA_CLUSTER === 'mainnet-beta' ? '' : `?cluster=${SOLANA_CLUSTER}`;

    return (
        <div className="max-w-[900px] mx-auto space-y-5">
            {/* Profile Header */}
            <ProfileHeader
                name={profile.name}
                username={profile.username}
                avatarUrl={profile.avatar_url}
                bio={profile.bio}
                socialLinks={socialLinks}
                walletAddress={profile.wallet_address}
                joinDate={profile.created_at.toISOString()}
            />

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatBlock
                    icon={Sparkles}
                    label="Total XP"
                    value={totalXp.toLocaleString()}
                    bgColor="#a78bfa"
                />
                <StatBlock
                    icon={BarChart3}
                    label="Level"
                    value={level}
                    bgColor="#f97316"
                />
                <StatBlock
                    icon={Flame}
                    label="Streak"
                    value={`${currentStreak}d`}
                    sub={longestStreak > 0 ? `Best: ${longestStreak}d` : undefined}
                    bgColor="#34d399"
                />
                <StatBlock
                    icon={Trophy}
                    label="Achievements"
                    value={profile._count.achievements}
                    bgColor="#f472b6"
                />
            </div>


            {/* Achievements */}
            {profile.achievements.length > 0 && (
                <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm">
                    <h2 className="text-base font-bold font-display text-foreground mb-4 flex items-center gap-2">
                        <Award className="w-4 h-4 text-brand-green-emerald" />
                        Achievements
                    </h2>
                    <AchievementShowcase
                        achievements={profile.achievements.map(a => ({
                            achievement_id: a.achievement_id,
                            awarded_at: a.awarded_at.toISOString(),
                            asset_address: a.asset_address,
                        }))}
                    />
                </div>
            )}

            {/* Credentials */}
            {credentials.length > 0 && (
                <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm">
                    <h2 className="text-base font-bold font-display text-foreground mb-4 flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-brand-green-emerald" />
                        On-Chain Credentials
                    </h2>
                    <CredentialDisplay credentials={credentials} />
                </div>
            )}

            {/* Wallet */}
            {profile.wallet_address && (
                <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm">
                    <h2 className="text-base font-bold font-display text-foreground mb-3 flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-brand-green-emerald" />
                        On-Chain Identity
                    </h2>
                    <p className="text-sm font-mono text-muted-foreground mb-2 break-all">
                        {profile.wallet_address}
                    </p>
                    <a
                        href={`https://explorer.solana.com/address/${profile.wallet_address}${clusterParam}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-green-emerald hover:underline font-supreme"
                    >
                        <ExternalLink className="w-3 h-3" />
                        View on Solana Explorer
                    </a>
                </div>
            )}

            {/* Join CTA */}
            <div className="rounded-2xl border border-brand-green-emerald/20 bg-gradient-to-r from-brand-green-emerald/5 to-brand-green-emerald/10 p-6 sm:p-8 text-center">
                <h3 className="text-lg font-bold font-display text-foreground mb-2">
                    Join Superteam Academy
                </h3>
                <p className="text-sm text-muted-foreground font-supreme mb-4 max-w-md mx-auto">
                    Earn XP, collect on-chain credentials, and level up — just like {profile.name || profile.username}.
                </p>
                <a
                    href="/en/login"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-green-emerald text-white text-sm font-semibold font-supreme shadow-md hover:opacity-90 transition-all"
                >
                    <Sparkles className="w-4 h-4" />
                    Get Started Free
                </a>
            </div>
        </div>
    );
}

/* ── Stat card component ── */
function StatBlock({ icon: Icon, label, value, sub, bgColor }: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string | number;
    sub?: string;
    bgColor: string;
}) {
    return (
        <div
            className="rounded-3xl p-5 border-0 shadow-sm"
            style={{ backgroundColor: bgColor, color: '#1b231d', minHeight: 120 }}
        >
            <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium font-supreme">{label}</span>
                <Icon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold font-supreme tabular-nums">{value}</div>
            {sub && (
                <div className="text-xs font-supreme mt-1 opacity-70">{sub}</div>
            )}
        </div>
    );
}
