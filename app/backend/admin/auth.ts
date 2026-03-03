import { Session } from 'next-auth';
import { type JWT } from 'next-auth/jwt';
import { prisma } from '@/backend/prisma';

const ADMIN_WALLETS: string[] = (process.env.ADMIN_WALLETS || '')
    .split(',')
    .map((w) => w.trim())
    .filter(Boolean);

// ============ ADMIN (whitelist-based) ============

/**
 * Check if a session belongs to an admin user.
 * Async — queries DB whitelist + env fallback.
 * Use for mutations and sensitive operations only.
 * For middleware/route guards, use `isAdminFromToken()` instead.
 */
export async function isAdmin(session: Session | null): Promise<boolean> {
    if (!session?.user) return false;

    // 1. DB whitelist — email
    if (session.user.email) {
        const match = await prisma.admin_whitelist.findFirst({
            where: { email: session.user.email, removed_at: null },
        });
        if (match) return true;
    }

    // 2. DB whitelist — wallet
    if (session.walletAddress) {
        const match = await prisma.admin_whitelist.findFirst({
            where: { wallet: session.walletAddress, removed_at: null },
        });
        if (match) return true;
    }

    // 3. Env fallback — emergency backdoor (can be disabled via feature flag)
    const envAdminDisabled = process.env.DISABLE_ENV_ADMIN === 'true';
    if (!envAdminDisabled && session.walletAddress && ADMIN_WALLETS.includes(session.walletAddress)) {
        console.warn('[SECURITY] Admin access granted via ADMIN_WALLETS env — migrate to DB whitelist');
        return true;
    }

    return false;
}

/**
 * Sync admin check from JWT-cached `isAdmin` flag.
 * Use in middleware and route guards.
 */
export function isAdminFromToken(token: JWT): boolean {
    return token.isAdmin === true;
}

// ============ ROLE (profile-based) ============

/**
 * Sync role read from JWT. No DB hit.
 * Use in middleware and route guards.
 */
export function getRoleFromToken(token: JWT): 'student' {
    return 'student';
}
