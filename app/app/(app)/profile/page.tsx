"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";

/**
 * Redirect /profile to /profile/[connected-wallet].
 * If no wallet is connected, redirect to the home page.
 */
export default function ProfileRedirectPage() {
    const { publicKey, connected } = useWallet();
    const router = useRouter();

    useEffect(() => {
        if (connected && publicKey) {
            router.replace(`/profile/${publicKey.toBase58()}`);
        }
    }, [connected, publicKey, router]);

    return (
        <div className="flex items-center justify-center min-h-[50vh]">
            <p className="font-game text-xl text-muted-foreground">Redirecting...</p>
        </div>
    );
}
