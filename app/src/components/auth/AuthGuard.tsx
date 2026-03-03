"use client";

import { useEffect, useRef, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth/solana";
import { useRouter, usePathname } from "next/navigation";
import { useUserStore } from "@/store/user-store";
import { OnboardingModal } from "./OnboardingModal";
import { Button } from "../ui/button";
import { useTranslations } from "next-intl";
import { AlertCircle } from "lucide-react";

/**
 * Client-side auth guard. Wraps protected pages.
 * - Shows loading spinner while Privy initializes
 * - Redirects to landing page if not authenticated (unless public path)
 * - Polls for wallet address after OAuth login (wallet takes 1-3s to initialize)
 * - Shows one-time onboarding modal if profile.onboardingComplete is not set
 * - Replaces browser history to prevent back-button exploit
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

    // Discover wallet address — may be undefined initially after OAuth login
    const walletAddress =
        privyUser?.wallet?.address ??
        privyUser?.linkedAccounts?.find((a) => a.type === "wallet")?.address ??
        wallets?.[0]?.address;

    const [onboardingDone, setOnboardingDone] = useState(false);

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

    // If it's a public path, we skip all auth-related blocking UI (spinner/redirect)
    if (isPublicPath) {
        return <>{children}</>;
    }

    // If it's a public path, we skip all auth-related blocking UI
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

    // Render children if authenticated, even if user data is still syncing in background
    return <>{children}</>;
}
