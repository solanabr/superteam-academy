import type { NextAuthOptions } from "next-auth";
import type { JWT } from "next-auth/jwt";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";

const backendBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/v1";

type WalletVerifyResponse = {
  token: string;
  user: {
    id: string;
    username: string;
    displayName: string;
  };
};

type OAuthBootstrapResponse = {
  token: string;
  user: {
    id: string;
    username: string;
    displayName: string;
  };
};

function withWalletToken(
  token: JWT,
  user: {
    id: string;
    name?: string | null;
    backendToken?: string;
    walletAddress?: string;
  },
): JWT {
  return {
    ...token,
    userId: user.id,
    ...(user.backendToken ? { backendToken: user.backendToken } : {}),
    ...(user.walletAddress ? { walletAddress: user.walletAddress } : {}),
    ...(user.name ? { name: user.name } : {}),
  };
}

const providers: NonNullable<NextAuthOptions["providers"]> = [
  CredentialsProvider({
    id: "wallet",
    name: "Wallet",
    credentials: {
      walletAddress: { label: "Wallet Address", type: "text" },
      signature: { label: "Signature", type: "text" },
    },
    async authorize(credentials) {
      const walletAddress = credentials?.walletAddress;
      const signature = credentials?.signature;

      if (!walletAddress || !signature) {
        return null;
      }

      const response = await fetch(`${backendBaseUrl}/auth/wallet/verify`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ walletAddress, signature }),
      });

      if (!response.ok) {
        return null;
      }

      const payload = (await response.json()) as WalletVerifyResponse;

      return {
        id: payload.user.id,
        name: payload.user.displayName,
        backendToken: payload.token,
        walletAddress,
      };
    },
  }),
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  );
}

if (process.env.GITHUB_ID && process.env.GITHUB_SECRET) {
  providers.push(
    GitHubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
  );
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers,
  pages: {
    signIn: "/settings",
  },
  callbacks: {
    async signIn() {
      return true;
    },
    async jwt({ token, user, account }) {
      if (user && account?.provider === "wallet") {
        const walletPayload = {
          id: user.id,
          ...(user.name !== undefined ? { name: user.name } : {}),
          ...((user as { backendToken?: string }).backendToken
            ? { backendToken: (user as { backendToken?: string }).backendToken }
            : {}),
          ...((user as { walletAddress?: string }).walletAddress
            ? {
                walletAddress: (user as { walletAddress?: string })
                  .walletAddress,
              }
            : {}),
        };
        const nextToken = withWalletToken(token, {
          ...walletPayload,
        });
        return nextToken;
      }

      if (
        user &&
        account &&
        (account.provider === "google" || account.provider === "github")
      ) {
        if (!account.providerAccountId) {
          return token;
        }

        const previousBackendToken =
          typeof token.backendToken === "string"
            ? token.backendToken
            : undefined;

        const response = await fetch(`${backendBaseUrl}/auth/oauth/bootstrap`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            ...(user.email ? { email: user.email } : {}),
            ...(user.name ? { displayName: user.name } : {}),
            ...(user.image ? { avatarUrl: user.image } : {}),
            ...(previousBackendToken
              ? { linkSessionToken: previousBackendToken }
              : {}),
          }),
        });

        if (response.ok) {
          const payload = (await response.json()) as OAuthBootstrapResponse;
          token.userId = payload.user.id;
          token.backendToken = payload.token;
          token.oauthProvider = account.provider;
          token.oauthProviderAccountId = account.providerAccountId;
          token.name = user.name ?? payload.user.displayName;
          if (user.email) {
            token.email = user.email;
          }
        } else {
          if (!previousBackendToken) {
            delete token.backendToken;
            token.userId = user.id;
          }
          token.oauthProvider = account.provider;
          token.oauthProviderAccountId = account.providerAccountId;
          if (user.name) {
            token.name = user.name;
          }
          if (user.email) {
            token.email = user.email;
          }
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id =
          (token.userId as string | undefined) ?? token.sub ?? "";
        if (token.walletAddress) {
          session.user.walletAddress = token.walletAddress as string;
        } else {
          delete session.user.walletAddress;
        }
      }

      if (token.backendToken) {
        session.backendToken = token.backendToken as string;
      } else {
        delete session.backendToken;
      }

      if (token.oauthProvider) {
        session.oauthProvider = token.oauthProvider as string;
      } else {
        delete session.oauthProvider;
      }

      if (token.oauthProviderAccountId) {
        session.oauthProviderAccountId = token.oauthProviderAccountId as string;
      } else {
        delete session.oauthProviderAccountId;
      }

      return session;
    },
  },
};
