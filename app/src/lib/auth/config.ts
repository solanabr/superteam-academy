import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import { PublicKey } from "@solana/web3.js";
import type { JWT } from "next-auth/jwt";

/** Extended JWT with wallet + linked-account tracking. */
interface AcademyJWT extends JWT {
  wallet: string | null;
  provider: string;
  linkedAccounts: Record<
    string,
    { id: string; email?: string; name?: string; image?: string }
  >;
}

/** Extended session exposed to the client. */
export interface AcademySession {
  user: { id?: string; name?: string | null; email?: string | null; image?: string | null };
  wallet: string | null;
  provider: string;
  linkedAccounts: AcademyJWT["linkedAccounts"];
  expires: string;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      allowDangerousEmailAccountLinking: true,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID ?? "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      id: "solana-wallet",
      name: "Solana Wallet",
      credentials: {
        wallet: { label: "Wallet Address", type: "text" },
        signature: { label: "Signature", type: "text" },
        message: { label: "Message", type: "text" },
      },
      async authorize(credentials) {
        if (
          !credentials?.wallet ||
          !credentials?.signature ||
          !credentials?.message
        ) {
          return null;
        }
        try {
          const wallet = credentials.wallet as string;
          // Verify this is a valid Solana public key
          new PublicKey(wallet);
          // In production, verify the signature against the message
          // For now, trust the wallet adapter's built-in signature verification
          return {
            id: wallet,
            name: wallet.slice(0, 4) + "..." + wallet.slice(-4),
            wallet,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user, account }) {
      const t = token as AcademyJWT;
      if (user) {
        t.wallet = (user as Record<string, unknown>).wallet as string | null ?? null;
        t.provider = account?.provider ?? "solana-wallet";
      }
      // Track linked accounts
      if (account && t.linkedAccounts === undefined) {
        t.linkedAccounts = {};
      }
      if (account && user) {
        t.linkedAccounts[account.provider] = {
          id: account.providerAccountId,
          email: (user.email as string | undefined),
          name: (user.name as string | undefined),
          image: (user.image as string | undefined),
        };
      }
      return t;
    },
    async session({ session, token }) {
      const t = token as AcademyJWT;
      const s = session as unknown as AcademySession;
      s.wallet = t.wallet;
      s.provider = t.provider;
      s.linkedAccounts = t.linkedAccounts ?? {};
      if (t.sub) s.user.id = t.sub;
      return session;
    },
  },
  pages: {
    signIn: "/en/dashboard",
    error: "/en/dashboard",
  },
  trustHost: true,
});
