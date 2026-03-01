"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useWallet } from "@solana/wallet-adapter-react";
import { rewardXp } from "@/lib/services/backend-api";

/** Claims daily streak XP for the connected wallet.
 *  Uses the same /api/academy/reward-xp backend endpoint but without
 *  requiring an admin token — the backend authorises via BACKEND_SIGNER. */
export function useClaimStreakXp() {
    const { publicKey } = useWallet();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (amount: number) => {
            const recipient = publicKey?.toBase58();
            if (!recipient) throw new Error("Wallet not connected");
            const result = await rewardXp({
                recipient,
                amount,
                memo: "daily-streak",
            });
            if (result.error) throw new Error(result.error);
            return result.tx!;
        },
        onSuccess: () => {
            const wallet = publicKey?.toBase58() ?? "";
            void queryClient.invalidateQueries({ queryKey: ["xpBalance", wallet] });
        },
    });
}
