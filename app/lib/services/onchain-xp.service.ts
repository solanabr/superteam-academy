import { PublicKey } from "@solana/web3.js";
import { IXpService } from "./interfaces";
import {
    getConnection,
    XP_MINT,
    getAssociatedTokenAddressToken2022,
    TOKEN_2022_PROGRAM_ID,
} from "@/lib/anchor-client";

/**
 * Production implementation of IXpService.
 * Reads XP balance from the Token-2022 XP mint on-chain.
 */
export class OnChainXpService implements IXpService {
    async getXpBalance(walletPublicKey: PublicKey | string): Promise<number> {
        try {
            const owner = typeof walletPublicKey === "string"
                ? new PublicKey(walletPublicKey)
                : walletPublicKey;

            const ata = getAssociatedTokenAddressToken2022(XP_MINT, owner);
            const connection = getConnection();

            const accountInfo = await connection.getAccountInfo(ata);
            if (!accountInfo) return 0; // No token account = 0 XP

            // Parse Token-2022 account balance
            const balance = await connection.getTokenAccountBalance(ata);
            return Number(balance.value.amount);
        } catch (error) {
            console.error("Failed to fetch on-chain XP balance:", error);
            return 0;
        }
    }

    getLevel(xp: number): number {
        // Level = floor(sqrt(totalXP / 100))
        return Math.floor(Math.sqrt(xp / 100));
    }

    getXpForLevel(level: number): number {
        return Math.pow(level, 2) * 100;
    }

    getLevelProgress(xp: number) {
        const currentLevel = this.getLevel(xp);
        const currentLevelXp = this.getXpForLevel(currentLevel);
        const nextLevelXp = this.getXpForLevel(currentLevel + 1);

        const xpInCurrentLevel = xp - currentLevelXp;
        const xpNeededForNextLevel = nextLevelXp - currentLevelXp;
        const progressPercent = xpNeededForNextLevel > 0
            ? Math.min(100, Math.max(0, (xpInCurrentLevel / xpNeededForNextLevel) * 100))
            : 0;

        return {
            currentLevel,
            currentLevelXp,
            nextLevelXp,
            progressPercent,
        };
    }
}

export const onChainXpService = new OnChainXpService();
