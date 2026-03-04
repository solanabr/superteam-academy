"use client";

import { useEffect, useRef, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth/solana";
import { useRouter, usePathname } from "next/navigation";
import { useUserStore } from "@/store/user-store";
import { OnboardingModal } from "./OnboardingModal";
import { Button } from "../ui/button";
import { useTranslations } from "next-intl";
import { AlertCircle, Loader2, RefreshCw } from "lucide-react";

/**
 * Client-side auth guard. Wraps protected pages.
 * - Shows loading spinner while Privy initializes
 * - Redirects to landing page if not authenticated (unless public path)
 * - Polls for wallet address after OAuth login (wallet takes 1-30s to initialize)
 * - Shows one-time onboarding modal if profile.onboardingComplete is not set
 * - Replaces browser history to prevent back-button exploit
 * - Has a hard timeout to prevent infinite loading for OAuth embedded wallet creation
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
    const { ready, authenticated, user: privyUser } = usePrivy();
    const { wallets } = useWallets();
    const router = useRouter();
    const pathname = usePathname();
    const t = useTranslations("auth");

    const user = useUserStore((s) => s.user);
    const isLoading = useUserStore((s) => s.isLoading);
    const fetchUser = useUserStore((s) => s.fetchUser);
    const error = useUserStore((s) => s.error);
    const syncComplete = useUserStore((s) => s.syncComplete);
    const setSyncComplete = useUserStore((s) => s.setSyncComplete);

    // Discover wallet address — may be undefined initially after OAuth login
    const walletAddress =
        privyUser?.wallet?.address ??
        privyUser?.linkedAccounts?.find((a) => a.type === "wallet")?.address ??
        wallets?.[0]?.address;

    const [onboardingDone, setOnboardingDone] = useState(false);

    // Hard timeout: prevents infinite loading for OAuth users with slow embedded wallet creation.
    // After this timeout, the loading gate unblocks regardless of wallet/sync state.
    const [hardTimeout, setHardTimeout] = useState(false);
    useEffect(() => {
        // Only start the timer if we're authenticated but don't have a user yet
        if (!authenticated || user) {
            setHardTimeout(false);
            return;
        }
        const timer = setTimeout(() => setHardTimeout(true), 20000); // 20s max wait
        return () => clearTimeout(timer);
    }, [authenticated, user]);

    // Some paths within (platform) should be publicly accessible (e.g., certificate verification)
    const isPublicPath = pathname.includes("/certificates/");


    // Redirect unauthenticated users
    useEffect(() => {
        if (ready && !authenticated && !isPublicPath) {
            window.history.replaceState(null, "", "/");
            router.replace("/");
        }
    }, [ready, authenticated, isPublicPath, router]);

    const lastFetchedWallet = useRef<string | null>(null);

    // Fetch user — fires whenever walletAddress becomes available
    useEffect(() => {
        if (!authenticated || !walletAddress || isLoading) return;

        // If we already have the user for this wallet, or we just tried this wallet and it was null
        if (user && user.walletAddress === walletAddress) return;
        if (lastFetchedWallet.current === walletAddress && !user && !isLoading) return;

        lastFetchedWallet.current = walletAddress;
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
            } else if (attempts >= 30) {
                // Give up after 15s — signal that sync won't happen via wallet polling
                clearInterval(pollRef.current!);
                pollRef.current = null;
                setSyncComplete(true);
            }
        }, 500);

        return () => {
            if (pollRef.current) {
                clearInterval(pollRef.current);
                pollRef.current = null;
            }
        };
    }, [authenticated, walletAddress, ready, privyUser, wallets, fetchUser, setSyncComplete]);

    // If it's a public path, we skip all auth-related blocking UI (spinner/redirect)
    if (isPublicPath) {
        return <>{children}</>;
    }

    // Still loading Privy - show a simple background or nothing to avoid flicker
    if (!ready) {
        return <div className="fixed inset-0 z-50 bg-void" />;
    }

    // Not authenticated - redirect is happening via useEffect
    if (!authenticated) {
        return <div className="fixed inset-0 z-50 bg-void" />;
    }

    // If we have a user but onboarding isn't done, show the modal
    if (user && !(user.profile as any)?.onboardingComplete && !onboardingDone) {
        return (
            <OnboardingModal
                walletAddress={user.walletAddress}
                onComplete={() => setOnboardingDone(true)}
            />
        );
    }

    // LOADING GATE: Don't render dashboard until we have a definitive user state.
    // This prevents the "DevUser" flash and ensures onboarding is properly evaluated.
    // We wait if: user is null AND sync hasn't completed AND hard timeout hasn't expired.
    // NOTE: We do NOT gate on !walletAddress here — that would cause an infinite spinner
    // for OAuth users whose embedded wallet takes time to create.
    if (!user && !hardTimeout && (isLoading || !syncComplete)) {
        return (
            <div className="fixed inset-0 z-50 bg-void flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-solana" />
                    <p className="text-text-muted text-sm font-mono">Setting up your account...</p>
                </div>
            </div>
        );
    }

    // Error/retry state: sync completed or timed out, but we still don't have a user.
    // This can happen if the embedded wallet took too long or there was a network error.
    if (!user && (hardTimeout || syncComplete) && !isLoading) {
        return (
            <div className="fixed inset-0 z-50 bg-void flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 max-w-sm text-center p-8">
                    <AlertCircle className="w-10 h-10 text-rust" />
                    <h2 className="text-lg font-display font-bold text-white">Account Setup Taking Longer Than Expected</h2>
                    <p className="text-text-muted text-sm">
                        Your wallet is still being created. This can take a moment for new accounts.
                    </p>
                    <div className="flex gap-3 mt-2">
                        <Button
                            onClick={() => {
                                // Reset timeout and retry
                                setHardTimeout(false);
                                setSyncComplete(false);
                                lastFetchedWallet.current = null;
                                if (walletAddress) {
                                    fetchUser(walletAddress);
                                }
                            }}
                            className="bg-solana text-black font-bold hover:bg-solana/90"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Retry
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => {
                                window.history.replaceState(null, "", "/");
                                router.replace("/");
                            }}
                            className="border-white/10 text-white hover:bg-white/5"
                        >
                            Back to Home
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // Render children if authenticated and user state is resolved
    return <>{children}</>;
}
