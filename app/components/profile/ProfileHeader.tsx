'use client';

/**
 * Profile header — avatar, name, bio, social links, join date, wallet.
 * Used on both own profile and public profile pages.
 */

import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
    Calendar,
    Wallet,
    Pencil,
    Twitter,
    Github,
    Globe,
} from 'lucide-react';

interface SocialLinks {
    twitter?: string | null;
    github?: string | null;
    website?: string | null;
}

interface ProfileHeaderProps {
    name: string | null;
    username: string | null;
    avatarUrl: string | null;
    bio: string | null;
    socialLinks: SocialLinks | null;
    walletAddress: string | null;
    joinDate: string;
    isOwn?: boolean;
}

export function ProfileHeader({
    name,
    username,
    avatarUrl,
    bio,
    socialLinks,
    walletAddress,
    joinDate,
    isOwn = false,
}: ProfileHeaderProps) {
    const t = useTranslations('profile');
    const displayName = name || username || 'Anonymous';
    const joinFormatted = new Date(joinDate).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
    });

    return (
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
            <div className="flex gap-5 sm:gap-6 items-start">
                {/* Avatar */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-brand-green-emerald to-emerald-400 flex items-center justify-center text-3xl font-bold text-white shrink-0 overflow-hidden border-2 border-border">
                    {avatarUrl ? (
                        <Image
                            src={avatarUrl}
                            alt={displayName}
                            width={96}
                            height={96}
                            className="w-full h-full object-cover"
                            priority
                            loading="eager"
                        />
                    ) : (
                        <span className="font-display">{displayName[0]?.toUpperCase() || '?'}</span>
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-xl sm:text-2xl font-bold font-display text-foreground truncate">
                            {displayName}
                        </h1>
                        {isOwn && (
                            <Link
                                href="/settings"
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted border border-border text-xs font-semibold font-supreme text-muted-foreground hover:text-foreground hover:border-brand-green-emerald/50 transition-colors"
                            >
                                <Pencil className="w-3 h-3" />
                                {t('editProfile')}
                            </Link>
                        )}
                    </div>

                    {username && (
                        <p className="text-sm text-muted-foreground font-supreme mb-2">
                            @{username}
                        </p>
                    )}

                    {bio && (
                        <p className="text-sm text-foreground/80 font-supreme leading-relaxed mb-3">
                            {bio}
                        </p>
                    )}

                    {/* Meta row */}
                    <div className="flex gap-4 flex-wrap text-xs text-muted-foreground font-supreme">
                        <span className="inline-flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            {t('joined')} {joinFormatted}
                        </span>
                        {walletAddress && (
                            <span className="inline-flex items-center gap-1.5" title={walletAddress}>
                                <Wallet className="w-3.5 h-3.5" />
                                {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
                            </span>
                        )}
                    </div>

                    {/* Social links */}
                    {socialLinks && (
                        <div className="flex gap-3 mt-3">
                            {socialLinks.twitter && (
                                <a
                                    href={`https://x.com/${socialLinks.twitter}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-brand-green-emerald font-supreme transition-colors"
                                >
                                    <Twitter className="w-3.5 h-3.5" />
                                    @{socialLinks.twitter}
                                </a>
                            )}
                            {socialLinks.github && (
                                <a
                                    href={`https://github.com/${socialLinks.github}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-brand-green-emerald font-supreme transition-colors"
                                >
                                    <Github className="w-3.5 h-3.5" />
                                    {socialLinks.github}
                                </a>
                            )}
                            {socialLinks.website && (
                                <a
                                    href={socialLinks.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-brand-green-emerald font-supreme transition-colors"
                                >
                                    <Globe className="w-3.5 h-3.5" />
                                    {(() => { try { return new URL(socialLinks.website).hostname; } catch { return 'Website'; } })()}
                                </a>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
