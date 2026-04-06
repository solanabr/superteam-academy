import { Connection, PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { DEVNET_RPC_URL, TOKEN_2022_PROGRAM_ID, deriveLevel } from "./program";

/**
 * Get XP balance for a wallet from the Token-2022 ATA.
 * Returns 0 if the account doesn't exist.
 */
export async function getXpBalance(
    walletAddress: string,
    xpMintAddress: string
): Promise<{ xp: number; level: number }> {
    try {
        const connection = new Connection(DEVNET_RPC_URL, "confirmed");
        const wallet = new PublicKey(walletAddress);
        const mint = new PublicKey(xpMintAddress);

        const ata = getAssociatedTokenAddressSync(
            mint,
            wallet,
            false,
            TOKEN_2022_PROGRAM_ID
        );

        const balance = await connection.getTokenAccountBalance(ata);
        const xp = Number(balance.value.amount);
        return { xp, level: deriveLevel(xp) };
    } catch {
        return { xp: 0, level: 0 };
    }
}

interface XpHolder {
    wallet: string;
    xp: number;
    level: number;
}

/**
 * Build a leaderboard by fetching all XP token holders.
 * Uses getTokenLargestAccounts for simplicity on devnet.
 */
export async function getXpLeaderboard(
    xpMintAddress: string,
    limit: number = 50
): Promise<XpHolder[]> {
    try {
        const connection = new Connection(DEVNET_RPC_URL, "confirmed");
        const mint = new PublicKey(xpMintAddress);

        const largest = await connection.getTokenLargestAccounts(mint);

        const holders: XpHolder[] = [];
        for (const account of largest.value.slice(0, limit)) {
            const xp = Number(account.amount);
            if (xp <= 0) continue;

            // Resolve owner from token account
            const info = await connection.getParsedAccountInfo(account.address);
            const parsed = (info.value?.data as { parsed?: { info?: { owner?: string } } })?.parsed;
            const owner = parsed?.info?.owner;

            if (owner) {
                holders.push({
                    wallet: owner,
                    xp,
                    level: deriveLevel(xp),
                });
            }
        }

        holders.sort((a, b) => b.xp - a.xp);
        return holders;
    } catch {
        console.warn("Failed to fetch XP leaderboard");
        return [];
    }
}
