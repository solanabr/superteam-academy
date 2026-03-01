"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { ProfileContent } from "@/components/app/ProfileContent";

/**
 * /profile — logged-in user's own profile with sidebar (AppShell).
 * WalletGuard ensures wallet is connected.
 */
export default function ProfilePage() {
    const { publicKey } = useWallet();

    if (!publicKey) return null;

    return <ProfileContent walletAddress={publicKey.toBase58()} isOwner />;
}
