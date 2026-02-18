import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import { cookies } from "next/headers";
import {
  findOrCreateByOAuth,
  linkOAuth,
  findByWallet,
} from "@/lib/server/account-linking";
import {
  getWalletSessionCookieName,
  verifyAccessToken,
} from "@/lib/server/wallet-auth";

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

export function getConfiguredProviders(): {
  google: boolean;
  github: boolean;
} {
  return {
    google: !!(
      process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ),
    github: !!(
      process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
    ),
  };
}

async function getWalletAddressFromCookie(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(getWalletSessionCookieName())?.value;
    const payload = await verifyAccessToken(token);
    return payload?.walletAddress ?? null;
  } catch {
    return null;
  }
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

        // Check if this OAuth sign-in should be linked to an existing wallet session
        const walletAddress = await getWalletAddressFromCookie();
        if (walletAddress) {
          const existing = findByWallet(walletAddress);
          if (existing) {
            linkOAuth(existing.id, provider, providerId, email);
            token.userId = existing.id;
            token.walletAddress = walletAddress;
          } else {
            const linked = findOrCreateByOAuth(provider, providerId, email);
            token.userId = linked.id;
            token.walletAddress = linked.walletAddress ?? undefined;
          }
        } else {
          const linked = findOrCreateByOAuth(provider, providerId, email);
          token.userId = linked.id;
          token.walletAddress = linked.walletAddress ?? undefined;
        }

        token.email = email;
        token.provider = provider;
        token.providerId = providerId;
        const githubLogin = (profile as Record<string, unknown>).login as
          | string
          | undefined;
        token.name = profile.name ?? githubLogin ?? email.split("@")[0];
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
