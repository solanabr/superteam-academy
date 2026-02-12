import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import GitHub from 'next-auth/providers/github';
import Credentials from 'next-auth/providers/credentials';
import type { UserRole } from '@/types';
import { verifySignature } from './wallet-auth';
import type { Provider } from 'next-auth/providers';

// Build providers dynamically — skip OAuth providers without real credentials
const providers: Provider[] = [];

const googleId = process.env.GOOGLE_CLIENT_ID ?? '';
const googleSecret = process.env.GOOGLE_CLIENT_SECRET ?? '';
if (googleId && googleSecret && googleId !== 'placeholder') {
  providers.push(
    Google({
      clientId: googleId,
      clientSecret: googleSecret,
      allowDangerousEmailAccountLinking: true,
    })
  );
}

const githubId = process.env.GITHUB_CLIENT_ID ?? '';
const githubSecret = process.env.GITHUB_CLIENT_SECRET ?? '';
if (githubId && githubSecret && githubId !== 'placeholder') {
  providers.push(
    GitHub({
      clientId: githubId,
      clientSecret: githubSecret,
      allowDangerousEmailAccountLinking: true,
    })
  );
}

providers.push(
  Credentials({
    id: 'solana-wallet',
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

      const isValid = verifySignature(
        credentials.walletAddress as string,
        credentials.signature as string,
        credentials.message as string
      );

      if (!isValid) return null;

      return {
        id: credentials.walletAddress as string,
        name: null,
        email: null,
        image: null,
        role: 'student' as UserRole,
        walletAddress: credentials.walletAddress as string,
      };
    },
  })
);

export const {
  handlers,
  auth,
  signIn,
  signOut,
} = NextAuth({
  providers,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: UserRole }).role ?? ('student' as UserRole);
        token.walletAddress = (user as { walletAddress?: string | null }).walletAddress ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? '';
        session.user.role = token.role as UserRole;
        session.user.walletAddress = token.walletAddress as string | null;
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
  },
});
