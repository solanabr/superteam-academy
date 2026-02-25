import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import { PublicKey } from "@solana/web3.js";
import { verifyAsync } from "@noble/ed25519";
import type { JWT } from "next-auth/jwt";
import {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
} from "@/lib/env";
import { consumeNonce } from "@/lib/auth/nonce-store";
import { SIGN_IN_MESSAGE_PREFIX } from "@/lib/auth/message";

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

/** Which OAuth providers are actually configured (have credentials). */
export const configuredProviders = {
  google: !!(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET),
  github: !!(GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET),
};

// Build providers list dynamically — only include OAuth providers with credentials
const providers: Provider[] = [];

if (configuredProviders.google) {
  providers.push(
    Google({
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      // SECURITY: Required for multi-provider account linking (wallet + OAuth).
      // Risk: if an attacker controls an email at one provider, they could link
      // to an existing account at another provider sharing that email.
      // Mitigations: (1) Google verifies email ownership before returning it,
      // (2) primary auth is wallet-based (not email), (3) linked accounts are
      // additive metadata — no elevated privileges from linking.
      allowDangerousEmailAccountLinking: true,
    }),
  );
}

if (configuredProviders.github) {
  providers.push(
    GitHub({
      clientId: GITHUB_CLIENT_ID,
      clientSecret: GITHUB_CLIENT_SECRET,
      // SECURITY: Same rationale as Google above. GitHub also verifies emails.
      allowDangerousEmailAccountLinking: true,
    }),
  );
}

providers.push(
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
        const message = credentials.message as string;
        const signatureB64 = credentials.signature as string;

        // Validate pubkey format
        const pubkey = new PublicKey(wallet);

        // Validate message format and extract nonce
        if (!message.startsWith(SIGN_IN_MESSAGE_PREFIX)) {
          console.error("[auth] Invalid message format");
          return null;
        }

        const nonceMatch = message.match(/Nonce: ([0-9a-f-]{36})/);
        if (!nonceMatch) {
          console.error("[auth] No nonce found in message");
          return null;
        }

        // Consume nonce (single-use, TTL-enforced)
        if (!consumeNonce(nonceMatch[1])) {
          console.error("[auth] Invalid or expired nonce");
          return null;
        }

        // Verify ed25519 signature
        const messageBytes = new TextEncoder().encode(message);
        const signatureBytes = Buffer.from(signatureB64, "base64");
        const isValid = await verifyAsync(signatureBytes, messageBytes, pubkey.toBytes());

        if (!isValid) {
          console.error("[auth] Invalid wallet signature");
          return null;
        }

        return {
          id: wallet,
          name: wallet.slice(0, 4) + "..." + wallet.slice(-4),
          wallet,
        };
      } catch (error) {
        console.error("[auth] Wallet auth failed:", error);
        return null;
      }
    },
  }),
);

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers,
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user, account }) {
      const t = token as AcademyJWT;
      if (user) {
        t.wallet = (user as Record<string, unknown>).wallet as string | null ?? null;
        t.provider = account?.provider ?? "solana-wallet";
      }
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
    signIn: "/auth/signin",
    error: "/auth/signin",
  },
  trustHost: true,
});
