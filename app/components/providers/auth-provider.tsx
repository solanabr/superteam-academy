"use client";

import {
    createContext,
    useContext,
    useEffect,
    useCallback,
    useState,
    type ReactNode,
} from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { useWallet } from "@solana/wallet-adapter-react";
import bs58 from "bs58";

interface AuthUser {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    walletAddress?: string | null;
    username?: string | null;
    isOnboarded?: boolean;
}

interface AuthContextValue {
    /** The merged user from NextAuth session */
    user: AuthUser | null;
    /** True if user has an active NextAuth session */
    isAuthenticated: boolean;
    /** True while session is loading */
    isLoading: boolean;
    /** The linked wallet address (from session) */
    walletAddress: string | null;
    /** Whether a wallet is linked to this account */
    isWalletLinked: boolean;
    /** Sign in with a provider */
    signInWith: (provider: "google" | "github" | "wallet") => Promise<void>;
    /** Sign out completely */
    handleSignOut: () => Promise<void>;
    /** Link the currently connected Solana wallet to the session */
    linkWallet: () => Promise<boolean>;
    /** Update the session after onboarding */
    updateSession: (data: Partial<AuthUser>) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
    return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const { data: session, status, update } = useSession();
    const wallet = useWallet();
    const [isLinking, setIsLinking] = useState(false);

    const isAuthenticated = status === "authenticated" && !!session?.user;
    const isLoading = status === "loading";

    const user: AuthUser | null = isAuthenticated
        ? {
            id: session.user.id,
            name: session.user.name,
            email: session.user.email,
            image: session.user.image,
            walletAddress: session.user.walletAddress ?? null,
            username: session.user.username ?? null,
            isOnboarded: session.user.isOnboarded ?? false,
        }
        : null;

    const walletAddress = user?.walletAddress ?? null;
    const isWalletLinked = !!walletAddress;

    const signInWith = useCallback(
        async (provider: "google" | "github" | "wallet") => {
            if (provider === "wallet") {
                // Wallet sign-in is handled by the WalletSignInFlow component
                // which calls signIn("solana-wallet", ...) with the signature
                return;
            }
            await signIn(provider, { callbackUrl: "/dashboard" });
        },
        []
    );

    const handleSignOut = useCallback(async () => {
        if (wallet.connected) {
            await wallet.disconnect();
        }
        await signOut({ callbackUrl: "/" });
    }, [wallet]);

    const linkWallet = useCallback(async (): Promise<boolean> => {
        if (!wallet.publicKey || !wallet.signMessage || isLinking) return false;
        setIsLinking(true);

        try {
            const message = `Superteam Academy — Link Wallet\nWallet: ${wallet.publicKey.toBase58()}\nTimestamp: ${Date.now()}`;
            const messageBytes = new TextEncoder().encode(message);
            const signatureBytes = await wallet.signMessage(messageBytes);
            const signature = bs58.encode(signatureBytes);

            const res = await fetch("/api/auth/link-wallet", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    walletAddress: wallet.publicKey.toBase58(),
                    signature,
                    message,
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                console.error("Link wallet failed:", err.error);
                return false;
            }

            const data = await res.json();

            // Update the NextAuth session with the wallet address
            await update({ walletAddress: data.walletAddress });
            return true;
        } catch (error) {
            console.error("Link wallet error:", error);
            return false;
        } finally {
            setIsLinking(false);
        }
    }, [wallet.publicKey, wallet.signMessage, wallet.connected, isLinking, update]);

    const updateSession = useCallback(
        async (data: Partial<AuthUser>) => {
            await update(data);
        },
        [update]
    );

    // Track whether we've already attempted auto-link this session
    // This prevents the wallet popup from reopening if the user declines
    const hasAttemptedAutoLink = useState(false);

    // Auto-link wallet ONLY after onboarding is done, and only once per session
    // This prevents the wallet signature popup from overlapping with the onboarding dialog
    // and from reopening if the user closes/declines it
    useEffect(() => {
        if (
            isAuthenticated &&
            user?.isOnboarded &&
            !isWalletLinked &&
            wallet.connected &&
            wallet.publicKey &&
            !isLinking &&
            !hasAttemptedAutoLink[0]
        ) {
            hasAttemptedAutoLink[1](true);
            const timer = setTimeout(() => {
                linkWallet();
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [isAuthenticated, user?.isOnboarded, isWalletLinked, wallet.connected, wallet.publicKey, isLinking, linkWallet, hasAttemptedAutoLink]);

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated,
                isLoading,
                walletAddress,
                isWalletLinked,
                signInWith,
                handleSignOut,
                linkWallet,
                updateSession,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}
