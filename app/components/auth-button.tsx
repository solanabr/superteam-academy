"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletName } from "@solana/wallet-adapter-base";
import { signIn } from "next-auth/react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Wallet,
    LogOut,
    User,
    Settings,
    ChevronDown,
    Link2,
    AlertCircle,
    Loader2,
    ExternalLink,
} from "lucide-react";
import bs58 from "bs58";

function truncateAddress(address: string): string {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function GoogleIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
    );
}

function GitHubIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
        </svg>
    );
}

/**
 * Unified authentication button.
 * Handles sign-in (Google/GitHub/Wallet), user menu when signed in,
 * and wallet linking prompts.
 */
export function AuthButton() {
    const { user, isAuthenticated, isLoading, isWalletLinked, handleSignOut, linkWallet } = useAuth();
    const wallet = useWallet();
    const { publicKey, signMessage, connecting, select } = wallet;
    const [showSignIn, setShowSignIn] = useState(false);
    const [isWalletSigningIn, setIsWalletSigningIn] = useState(false);
    const [pendingWalletConnect, setPendingWalletConnect] = useState(false);

    // Detect installed wallets
    const isPhantomInstalled = typeof window !== "undefined" && !!(window as any).phantom?.solana;
    const isSolflareInstalled = typeof window !== "undefined" && !!(window as any).solflare?.isSolflare;

    // When a wallet connects after we selected it, trigger sign-in
    useEffect(() => {
        if (pendingWalletConnect && publicKey && signMessage) {
            setPendingWalletConnect(false);
            handleWalletSignIn();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pendingWalletConnect, publicKey, signMessage]);

    // Connect to a specific wallet by name (no generic modal)
    const connectSpecificWallet = (walletName: string) => {
        try {
            select(walletName as WalletName);
            setPendingWalletConnect(true);
        } catch (error) {
            console.error("Failed to select wallet:", error);
        }
    };

    // Handle wallet-based sign-in via Credentials provider
    const handleWalletSignIn = async () => {
        if (!publicKey || !signMessage) return;

        setIsWalletSigningIn(true);
        try {
            const message = `Superteam Academy — Sign In\nWallet: ${publicKey.toBase58()}\nTimestamp: ${Date.now()}`;
            const messageBytes = new TextEncoder().encode(message);
            const signatureBytes = await signMessage(messageBytes);
            const signature = bs58.encode(signatureBytes);

            await signIn("solana-wallet", {
                walletAddress: publicKey.toBase58(),
                signature,
                message,
                callbackUrl: "/dashboard",
            });
        } catch (error) {
            console.error("Wallet sign-in error:", error);
        } finally {
            setIsWalletSigningIn(false);
        }
    };

    // Loading state
    if (isLoading || connecting) {
        return (
            <Button
                size="sm"
                disabled
                className="rounded-full bg-gradient-to-r from-solana-purple to-solana-green px-5 font-semibold text-white"
            >
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                Loading...
            </Button>
        );
    }

    // Not authenticated — show sign in button
    if (!isAuthenticated || !user) {
        return (
            <>
                <Button
                    size="sm"
                    onClick={() => setShowSignIn(true)}
                    className="rounded-full bg-gradient-to-r from-solana-purple to-solana-green px-5 font-semibold text-white shadow-lg shadow-solana-purple/20 transition-all hover:shadow-xl hover:shadow-solana-purple/30 hover:brightness-110"
                >
                    Sign In
                </Button>

                {/* Sign In Dialog */}
                <Dialog open={showSignIn} onOpenChange={setShowSignIn}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="font-display text-xl text-center">
                                Welcome to Superteam Academy
                            </DialogTitle>
                            <DialogDescription className="text-center">
                                Sign in to track your progress, earn XP, and build on-chain credentials.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-3 pt-4">
                            {/* Google */}
                            <Button
                                variant="outline"
                                className="w-full gap-3 h-11 rounded-xl"
                                onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                            >
                                <GoogleIcon className="h-5 w-5" />
                                Continue with Google
                            </Button>

                            {/* GitHub */}
                            <Button
                                variant="outline"
                                className="w-full gap-3 h-11 rounded-xl"
                                onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
                            >
                                <GitHubIcon className="h-5 w-5" />
                                Continue with GitHub
                            </Button>

                            <div className="relative py-2">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-border/60" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-background px-2 text-muted-foreground">Or connect wallet</span>
                                </div>
                            </div>

                            {/* Wallet Options */}
                            {publicKey ? (
                                <Button
                                    className="w-full gap-3 h-11 rounded-xl bg-gradient-to-r from-solana-purple to-solana-green text-white hover:brightness-110"
                                    onClick={handleWalletSignIn}
                                    disabled={isWalletSigningIn}
                                >
                                    {isWalletSigningIn ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Wallet className="h-4 w-4" />
                                    )}
                                    Sign in as {truncateAddress(publicKey.toBase58())}
                                </Button>
                            ) : (
                                <div className="space-y-2">
                                    {/* Phantom */}
                                    <Button
                                        variant="outline"
                                        className="w-full gap-3 h-11 rounded-xl border-[#AB9FF2]/30 hover:border-[#AB9FF2]/60 hover:bg-[#AB9FF2]/5"
                                        onClick={() => {
                                            if (isPhantomInstalled) {
                                                connectSpecificWallet("Phantom");
                                            } else {
                                                window.open("https://phantom.app/download", "_blank");
                                            }
                                        }}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 128 128" fill="none">
                                            <rect width="128" height="128" rx="26" fill="#AB9FF2" />
                                            <path d="M110.584 64.9142H99.142C99.142 41.7651 80.173 23 56.7724 23C33.6612 23 14.8657 41.3057 14.4199 64.0583C13.9659 87.2098 33.8371 107 57.2495 107H62.3328C83.2189 107 110.584 88.7594 110.584 64.9142Z" fill="url(#phantom-grad)" />
                                            <path d="M86.8784 64.0166C86.8784 68.1813 83.498 71.5 79.2571 71.5C75.0162 71.5 71.6357 68.1813 71.6357 64.0166C71.6357 59.8518 75.0162 56.5331 79.2571 56.5331C83.498 56.5331 86.8784 59.8518 86.8784 64.0166Z" fill="white" />
                                            <path d="M66.3065 64.0166C66.3065 68.1813 62.926 71.5 58.6851 71.5C54.4443 71.5 51.0638 68.1813 51.0638 64.0166C51.0638 59.8518 54.4443 56.5331 58.6851 56.5331C62.926 56.5331 66.3065 59.8518 66.3065 64.0166Z" fill="white" />
                                            <defs>
                                                <linearGradient id="phantom-grad" x1="65.5" y1="23" x2="65.5" y2="107" gradientUnits="userSpaceOnUse">
                                                    <stop stopColor="#534BB1" />
                                                    <stop offset="1" stopColor="#551BF9" />
                                                </linearGradient>
                                            </defs>
                                        </svg>
                                        {isPhantomInstalled ? "Connect Phantom" : "Install Phantom"}
                                        {!isPhantomInstalled && (
                                            <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground" />
                                        )}
                                    </Button>

                                    {/* Solflare */}
                                    <Button
                                        variant="outline"
                                        className="w-full gap-3 h-11 rounded-xl border-[#FC7227]/30 hover:border-[#FC7227]/60 hover:bg-[#FC7227]/5"
                                        onClick={() => {
                                            if (isSolflareInstalled) {
                                                connectSpecificWallet("Solflare");
                                            } else {
                                                window.open("https://solflare.com/download", "_blank");
                                            }
                                        }}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 101 96" fill="none">
                                            <path d="M100.48 37.33L90.3 95.29H74.06L80.95 56.35L52.27 95.29H34.51L62.47 41.07L42.58 41.22L15.43 95.29H0L30.36 0.14L100.48 37.33Z" fill="url(#solflare-grad)" />
                                            <defs>
                                                <linearGradient id="solflare-grad" x1="0" y1="47.72" x2="100.48" y2="47.72" gradientUnits="userSpaceOnUse">
                                                    <stop stopColor="#FFC10B" />
                                                    <stop offset="1" stopColor="#FC7227" />
                                                </linearGradient>
                                            </defs>
                                        </svg>
                                        {isSolflareInstalled ? "Connect Solflare" : "Install Solflare"}
                                        {!isSolflareInstalled && (
                                            <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground" />
                                        )}
                                    </Button>
                                </div>
                            )}

                            <p className="text-center text-xs text-muted-foreground pt-2">
                                A wallet is required to earn on-chain XP and credentials.
                                You can link one later.
                            </p>
                        </div>
                    </DialogContent>
                </Dialog>
            </>
        );
    }

    // Authenticated — show user menu
    const displayName = user.username || user.name || "Learner";
    const avatarLetter = displayName[0]?.toUpperCase() ?? "?";

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full gap-2 border-solana-purple/20 hover:border-solana-purple/40"
                >
                    {user.image ? (
                        <img
                            src={user.image}
                            alt={displayName}
                            className="h-5 w-5 rounded-full object-cover"
                        />
                    ) : (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-solana-purple to-solana-green">
                            <span className="text-[10px] font-bold text-white">
                                {avatarLetter}
                            </span>
                        </div>
                    )}
                    <span className="text-xs font-medium max-w-[100px] truncate">
                        {displayName}
                    </span>
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                {!isWalletLinked && (
                    <>
                        <DropdownMenuLabel className="flex items-center gap-2 text-xs text-amber-500 font-normal">
                            <AlertCircle className="h-3.5 w-3.5" />
                            No wallet linked
                        </DropdownMenuLabel>
                        <DropdownMenuItem
                            onClick={() => {
                                if (!publicKey) {
                                    select("Phantom" as WalletName);
                                } else {
                                    linkWallet();
                                }
                            }}
                            className="flex items-center gap-2 text-solana-purple"
                        >
                            <Link2 className="h-4 w-4" />
                            Link Wallet
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                    </>
                )}

                {isWalletLinked && user.walletAddress && (
                    <>
                        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                                <Wallet className="h-3 w-3" />
                                {truncateAddress(user.walletAddress)}
                            </span>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                    </>
                )}

                <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Profile
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Settings
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={() => handleSignOut()}
                    className="flex items-center gap-2 text-destructive focus:text-destructive"
                >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
