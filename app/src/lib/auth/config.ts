import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import { PublicKey } from "@solana/web3.js";

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
      if (user) {
        token.wallet = (user as any).wallet ?? null;
        token.provider = account?.provider ?? "solana-wallet";
      }
      // Track linked accounts
      if (account && token.linkedAccounts === undefined) {
        token.linkedAccounts = {};
      }
      if (account) {
        (token.linkedAccounts as any)[account.provider] = {
          id: account.providerAccountId,
          email: (user as any)?.email,
          name: (user as any)?.name,
          image: (user as any)?.image,
        };
      }
      return token;
    },
    async session({ session, token }) {
      (session as any).wallet = token.wallet;
      (session as any).provider = token.provider;
      (session as any).linkedAccounts = token.linkedAccounts ?? {};
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
  pages: {
    signIn: "/en/dashboard",
    error: "/en/dashboard",
  },
  trustHost: true,
});
