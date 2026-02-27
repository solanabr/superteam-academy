import NextAuth from 'next-auth';
import type { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';
import GitHub from 'next-auth/providers/github';
import Credentials from 'next-auth/providers/credentials';
import { UserService } from '@/services/user.service';
import { verifySignature } from '@/lib/solana-auth';
import { cookies } from 'next/headers';

function normalizeBaseUrl(baseUrl: string): string {
  const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined;
  const candidates = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.AUTH_URL,
    process.env.NEXTAUTH_URL,
    vercelUrl,
    baseUrl,
  ];

  const selected =
    candidates.find((value) => typeof value === 'string' && /^https?:\/\//i.test(value)) ||
    baseUrl;

  return selected.replace(/\/$/, '');
}

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      walletAddress?: string | null;
      role?: string | null;
      authProvider?: 'solana' | 'google' | 'github' | null;
    };
  }

  interface User {
    walletAddress?: string | null;
    role?: string | null;
    authProvider?: 'solana' | 'google' | 'github' | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    walletAddress?: string | null;
    role?: string | null;
    authProvider?: 'solana' | 'google' | 'github' | null;
  }
}

export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    Credentials({
      id: 'solana',
      name: 'Solana Wallet',
      credentials: {
        walletAddress: { label: 'Wallet Address', type: 'text' },
        signature: { label: 'Signature', type: 'text' },
        message: { label: 'Message', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.walletAddress || !credentials?.signature || !credentials?.message) {
          return null;
        }

        const walletAddress = credentials.walletAddress as string;
        const signature = credentials.signature as string;
        const message = credentials.message as string;

        // Verify the signature
        const isValid = await verifySignature(walletAddress, signature, message);
        if (!isValid) {
          return null;
        }

        // Find or create user
        const user = await UserService.findOrCreateByWallet(walletAddress);

        return {
          id: user._id.toString(),
          name: user.display_name,
          email: user.email || null,
          image: user.avatar_url || null,
          walletAddress: user.wallet_address,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      const resolvedBaseUrl = normalizeBaseUrl(baseUrl);

      if (url.startsWith('/')) {
        return `${resolvedBaseUrl}${url}`;
      }

      try {
        const targetUrl = new URL(url);
        const appUrl = new URL(resolvedBaseUrl);

        if (targetUrl.origin === appUrl.origin) {
          return url;
        }

        if (targetUrl.hostname === 'localhost' || targetUrl.hostname === '127.0.0.1') {
          return `${resolvedBaseUrl}${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`;
        }
      } catch {
        return resolvedBaseUrl;
      }

      return resolvedBaseUrl;
    },
    async signIn({ user, account, profile }) {
      if (!account) return false;

      try {
        // Attempt linking flow if linking cookies exist.
        // If anything goes wrong here, we fall back to normal sign-in
        // so users are never blocked with "Access Denied".
        let cookieStore: Awaited<ReturnType<typeof cookies>> | null = null;
        let linkingUserId: string | undefined;
        let linkingProvider: string | undefined;

        try {
          cookieStore = await cookies();
          linkingUserId = cookieStore.get('linking_user_id')?.value;
          linkingProvider = cookieStore.get('linking_provider')?.value;
        } catch (cookieError) {
          console.warn(
            'Unable to read linking cookies, continuing with normal sign-in',
            cookieError
          );
        }

        if (linkingUserId && linkingProvider === account.provider) {
          try {
            console.log(`Linking ${account.provider} to user ${linkingUserId}`);

            if (account.provider === 'google' && user.email) {
              await UserService.linkGoogle(
                linkingUserId,
                account.providerAccountId,
                user.email,
                user.name || 'Google User',
                user.image || undefined
              );
            } else if (account.provider === 'github') {
              await UserService.linkGitHub(
                linkingUserId,
                account.providerAccountId,
                user.email || undefined,
                user.name || 'GitHub User',
                user.image || undefined
              );
            }
          } catch (linkError) {
            console.error('Linking flow failed, falling back to normal sign-in:', linkError);
          } finally {
            try {
              cookieStore?.delete('linking_user_id');
              cookieStore?.delete('linking_provider');
            } catch (deleteError) {
              console.warn('Failed to clear linking cookies:', deleteError);
            }
          }
        }

        // Normal sign-in flow
        if (account.provider === 'google') {
          if (!user.email) {
            throw new Error('Google account email is required');
          }

          await UserService.findOrCreateByGoogle(
            account.providerAccountId,
            user.email,
            user.name || 'Google User',
            user.image || undefined
          );
        } else if (account.provider === 'github') {
          await UserService.findOrCreateByGitHub(
            account.providerAccountId,
            user.email || null,
            user.name || 'GitHub User',
            user.image || undefined
          );
        }
        return true;
      } catch (error) {
        console.error('Error during sign in:', error);
        return false;
      }
    },
    async jwt({ token, user, account }) {
      if (user) {
        if (account?.provider === 'solana') {
          token.id = user.id!;
          token.walletAddress = user.walletAddress;
          token.role = user.role || null;
          token.authProvider = 'solana';
        } else if (account?.provider === 'google') {
          const dbUser = await UserService.findByGoogleId(account.providerAccountId);
          if (dbUser) {
            token.id = dbUser._id.toString();
            token.walletAddress = dbUser.wallet_address || null;
            token.role = dbUser.role || null;
            token.authProvider = 'google';
          }
        } else if (account?.provider === 'github') {
          const dbUser = await UserService.findByGitHubId(account.providerAccountId);
          if (dbUser) {
            token.id = dbUser._id.toString();
            token.walletAddress = dbUser.wallet_address || null;
            token.role = dbUser.role || null;
            token.authProvider = 'github';
          }
        }
      }

      const mutableToken = token as Record<string, unknown>;
      delete mutableToken.access_token;
      delete mutableToken.id_token;
      delete mutableToken.refresh_token;
      delete mutableToken.token_type;
      delete mutableToken.scope;
      delete mutableToken.expires_at;
      delete mutableToken.session_state;

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.walletAddress = token.walletAddress as string | null | undefined;
        session.user.role = (token.role as string | null | undefined) ?? null;
        session.user.authProvider =
          (token.authProvider as 'solana' | 'google' | 'github' | null | undefined) ?? null;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
