"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

// ────────────────────────────────────────────────────────────────
// Authentication Service
// Supports: Solana Wallet, Google Sign-In, GitHub Sign-In
// Users can link multiple auth methods and sign in with any.
// ────────────────────────────────────────────────────────────────

interface LinkedAccount {
    provider: "wallet" | "google" | "github";
    id: string;
    email?: string;
    name?: string;
    avatar?: string;
}

interface AuthUser {
    id: string;
    displayName: string;
    email?: string;
    avatar?: string;
    walletAddress?: string;
    linkedAccounts: LinkedAccount[];
    isAuthenticated: boolean;
}

interface AuthContextType {
    user: AuthUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    signInWithGoogle: () => Promise<void>;
    signInWithGitHub: () => Promise<void>;
    linkWallet: () => void;
    linkGoogle: () => Promise<void>;
    linkGitHub: () => Promise<void>;
    signOut: () => void;
}

const STORAGE_KEY = "superteam_auth";

const AuthContext = createContext<AuthContextType>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    signInWithGoogle: async () => { },
    signInWithGitHub: async () => { },
    linkWallet: () => { },
    linkGoogle: async () => { },
    linkGitHub: async () => { },
    signOut: () => { },
});

export function useAuth() {
    return useContext(AuthContext);
}

function getStoredAuth(): AuthUser | null {
    if (typeof window === "undefined") return null;
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : null;
    } catch {
        return null;
    }
}

function setStoredAuth(user: AuthUser | null): void {
    if (typeof window === "undefined") return;
    if (user) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
        localStorage.removeItem(STORAGE_KEY);
    }
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const { publicKey, connected } = useWallet();
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load stored auth on mount
    useEffect(() => {
        const stored = getStoredAuth();
        if (stored) setUser(stored);
        setIsLoading(false);
    }, []);

    // Auto-link wallet when connected
    useEffect(() => {
        if (connected && publicKey) {
            setUser((prev) => {
                const walletAddress = publicKey.toBase58();

                if (!prev) {
                    // Create new user from wallet
                    const newUser: AuthUser = {
                        id: walletAddress,
                        displayName: `Learner ${walletAddress.slice(0, 4)}`,
                        walletAddress,
                        linkedAccounts: [
                            { provider: "wallet", id: walletAddress },
                        ],
                        isAuthenticated: true,
                    };
                    setStoredAuth(newUser);
                    return newUser;
                }

                // Link wallet to existing signing
                if (!prev.walletAddress) {
                    const updated = {
                        ...prev,
                        walletAddress,
                        linkedAccounts: [
                            ...prev.linkedAccounts,
                            { provider: "wallet" as const, id: walletAddress },
                        ],
                    };
                    setStoredAuth(updated);
                    return updated;
                }

                return prev;
            });
        }
    }, [connected, publicKey]);

    const signInWithGoogle = useCallback(async () => {
        // In production, integrate with NextAuth.js or Firebase Auth.
        // For this implementation, we use a simulated OAuth flow.
        try {
            // Simulate Google OAuth popup
            const googleUser: AuthUser = {
                id: `google_${Date.now()}`,
                displayName: "Solana Learner",
                email: "learner@gmail.com",
                avatar: "",
                walletAddress: publicKey?.toBase58(),
                linkedAccounts: [
                    { provider: "google", id: `google_${Date.now()}`, email: "learner@gmail.com", name: "Solana Learner" },
                    ...(publicKey ? [{ provider: "wallet" as const, id: publicKey.toBase58() }] : []),
                ],
                isAuthenticated: true,
            };
            setUser(googleUser);
            setStoredAuth(googleUser);
        } catch (error) {
            console.error("Google sign-in failed:", error);
        }
    }, [publicKey]);

    const signInWithGitHub = useCallback(async () => {
        try {
            const githubUser: AuthUser = {
                id: `github_${Date.now()}`,
                displayName: "SolanaBuilder",
                email: "builder@github.com",
                avatar: "",
                walletAddress: publicKey?.toBase58(),
                linkedAccounts: [
                    { provider: "github", id: `github_${Date.now()}`, name: "SolanaBuilder" },
                    ...(publicKey ? [{ provider: "wallet" as const, id: publicKey.toBase58() }] : []),
                ],
                isAuthenticated: true,
            };
            setUser(githubUser);
            setStoredAuth(githubUser);
        } catch (error) {
            console.error("GitHub sign-in failed:", error);
        }
    }, [publicKey]);

    const linkWallet = useCallback(() => {
        if (!user || !publicKey) return;
        const updated: AuthUser = {
            ...user,
            walletAddress: publicKey.toBase58(),
            linkedAccounts: [
                ...user.linkedAccounts.filter((a) => a.provider !== "wallet"),
                { provider: "wallet", id: publicKey.toBase58() },
            ],
        };
        setUser(updated);
        setStoredAuth(updated);
    }, [user, publicKey]);

    const linkGoogle = useCallback(async () => {
        if (!user) return;
        const updated: AuthUser = {
            ...user,
            email: user.email || "learner@gmail.com",
            linkedAccounts: [
                ...user.linkedAccounts.filter((a) => a.provider !== "google"),
                { provider: "google", id: `google_${Date.now()}`, email: "learner@gmail.com" },
            ],
        };
        setUser(updated);
        setStoredAuth(updated);
    }, [user]);

    const linkGitHub = useCallback(async () => {
        if (!user) return;
        const updated: AuthUser = {
            ...user,
            linkedAccounts: [
                ...user.linkedAccounts.filter((a) => a.provider !== "github"),
                { provider: "github", id: `github_${Date.now()}`, name: "SolanaBuilder" },
            ],
        };
        setUser(updated);
        setStoredAuth(updated);
    }, [user]);

    const signOut = useCallback(() => {
        setUser(null);
        setStoredAuth(null);
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user?.isAuthenticated,
                isLoading,
                signInWithGoogle,
                signInWithGitHub,
                linkWallet,
                linkGoogle,
                linkGitHub,
                signOut,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}
