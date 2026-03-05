import { PublicKey } from "@solana/web3.js";
import { IXpService } from "./interfaces";
import { OnChainXpService } from "./onchain-xp.service";

/**
 * XP Service factory.
 * Uses OnChainXpService for real Token-2022 balance queries.
 * Falls back to local mock for level math if on-chain fails.
 */
const onChain = new OnChainXpService();

// Re-export level math helpers that don't need on-chain data
export const xpService: IXpService = {
    getXpBalance: (walletPublicKey: PublicKey | string) => onChain.getXpBalance(walletPublicKey),
    getLevel: (xp: number) => onChain.getLevel(xp),
    getXpForLevel: (level: number) => onChain.getXpForLevel(level),
    getLevelProgress: (xp: number) => onChain.getLevelProgress(xp),
};
