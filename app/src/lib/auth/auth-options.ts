import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { verifySiws } from "./verify-siws";
import { prisma } from "@/lib/db/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "solana",
      name: "Solana",
      credentials: {
        walletAddress: { label: "Wallet", type: "text" },
        signature: { label: "Signature", type: "text" },
        nonce: { label: "Nonce", type: "text" },
        message: { label: "Message", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials) return null;

        const valid = verifySiws({
          walletAddress: credentials.walletAddress,
          signature: credentials.signature,
          nonce: credentials.nonce,
          message: credentials.message,
        });

        if (!valid) return null;

        const user = await prisma.user.upsert({
          where: { walletAddress: credentials.walletAddress },
          update: {},
          create: { walletAddress: credentials.walletAddress },
        });

        return {
          id: user.id,
          name: user.displayName ?? user.walletAddress.slice(0, 8),
          email: user.walletAddress,
        };
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  session: { strategy: "jwt", maxAge: 7 * 24 * 60 * 60 },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.sub = user.id;
        if (account?.provider === "google") {
          token.walletAddress = undefined;
          const existing = await prisma.user.findFirst({
            where: { walletAddress: user.email ?? "" },
          });
          if (existing) {
            token.sub = existing.id;
          } else {
            const created = await prisma.user.create({
              data: {
                walletAddress: user.email ?? `google-${user.id}`,
                displayName: user.name ?? undefined,
              },
            });
            token.sub = created.id;
          }
        } else {
          token.walletAddress = user.email ?? undefined;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.walletAddress = token.walletAddress as string | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: "/sign-in",
  },
};
