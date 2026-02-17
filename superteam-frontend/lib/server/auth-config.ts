import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import { findOrCreateByOAuth } from "@/lib/server/account-linking";

function buildProviders() {
  const providers: NextAuthConfig["providers"] = [];

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.push(
      Google({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      }),
    );
  }

  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    providers.push(
      GitHub({
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
      }),
    );
  }

  return providers;
}

export const authConfig: NextAuthConfig = {
  providers: buildProviders(),
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/auth/signin",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        const provider = account.provider as "google" | "github";
        const providerId = account.providerAccountId;
        const email = profile.email ?? "";

        const linked = findOrCreateByOAuth(provider, providerId, email);

        token.userId = linked.id;
        token.email = email;
        token.provider = provider;
        token.providerId = providerId;
        const githubLogin = (profile as Record<string, unknown>).login as
          | string
          | undefined;
        token.name = profile.name ?? githubLogin ?? email.split("@")[0];
        token.walletAddress = linked.walletAddress ?? undefined;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = (token.userId as string) ?? token.sub ?? "";
        session.user.email = (token.email as string) ?? "";
        session.user.name = (token.name as string) ?? "";
        (session.user as any).provider = token.provider;
        (session.user as any).walletAddress = token.walletAddress;
      }
      return session;
    },
  },
};
