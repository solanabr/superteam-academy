import { Connection } from "@solana/web3.js";

const HELIUS_RPC = process.env.NEXT_PUBLIC_HELIUS_RPC_URL || "https://devnet.helius-rpc.com/?api-key=387cb3e9-0527-4194-98e1-b2acb4791c57";
const FALLBACK_RPC = process.env.NEXT_PUBLIC_FALLBACK_RPC_URL || "https://api.devnet.solana.com";

/**
 * Executes a function with the primary RPC, falling back to the secondary RPC on failure.
 * Note: DAS API methods (like getAssetsByOwner) will always fail on standard devnet RPC.
 */
export async function withFallbackRPC<T>(operation: (connection: Connection) => Promise<T>): Promise<T> {
    const primaryConnection = new Connection(HELIUS_RPC, "confirmed");
    try {
        return await operation(primaryConnection);
    } catch (error: any) {
        console.warn(`Primary RPC failed: ${error.message}. Falling back to secondary...`);
        const fallbackConnection = new Connection(FALLBACK_RPC, "confirmed");
        return await operation(fallbackConnection);
    }
}

export function getPrimaryConnection(): Connection {
    return new Connection(HELIUS_RPC, "confirmed");
}

export function getFallbackConnection(): Connection {
    return new Connection(FALLBACK_RPC, "confirmed");
}
