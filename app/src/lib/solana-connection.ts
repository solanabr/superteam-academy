import { Connection } from "@solana/web3.js";

export const HELIUS_RPC = process.env.NEXT_PUBLIC_HELIUS_RPC_URL || process.env.NEXT_PUBLIC_RPC_URL || "https://api.devnet.solana.com";
export const FALLBACK_RPC = "https://api.devnet.solana.com";
export const RPC_URL = HELIUS_RPC; // For backward compatibility

/**
 * Executes a function with the primary RPC, falling back to the secondary RPC on failure.
 * Note: DAS API methods (like getAssetsByOwner) will always fail on standard devnet RPC.
 */
export async function withFallbackRPC<T>(operation: (connection: Connection) => Promise<T>): Promise<T> {
    const primaryConnection = new Connection(HELIUS_RPC, "confirmed");
    try {
        return await operation(primaryConnection);
    } catch (error: any) {
        const errorMsg = error.message || String(error);

        // If the primary and fallback are the same, don't bother falling back
        if (HELIUS_RPC === FALLBACK_RPC) {
            throw error;
        }

        console.warn(`[solana-connection] Primary RPC failed: ${errorMsg}. Falling back to ${FALLBACK_RPC}...`);
        const fallbackConnection = new Connection(FALLBACK_RPC, "confirmed");
        try {
            return await operation(fallbackConnection);
        } catch (fallbackError: any) {
            console.error(`[solana-connection] Fallback RPC also failed: ${fallbackError.message || fallbackError}`);
            throw fallbackError;
        }
    }
}

export function getPrimaryConnection(): Connection {
    return new Connection(HELIUS_RPC, "confirmed");
}

export function getFallbackConnection(): Connection {
    return new Connection(FALLBACK_RPC, "confirmed");
}
