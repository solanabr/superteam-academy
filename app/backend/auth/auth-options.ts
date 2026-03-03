import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import CredentialsProvider from 'next-auth/providers/credentials';
import { Prisma } from '@prisma/client';
import { prisma } from '@/backend/prisma';

import { verifyWalletSignature, findUserByWallet, createUserWithWallet } from '@/backend/auth/wallet';
import { getNonce, deleteNonce } from '@/backend/auth/nonce-store';
import { isValidSolanaAddress } from '@/backend/auth/validation';
import { checkRateLimit } from '@/backend/auth/rate-limit';
import { isLockedOut, recordFailedAttempt, clearFailedAttempts } from '@/backend/auth/lockout';
import { logAuditEvent } from '@/backend/auth/audit';
import '@/context/env'; // Validate env vars on import

const ADMIN_WALLETS: string[] = (process.env.ADMIN_WALLETS || '')
    .split(',').map(w => w.trim()).filter(Boolean);

// Valid role values per the DB schema (profiles.role)
const VALID_ROLES = new Set(['student']);

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
        GitHubProvider({
            clientId: process.env.GITHUB_CLIENT_ID!,
            clientSecret: process.env.GITHUB_CLIENT_SECRET!,
        }),
        CredentialsProvider({
            id: 'wallet',
            name: 'Solana Wallet',
            credentials: {
                walletAddress: { label: 'Wallet Address', type: 'text' },
                message: { label: 'Message', type: 'text' },
                signature: { label: 'Signature', type: 'text' },
            },
            async authorize(credentials) {
                if (!credentials?.walletAddress || !credentials?.message || !credentials?.signature) {
                    return null;
                }

                const { walletAddress, message, signature } = credentials;

                if (!isValidSolanaAddress(walletAddress)) {
                    return null;
                }

                // Rate limit per wallet address to prevent brute-force and spam creation
                const { success: rlOk } = await checkRateLimit(`wallet-auth:${walletAddress}`);
                if (!rlOk) return null;

                // Check account lockout (failed attempt tracking)
                if (await isLockedOut(walletAddress)) {
                    return null;
                }

                // Verify stored nonce
                const storedMessage = await getNonce(`wallet:auth:${walletAddress}`);
                if (!storedMessage || message !== storedMessage) {
                    await recordFailedAttempt(walletAddress);
                    return null;
                }

                // Verify ed25519 signature
                const isValid = verifyWalletSignature(walletAddress, message, signature);
                if (!isValid) {
                    await recordFailedAttempt(walletAddress);
                    return null;
                }

                // Consume nonce — single point of deletion
                await deleteNonce(`wallet:auth:${walletAddress}`);

                // Clear lockout on successful verification
                await clearFailedAttempts(walletAddress);

                // Use consolidated wallet CRUD functions
                let user = await findUserByWallet(walletAddress);
                const isNewUser = !user;

                if (user) {
                    // Atomic login count increment
                    await prisma.profiles.update({
                        where: { id: user.id },
                        data: { login_count: { increment: 1 }, last_login_at: new Date() },
                    });

                    await logAuditEvent({ userId: user.id, action: 'wallet_login' });
                } else {
                    user = await createUserWithWallet(walletAddress);
                    await logAuditEvent({ userId: user.id, action: 'wallet_signup' });
                }

                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    image: user.avatar_url,
                    wallet_address: walletAddress,
                    is_new_user: isNewUser,
                    role: user.role,
                    onboarding_complete: user.onboarding_complete,
                    session_version: user.session_version,
                };
            },
        }),
    ],

    callbacks: {
        async signIn({ user, account, profile: oauthProfile }) {
            if (!account) return false;

            // Wallet auth already handled in authorize()
            if (account.provider === 'wallet') {

                return true;
            }

            // OAuth: find or create profile + linked_account
            const providerId = account.providerAccountId;

            const existingLink = await prisma.linked_accounts.findFirst({
                where: { provider: account.provider, provider_id: providerId },
                select: { user_id: true },
            });

            if (existingLink) {
                user.id = existingLink.user_id;

                // Fetch role/onboarding to cache in JWT
                const existingProfile = await prisma.profiles.findUnique({
                    where: { id: existingLink.user_id },
                    select: { role: true, onboarding_complete: true, session_version: true },
                });
                if (existingProfile) {
                    (user as unknown as Record<string, unknown>).role = existingProfile.role;
                    (user as unknown as Record<string, unknown>).onboarding_complete = existingProfile.onboarding_complete;
                    (user as unknown as Record<string, unknown>).session_version = existingProfile.session_version;
                }

                // Atomic login count increment
                await prisma.profiles.update({
                    where: { id: existingLink.user_id },
                    data: { login_count: { increment: 1 }, last_login_at: new Date() },
                });

                await prisma.linked_accounts.updateMany({
                    where: { user_id: existingLink.user_id, provider: account.provider },
                    data: { last_used_at: new Date() },
                });


                await logAuditEvent({ userId: existingLink.user_id, action: `${account.provider}_login` });
                return true;
            }

            // Create new profile (or link to existing profile with same email)
            let newProfile;
            try {
                // Bug #11: Check for existing profile with same email before creating
                if (user.email) {
                    const existingByEmail = await prisma.profiles.findFirst({
                        where: { email: user.email, deleted_at: null },
                        select: { id: true, role: true, onboarding_complete: true, session_version: true },
                    });
                    if (existingByEmail) {
                        // Link to existing profile instead of creating duplicate
                        user.id = existingByEmail.id;
                        (user as unknown as Record<string, unknown>).role = existingByEmail.role;
                        (user as unknown as Record<string, unknown>).onboarding_complete = existingByEmail.onboarding_complete;
                        (user as unknown as Record<string, unknown>).session_version = existingByEmail.session_version;

                        await prisma.linked_accounts.create({
                            data: {
                                user_id: existingByEmail.id,
                                provider: account.provider,
                                provider_id: providerId,
                                provider_data: { email: user.email, name: user.name } as Prisma.InputJsonValue,
                                last_used_at: new Date(),
                            },
                        });

                        await prisma.profiles.update({
                            where: { id: existingByEmail.id },
                            data: { login_count: { increment: 1 }, last_login_at: new Date() },
                        });


                        await logAuditEvent({ userId: existingByEmail.id, action: `${account.provider}_linked_by_email` });
                        return true;
                    }
                }

                newProfile = await prisma.profiles.create({
                    data: {
                        email: user.email,
                        name: user.name || (oauthProfile as Record<string, string>)?.login,
                        avatar_url: user.image,
                        username: (oauthProfile as Record<string, string>)?.login || null,
                        last_login_at: new Date(),
                        login_count: 1,
                    },
                });
            } catch {
                return false;
            }

            const providerData: Record<string, unknown> = {
                email: user.email,
                name: user.name,
            };

            if (account.provider === 'github') {
                providerData.login = (oauthProfile as Record<string, string>)?.login;
                providerData.avatar_url = user.image;
            } else if (account.provider === 'google') {
                providerData.picture = user.image;
            }

            await prisma.linked_accounts.create({
                data: {
                    user_id: newProfile.id,
                    provider: account.provider,
                    provider_id: providerId,
                    provider_data: providerData as Prisma.InputJsonValue,
                    last_used_at: new Date(),
                },
            });

            user.id = newProfile.id;

            await logAuditEvent({ userId: newProfile.id, action: `${account.provider}_signup` });
            return true;
        },

        async jwt({ token, user, account, trigger }) {
            if (user) {
                token.userId = user.id;
                // Cache wallet address from authorize() return value
                const userRecord = user as unknown as Record<string, unknown>;
                if (userRecord.wallet_address) {
                    token.walletAddress = userRecord.wallet_address as string;
                }
                // Cache role and onboarding state from initial sign-in
                token.role = VALID_ROLES.has(userRecord.role as string) ? (userRecord.role as string) : 'student';
                token.onboardingComplete = (userRecord.onboarding_complete as boolean) ?? false;
                token.sessionVersion = (userRecord.session_version as number) ?? 1;
                token.lastChecked = Date.now();

                // Set isAdmin on initial sign-in (same logic as refresh block)
                // Without this, proxy.ts reads token.isAdmin as undefined and blocks admin access
                const email = (userRecord.email as string) || null;
                const walletAddr = (userRecord.wallet_address as string) || null;
                const adminOrConditions: Prisma.admin_whitelistWhereInput[] = [];
                if (email) adminOrConditions.push({ email });
                if (walletAddr) adminOrConditions.push({ wallet: walletAddr });

                let dbAdmin = false;
                if (adminOrConditions.length > 0) {
                    const adminMatch = await prisma.admin_whitelist.findFirst({
                        where: { removed_at: null, OR: adminOrConditions },
                        select: { id: true },
                    });
                    dbAdmin = !!adminMatch;
                }
                const envAdmin = !!walletAddr && ADMIN_WALLETS.includes(walletAddr);
                token.isAdmin = dbAdmin || envAdmin;


            }

            if (account) {
                token.provider = account.provider;
            }

            // Cache linked accounts in JWT on first sign-in
            if (user && token.userId) {
                const accounts = await prisma.linked_accounts.findMany({
                    where: { user_id: token.userId as string },
                    select: { provider: true, provider_id: true },
                });

                token.linkedAccounts = accounts || [];
            }

            // Always re-validate from DB on every session check.
            // A single findUnique by PK is negligible cost, and guarantees
            // that changes (onboarding, role, deletion) are picked up immediately.
            // The initial sign-in (when `user` is present) already sets the values above,
            // so we skip the DB check in that case to avoid a duplicate query.
            const shouldRefresh = !user;

            if (token.userId && shouldRefresh) {
                const profile = await prisma.profiles.findUnique({
                    where: { id: token.userId as string },
                    select: {
                        role: true,
                        onboarding_complete: true,
                        session_version: true,
                        email: true,
                        wallet_address: true,
                        deleted_at: true,
                    },
                });

                if (!profile || profile.deleted_at) {
                    // User deleted or not found — flag session as invalid
                    console.warn(`[Auth:JWT] User deleted/not found: ${token.userId} — invalidating session`);
                    token.sessionInvalid = true;
                    token.userId = undefined;
                    return token;
                }



                // Always sync role and onboarding state from DB on refresh
                token.role = VALID_ROLES.has(profile.role) ? profile.role : 'student';
                token.onboardingComplete = profile.onboarding_complete;
                token.sessionVersion = profile.session_version;

                // Refresh admin status from DB whitelist
                const adminOrConditions: Prisma.admin_whitelistWhereInput[] = [];
                if (profile.email) adminOrConditions.push({ email: profile.email });
                if (profile.wallet_address) adminOrConditions.push({ wallet: profile.wallet_address });

                let dbAdmin = false;
                if (adminOrConditions.length > 0) {
                    const adminMatch = await prisma.admin_whitelist.findFirst({
                        where: { removed_at: null, OR: adminOrConditions },
                        select: { id: true },
                    });
                    dbAdmin = !!adminMatch;
                }

                const envAdmin = !!profile.wallet_address && ADMIN_WALLETS.includes(profile.wallet_address);
                token.isAdmin = dbAdmin || envAdmin;
                token.lastChecked = Date.now();
            }

            return token;
        },

        async session({ session, token }) {
            // If session was invalidated (deleted user), signal client to sign out
            if (token.sessionInvalid) {

                (session as unknown as Record<string, unknown>).invalid = true;
                return session;
            }

            if (token.userId) {
                session.user.id = token.userId as string;

                // Use cached linked accounts from JWT instead of DB query per request
                session.linkedAccounts = (token.linkedAccounts as { provider: string; provider_id: string }[]) || [];

                if (token.walletAddress) {
                    session.walletAddress = token.walletAddress as string;
                } else {
                    const walletAccount = session.linkedAccounts?.find((a) => a.provider === 'wallet');
                    if (walletAccount) {
                        session.walletAddress = walletAccount.provider_id;
                    }
                }

                // Expose role and onboarding status to client
                (session.user as Record<string, unknown>).role = token.role || 'student';
                (session.user as Record<string, unknown>).onboardingComplete = token.onboardingComplete ?? false;

                // Admin display hint — read-only boolean derived from signed JWT.
                // Strict boolean cast prevents type confusion; server-side API routes
                // independently verify admin status via isAdmin()/isAdminFromToken(),
                // so even if this value were somehow tampered with on the client,
                // no privileged operation would succeed.
                (session.user as Record<string, unknown>).isAdmin = token.isAdmin === true;
            }

            return session;
        },
    },

    pages: {
        signIn: '/login',
    },

    session: {
        strategy: 'jwt',
        maxAge: 7 * 24 * 60 * 60, // 7 days (shorter for admin-role platform)
    },

    secret: process.env.AUTH_SECRET,
};
