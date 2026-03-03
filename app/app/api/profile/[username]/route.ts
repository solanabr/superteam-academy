/**
 * Public profile API route.
 *
 * GET — fetch a user's public profile by username.
 * Returns 404 if user not found or profile is private.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/backend/prisma';
import { checkRateLimit } from '@/backend/auth/rate-limit';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ username: string }> }
) {
    try {
        // Rate limit public profile lookups
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
        const { success: rlOk, response: rlRes } = await checkRateLimit(`public-profile:${ip}`);
        if (!rlOk) return rlRes!;

        const { username } = await params;

        if (!username || username.length > 30) {
            return NextResponse.json({ error: 'Invalid username' }, { status: 400 });
        }

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
                _count: {
                    select: {
                        achievements: true,
                        streak_activity: true,
                    },
                },
                streaks: {
                    select: {
                        current_streak: true,
                        longest_streak: true,
                    },
                },
            },
        });

        if (!profile) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (!profile.is_public) {
            return NextResponse.json({ error: 'Profile is private' }, { status: 403 });
        }

        return NextResponse.json({
            id: profile.id,
            name: profile.name,
            username: profile.username,
            avatar_url: profile.avatar_url,
            bio: profile.bio,
            social_links: profile.social_links,
            wallet_address: profile.wallet_address,
            created_at: profile.created_at.toISOString(),
            achievements_count: profile._count.achievements,
            activity_days: profile._count.streak_activity,
            streak: profile.streaks?.[0] ?? null,
        });
    } catch (error) {
        console.error('[api/profile/[username]] GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }
}
