import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import { PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import { sign } from "crypto";

import type { NextAuthConfig } from "next-auth";

/**
 * Superteam Academy — NextAuth v5 Configuration
 *
 * Supports three sign-in methods:
 * 1. Google OAuth
 * 2. GitHub OAuth
 * 3. Wallet (Solana signature-based credentials)
 *
 * JWT session strategy — no database required for MVP.
 * Extended token carries: walletAddress, username, isOnboarded, avatar.
 */

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            name?: string | null;
            email?: string | null;
            image?: string | null;
            walletAddress?: string | null;
            username?: string | null;
            isOnboarded?: boolean;
        };
    }
}

declare module "next-auth" {
    interface User {
        walletAddress?: string | null;
        username?: string | null;
        isOnboarded?: boolean;
    }
}

// Extend the JWT type
declare module "next-auth" {
    interface JWT {
        walletAddress?: string | null;
        username?: string | null;
        isOnboarded?: boolean;
    }
}

const config: NextAuthConfig = {
    providers: [
        Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
            allowDangerousEmailAccountLinking: true,
        }),
        GitHub({
            clientId: process.env.AUTH_GITHUB_ID,
            clientSecret: process.env.AUTH_GITHUB_SECRET,
            allowDangerousEmailAccountLinking: true,
        }),
        Credentials({
            id: "solana-wallet",
            name: "Solana Wallet",
            credentials: {
                walletAddress: { label: "Wallet Address", type: "text" },
                signature: { label: "Signature", type: "text" },
                message: { label: "Message", type: "text" },
            },
            async authorize(credentials) {
                try {
                    const { walletAddress, signature, message } = credentials as {
                        walletAddress: string;
                        signature: string;
                        message: string;
                    };

                    if (!walletAddress || !signature || !message) return null;

                    // Verify the signature
                    const publicKey = new PublicKey(walletAddress);
                    const messageBytes = new TextEncoder().encode(message);
                    const signatureBytes = bs58.decode(signature);

                    // Ed25519 signature verification
                    const { verify } = await import("@noble/ed25519");
                    const isValid = await verify(signatureBytes, messageBytes, publicKey.toBytes());

                    if (!isValid) return null;

                    // Check the message contains a recent timestamp (within 5 min)
                    const timestampMatch = message.match(/Timestamp: (\d+)/);
                    if (timestampMatch) {
                        const ts = parseInt(timestampMatch[1], 10);
                        const now = Date.now();
                        if (Math.abs(now - ts) > 5 * 60 * 1000) return null; // Expired
                    }

                    return {
                        id: walletAddress,
                        name: `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`,
                        walletAddress,
                        isOnboarded: false,
                    };
                } catch {
                    return null;
                }
            },
        }),
    ],
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    pages: {
        signIn: "/", // Redirect to landing, our custom UI handles sign-in
    },
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            // Initial sign-in — persist custom fields
            if (user) {
                token.walletAddress = user.walletAddress ?? null;
                token.username = user.username ?? null;
                token.isOnboarded = user.isOnboarded ?? false;
            }

            // Session update (e.g., after linking wallet or onboarding)
            if (trigger === "update" && session) {
                if (session.walletAddress !== undefined) {
                    token.walletAddress = session.walletAddress;
                }
                if (session.username !== undefined) {
                    token.username = session.username;
                }
                if (session.isOnboarded !== undefined) {
                    token.isOnboarded = session.isOnboarded;
                }
                if (session.image !== undefined) {
                    token.picture = session.image;
                }
            }

            return token;
        },
        async session({ session, token }) {
            session.user.id = token.sub ?? "";
            session.user.walletAddress = (token.walletAddress as string) ?? null;
            session.user.username = (token.username as string) ?? null;
            session.user.isOnboarded = (token.isOnboarded as boolean) ?? false;
            return session;
        },
    },
};

export const { handlers, auth, signIn, signOut } = NextAuth(config);
