import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import type { NextAuthConfig } from "next-auth";
import { cookies } from "next/headers";
import { getAdminClient } from "@/lib/supabase/admin";
import { resolveUserOnSignIn } from "@/lib/auth/account-linking";

export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
    }),
    GitHub({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
    // Wallet auth via SIWS (Sign In With Solana)
    Credentials({
      id: "solana-wallet",
      name: "Solana Wallet",
      credentials: {
        publicKey: { label: "Public Key", type: "text" },
        signature: { label: "Signature", type: "text" },
        message: { label: "Message", type: "text" },
      },
      async authorize(credentials) {
        if (
          !credentials?.publicKey ||
          !credentials?.signature ||
          !credentials?.message
        ) {
          return null;
        }

        try {
          // In production, verify the signature using @solana/web3.js
          const publicKey = credentials.publicKey as string;

          return {
            id: publicKey,
            name: `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`,
            image: null,
            email: null,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async jwt({ token, user, account, profile: oauthProfile, trigger }) {
      // Re-fetch profile when the client calls update() after profile/avatar change
      if (trigger === "update" && token.userId) {
        const db = getAdminClient();
        if (db) {
          const { data } = await db
            .from("profiles")
            .select("display_name, avatar_url, email")
            .eq("id", token.userId as string)
            .single();
          if (data) {
            if (data.display_name) token.name = data.display_name;
            if (data.email) token.email = data.email;
            if (data.avatar_url) token.picture = data.avatar_url;
          }
        }
        return token;
      }

      if (trigger === "signIn" && user && account) {
        const db = getAdminClient();

        if (db) {
          try {
            const cookieStore = await cookies();
            const themeCookie = cookieStore.get("theme")?.value;
            const localeCookie = cookieStore.get("NEXT_LOCALE")?.value;

            // For account linking: token.userId may be lost when Auth.js
            // creates a fresh JWT for Credentials sign-ins. Fall back to the
            // link-intent cookie set by /api/auth/link-intent before the
            // linking signIn() call.
            let existingUserId = token.userId as string | undefined;
            if (!existingUserId) {
              existingUserId =
                cookieStore.get("link-account-to")?.value ?? undefined;
            }
            // Clear the linking cookie after reading it
            if (cookieStore.get("link-account-to")) {
              cookieStore.delete("link-account-to");
            }

            const result = await resolveUserOnSignIn(
              db,
              existingUserId,
              { name: user.name, email: user.email, image: user.image },
              {
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                type: account.type,
                access_token: account.access_token,
                refresh_token: account.refresh_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
              },
              {
                preferredTheme:
                  themeCookie &&
                    ["dark", "light", "brasil"].includes(themeCookie)
                    ? themeCookie
                    : undefined,
                preferredLanguage:
                  localeCookie && ["en", "pt-BR", "es"].includes(localeCookie)
                    ? localeCookie
                    : undefined,
              },
            );

            token.userId = result.profileId;
            token.linkedAccounts = result.linkedAccounts;
            token.walletAddress = result.walletAddress;

            // Always use canonical profile data from DB so that linking
            // a wallet doesn't overwrite name/email/image with wallet-
            // derived values, and linking OAuth upgrades wallet-only profiles.
            if (result.name) token.name = result.name;
            if (result.email) token.email = result.email;
            if (result.image) token.picture = result.image;

            // Store GitHub username when connecting GitHub
            if (account.provider === "github" && oauthProfile) {
              const ghUsername = (oauthProfile as Record<string, unknown>)
                .login as string | undefined;
              if (ghUsername) {
                const { data: current } = await db
                  .from("profiles")
                  .select("social_links")
                  .eq("id", result.profileId)
                  .single();
                const socialLinks = {
                  ...(current?.social_links ?? {}),
                  github: ghUsername,
                };
                await db
                  .from("profiles")
                  .update({ social_links: socialLinks })
                  .eq("id", result.profileId);
              }
            }

            // Store wallet address when connecting wallet
            if (
              account.provider === "solana-wallet" &&
              account.providerAccountId
            ) {
              await db
                .from("profiles")
                .update({ wallet_address: account.providerAccountId })
                .eq("id", result.profileId);
              token.walletAddress = account.providerAccountId;
            }
          } catch (err) {
            console.error("Account linking error:", err);
            // Fallback: use provider's user id directly
            token.userId = user.id;
          }
        } else {
          // Mock mode — no DB
          token.userId = user.id;
          const linked = (token.linkedAccounts as string[]) ?? [];
          if (!linked.includes(account.provider)) {
            linked.push(account.provider);
          }
          token.linkedAccounts = linked;
        }

        token.provider = account.provider;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
        // Restore canonical profile fields from the JWT so the session
        // always reflects the DB profile, not the last-linked provider.
        if (token.name) session.user.name = token.name as string;
        if (token.email) session.user.email = token.email as string;
        if (token.picture) session.user.image = token.picture as string;
      }
      const s = session as unknown as Record<string, unknown>;
      s.walletAddress = token.walletAddress as string | undefined;
      s.linkedAccounts = (token.linkedAccounts as string[]) ?? [];
      s.provider = token.provider as string;
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.AUTH_SECRET,
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
