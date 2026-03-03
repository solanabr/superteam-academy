/**
 * Profile API route.
 *
 * GET    — fetch own profile (authenticated, rate-limited)
 * PUT    — update profile fields (authenticated, rate-limited, validated)
 * DELETE — hard-delete profile and all related data (authenticated, rate-limited)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/backend/auth/auth-options';
import { prisma } from '@/backend/prisma';
import { checkRateLimit } from '@/backend/auth/rate-limit';
import { getClientIp } from '@/backend/auth/ip';

/** Allowed social link keys */
const SOCIAL_KEYS = ['twitter', 'github', 'website'] as const;

/** Maximum field lengths */
const MAX_LENGTHS = {
    name: 100,
    bio: 500,
    username: 30,
    avatar_url: 500,
    social_value: 200,
} as const;

/** Allowed avatar URL domains (SSRF prevention) */
const AVATAR_ALLOWED_DOMAINS = [
    'gravatar.com',
    'www.gravatar.com',
    'avatars.githubusercontent.com',
    'lh3.googleusercontent.com',
    'cloudflare-ipfs.com',
    'arweave.net',
    'cdn.discordapp.com',
    'pbs.twimg.com',
] as const;

/**
 * Validate avatar URL: local paths (/avatars/...) or HTTPS + allowed domains.
 * Returns null if valid, or error message if not.
 */
function validateAvatarUrl(url: string): string | null {
    if (!url) return null; // empty is valid (clears avatar)

    // Allow local preset avatar paths and uploaded avatars
    if (/^\/avatars\/(uploads\/)?[a-zA-Z0-9_-]+\.(png|jpg|jpeg|webp|gif|svg)$/.test(url)) {
        return null;
    }

    try {
        const parsed = new URL(url);
        if (parsed.protocol !== 'https:') {
            return 'Avatar URL must use HTTPS';
        }
        const isAllowed = AVATAR_ALLOWED_DOMAINS.some(
            (domain) => parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`)
        );
        if (!isAllowed) {
            return `Avatar URL domain not allowed. Accepted: ${AVATAR_ALLOWED_DOMAINS.join(', ')}`;
        }
        return null;
    } catch {
        return 'Invalid avatar URL format';
    }
}

export async function GET(request: NextRequest) {
    try {
        // Rate limit
        const ip = getClientIp(request);
        const { success: rlOk, response: rlRes } = await checkRateLimit(`profile-get:${ip}`);
        if (!rlOk) return rlRes!;

        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const profile = await prisma.profiles.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                name: true,
                email: true,
                username: true,
                avatar_url: true,
                bio: true,
                social_links: true,
                is_public: true,
                wallet_address: true,
                login_count: true,
                created_at: true,
                last_login_at: true,
            },
        });

        if (!profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        return NextResponse.json({
            ...profile,
            created_at: profile.created_at.toISOString(),
            last_login_at: profile.last_login_at?.toISOString() ?? null,
        });
    } catch (error) {
        console.error('[api/profile] GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        // Rate limit — double-gate: IP + userId
        const ip = getClientIp(request);
        const { success: rlOk, response: rlRes } = await checkRateLimit(`profile-put:${ip}`);
        if (!rlOk) return rlRes!;

        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { success: rlOk2, response: rlRes2 } = await checkRateLimit(`profile-put:${session.user.id}`);
        if (!rlOk2) return rlRes2!;

        // Safe JSON parse
        let body: Record<string, unknown>;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
        }

        const { name, bio, username, avatar_url, social_links, is_public, role } = body as {
            name?: string;
            bio?: string;
            username?: string;
            avatar_url?: string;
            social_links?: Record<string, string | null>;
            is_public?: boolean;
            role?: string;
        };

        // Validate field lengths
        if (name !== undefined && (typeof name !== 'string' || name.length > MAX_LENGTHS.name)) {
            return NextResponse.json({ error: `Name must be at most ${MAX_LENGTHS.name} characters` }, { status: 400 });
        }
        if (bio !== undefined && (typeof bio !== 'string' || bio.length > MAX_LENGTHS.bio)) {
            return NextResponse.json({ error: `Bio must be at most ${MAX_LENGTHS.bio} characters` }, { status: 400 });
        }
        if (username !== undefined) {
            if (typeof username !== 'string' || username.length > MAX_LENGTHS.username) {
                return NextResponse.json({ error: `Username must be at most ${MAX_LENGTHS.username} characters` }, { status: 400 });
            }
            if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
                return NextResponse.json({ error: 'Username can only contain letters, numbers, hyphens, and underscores' }, { status: 400 });
            }
            // Check uniqueness
            const existing = await prisma.profiles.findUnique({ where: { username }, select: { id: true } });
            if (existing && existing.id !== session.user.id) {
                return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
            }
        }
        // Avatar URL: HTTPS + allowlist validation
        if (avatar_url !== undefined) {
            if (typeof avatar_url !== 'string') {
                return NextResponse.json({ error: 'Invalid avatar URL' }, { status: 400 });
            }
            if (avatar_url.trim()) {
                const avatarError = validateAvatarUrl(avatar_url.trim());
                if (avatarError) {
                    return NextResponse.json({ error: avatarError }, { status: 400 });
                }
            }
        }
        if (social_links !== undefined) {
            if (typeof social_links !== 'object' || social_links === null || Array.isArray(social_links)) {
                return NextResponse.json({ error: 'social_links must be an object' }, { status: 400 });
            }
            for (const key of Object.keys(social_links)) {
                if (!SOCIAL_KEYS.includes(key as typeof SOCIAL_KEYS[number])) {
                    return NextResponse.json({ error: `Invalid social link key: ${key}` }, { status: 400 });
                }
                const val = social_links[key];
                if (val !== null && (typeof val !== 'string' || val.length > MAX_LENGTHS.social_value)) {
                    return NextResponse.json({ error: `Social link value too long: ${key}` }, { status: 400 });
                }
            }
        }
        if (is_public !== undefined && typeof is_public !== 'boolean') {
            return NextResponse.json({ error: 'is_public must be a boolean' }, { status: 400 });
        }

        // Build update data — only include provided fields
        const updateData: Record<string, unknown> = {};
        if (name !== undefined) updateData.name = name.trim() || null;
        if (bio !== undefined) updateData.bio = bio.trim() || null;
        if (username !== undefined) updateData.username = username.trim() || null;
        if (avatar_url !== undefined) updateData.avatar_url = avatar_url.trim() || null;
        if (social_links !== undefined) updateData.social_links = social_links;
        if (is_public !== undefined) updateData.is_public = is_public;

        // Handle role change during onboarding (atomic)
        if (role !== undefined) {
            if (typeof role !== 'string' || !['student'].includes(role)) {
                return NextResponse.json({ error: 'Invalid role. Must be student.' }, { status: 400 });
            }

            // Atomic: all writes in one transaction — no race condition.
            // UPDATE WHERE onboarding_complete = false prevents duplicate role changes.
            const result = await prisma.$transaction(async (tx) => {
                const rowsAffected = await tx.$executeRaw`
                    UPDATE profiles
                    SET role = ${role},
                        onboarding_complete = true,
                        session_version = session_version + 1
                    WHERE id = ${session.user.id}::uuid
                      AND onboarding_complete = false
                `;
                if (rowsAffected === 0) {
                    throw new Error('ROLE_LOCKED');
                }

                await tx.role_change_log.create({
                    data: {
                        profile_id: session.user.id,
                        old_role: 'student',
                        new_role: role,
                        changed_by: session.user.id,
                        reason: 'onboarding',
                    },
                });

                return tx.profiles.findUnique({
                    where: { id: session.user.id },
                    select: { id: true, role: true, onboarding_complete: true },
                });
            });

            // If only role was set (onboarding), return early
            if (Object.keys(updateData).length === 0) {
                return NextResponse.json(result);
            }
        }

        // Standard profile update (non-role fields)
        if (Object.keys(updateData).length > 0) {
            const updated = await prisma.profiles.update({
                where: { id: session.user.id },
                data: updateData,
                select: {
                    id: true,
                    name: true,
                    username: true,
                    avatar_url: true,
                    bio: true,
                    social_links: true,
                    is_public: true,
                    role: true,
                    onboarding_complete: true,
                },
            });
            return NextResponse.json(updated);
        }

        return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    } catch (error) {
        if (error instanceof Error && error.message === 'ROLE_LOCKED') {
            return NextResponse.json({ error: 'Role cannot be changed after onboarding' }, { status: 403 });
        }
        console.error('[api/profile] PUT error:', error);
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        // Rate limit
        const ip = getClientIp(request);
        const { success: rlOk, response: rlRes } = await checkRateLimit(`profile-delete:${ip}`);
        if (!rlOk) return rlRes!;

        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Hard-delete: Prisma cascades all related records
        // (linked_accounts, audit_logs, streaks, streak_activity, streak_milestones,
        //  achievements, daily_login_streaks, threads, replies, upvotes, push_subscriptions)
        await prisma.profiles.delete({
            where: { id: session.user.id },
        });

        return NextResponse.json({ deleted: true });
    } catch (error) {
        console.error('[api/profile] DELETE error:', error);
        return NextResponse.json({ error: 'Failed to delete profile' }, { status: 500 });
    }
}
