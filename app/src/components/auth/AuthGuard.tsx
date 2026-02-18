"use client";

import { useEffect, useRef, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth/solana";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/user-store";
import { OnboardingModal } from "./OnboardingModal";

/**
 * Client-side auth guard. Wraps protected pages.
 * - Shows loading spinner while Privy initializes
 * - Redirects to landing page if not authenticated
 * - Polls for wallet address after OAuth login (wallet takes 1-3s to initialize)
 * - Shows one-time onboarding modal if profile.onboardingComplete is not set
 * - Replaces browser history to prevent back-button exploit
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
    const { ready, authenticated, user: privyUser } = usePrivy();
    const { wallets } = useWallets();
    const router = useRouter();

    const user = useUserStore((s) => s.user);
    const isLoading = useUserStore((s) => s.isLoading);
    const fetchUser = useUserStore((s) => s.fetchUser);

    // Discover wallet address — may be undefined initially after OAuth login
    const walletAddress =
        privyUser?.wallet?.address ??
        privyUser?.linkedAccounts?.find((a) => a.type === "wallet")?.address ??
        wallets?.[0]?.address;

    const [onboardingDone, setOnboardingDone] = useState(false);

    // Redirect unauthenticated users
    useEffect(() => {
        if (ready && !authenticated) {
            window.history.replaceState(null, "", "/");
            router.replace("/");
        }
    }, [ready, authenticated, router]);

    // Fetch user — fires whenever walletAddress becomes available
    // This handles the OAuth race where wallet initializes 1-3s after authentication
    useEffect(() => {
        if (!authenticated || !walletAddress || isLoading) return;
        if (user && user.walletAddress === walletAddress) return; // already loaded
        fetchUser(walletAddress);
    }, [authenticated, walletAddress, user, isLoading, fetchUser]);

    // Polling fallback: if authenticated but wallet not yet available, retry every 500ms
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    useEffect(() => {
        if (!authenticated || walletAddress || !ready) {
            if (pollRef.current) {
                clearInterval(pollRef.current);
                pollRef.current = null;
            }
            return;
        }

        // Wallet not ready yet — start polling
        let attempts = 0;
        pollRef.current = setInterval(() => {
            attempts++;
            const addr =
                privyUser?.wallet?.address ??
                privyUser?.linkedAccounts?.find((a) => a.type === "wallet")?.address ??
                wallets?.[0]?.address;

            if (addr) {
                clearInterval(pollRef.current!);
                pollRef.current = null;
                fetchUser(addr);
            } else if (attempts >= 20) {
                // Give up after 10s
                clearInterval(pollRef.current!);
                pollRef.current = null;
            }
        }, 500);

        return () => {
            if (pollRef.current) {
                clearInterval(pollRef.current);
                pollRef.current = null;
            }
        };
    }, [authenticated, walletAddress, ready, privyUser, wallets, fetchUser]);

    // Still loading Privy
    if (!ready) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-void">
                <div className="flex flex-col items-center gap-4">
                    <div className="size-10 rounded-full border-2 border-solana/30 border-t-solana animate-spin" />
                    <span className="text-sm font-mono text-text-muted">Authenticating...</span>
                </div>
            </div>
        );
    }

    // Not authenticated — redirect is happening via useEffect
    if (!authenticated) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-void">
                <div className="flex flex-col items-center gap-4">
                    <div className="size-10 rounded-full border-2 border-solana/30 border-t-solana animate-spin" />
                    <span className="text-sm font-mono text-text-muted">Redirecting...</span>
                </div>
            </div>
        );
    }

    // Wallet not yet initialized (OAuth race) or user data loading
    if (!walletAddress || isLoading || (!user && walletAddress)) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-void">
                <div className="flex flex-col items-center gap-4">
                    <div className="size-10 rounded-full border-2 border-solana/30 border-t-solana animate-spin" />
                    <span className="text-sm font-mono text-text-muted">
                        {!walletAddress ? "Setting up your account..." : "Loading profile..."}
                    </span>
                </div>
            </div>
        );
    }

    // Check onboarding — show modal if not completed
    const profile = user?.profile as any;
    if (user && !profile?.onboardingComplete && !onboardingDone) {
        return (
            <OnboardingModal
                walletAddress={user.walletAddress}
                onComplete={() => setOnboardingDone(true)}
            />
        );
    }

    return <>{children}</>;
}
