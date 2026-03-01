"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { AppShell } from "@/components/app/AppShell";
import { ChallengesContent } from "@/components/app/ChallengesContent";

/**
 * Public challenges at /challenges.
 * When logged in: sidebar + app header (no top navbar).
 * When logged out: top navbar only (like profile / leaderboard / discussions).
 */
export default function ChallengesPage() {
    const { connected } = useWallet();

    if (connected) {
        return (
            <AppShell>
                <ChallengesContent />
            </AppShell>
        );
    }

    return <ChallengesContent />;
}
