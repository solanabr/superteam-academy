import { Connection, PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { XP_MINT, TOKEN_2022_PROGRAM_ID } from "./pda";

/**
 * XP level formula from the spec: Level = floor(sqrt(totalXP / 100))
 */
export function calculateLevel(xp: number): number {
    return Math.floor(Math.sqrt(xp / 100));
}

/**
 * XP needed to reach next level (inverse of level formula)
 */
export function xpForNextLevel(currentLevel: number): number {
    return (currentLevel + 1) * (currentLevel + 1) * 100;
}

/**
 * Progress percentage to the next level (0-100)
 */
export function levelProgress(xp: number): number {
    const currentLevel = calculateLevel(xp);
    const currentLevelXp = currentLevel * currentLevel * 100;
    const nextLevelXp = xpForNextLevel(currentLevel);
    return Math.round(((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100);
}

export function getLevelTitle(level: number): string {
    if (level < 3) return "Explorer";
    if (level < 7) return "Builder";
    if (level < 12) return "Engineer";
    if (level < 20) return "Architect";
    return "Legend";
}

export async function getXPBalance(
    connection: Connection,
    walletPublicKey: PublicKey
): Promise<number> {
    try {
        const xpAta = getAssociatedTokenAddressSync(
            XP_MINT,
            walletPublicKey,
            false,
            TOKEN_2022_PROGRAM_ID
        );
        const balance = await connection.getTokenAccountBalance(xpAta);
        return Number(balance.value.amount);
    } catch {
        return 0;
    }
}

export function formatXP(xp: number): string {
    if (xp >= 1_000_000) return `${(xp / 1_000_000).toFixed(1)}M`;
    if (xp >= 1_000) return `${(xp / 1_000).toFixed(1)}K`;
    return xp.toString();
}
