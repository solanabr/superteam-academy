"use client";

import { useQuery } from "@tanstack/react-query";
import { useConnection } from "@solana/wallet-adapter-react";
import {
    getAssociatedTokenAddressSync,
    TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { useConfig } from "./useConfig";

/**
 * Fetch XP balance for any wallet address (not just the connected one).
 */
export function useXpBalanceFor(walletAddress: string | null) {
    const { connection } = useConnection();
    const { data: config } = useConfig();
    const xpMint = config?.xpMint;

    return useQuery({
        queryKey: ["xpBalance", walletAddress ?? "", xpMint?.toBase58() ?? ""],
        queryFn: async () => {
            if (!walletAddress || !xpMint) return 0;
            try {
                const owner = new PublicKey(walletAddress);
                const ata = getAssociatedTokenAddressSync(
                    xpMint,
                    owner,
                    false,
                    TOKEN_2022_PROGRAM_ID
                );
                const balance = await connection.getTokenAccountBalance(ata);
                return Number(balance.value.amount);
            } catch {
                return 0;
            }
        },
        enabled: !!walletAddress && !!xpMint && !!config,
    });
}
