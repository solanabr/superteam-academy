import { Connection } from "@solana/web3.js";

export const HELIUS_RPC = process.env.NEXT_PUBLIC_HELIUS_RPC_URL || process.env.NEXT_PUBLIC_RPC_URL || "https://api.devnet.solana.com";
export const FALLBACK_RPC = "https://api.devnet.solana.com";
export const RPC_URL = HELIUS_RPC;

// Singleton storage to reuse connections across serverless invocations/hot reloads
const globalForSolana = globalThis as unknown as {
    primaryConnection: Connection | undefined;
    fallbackConnection: Connection | undefined;
};

export const primaryConnection = globalForSolana.primaryConnection ?? new Connection(HELIUS_RPC, {
    commitment: "confirmed",
    disableRetryOnRateLimit: false,
});

export const fallbackConnection = globalForSolana.fallbackConnection ?? new Connection(FALLBACK_RPC, {
    commitment: "confirmed",
    disableRetryOnRateLimit: false,
});

// Persist in globalThis to reuse connections across warm starts / hot reloads
globalForSolana.primaryConnection = primaryConnection;
globalForSolana.fallbackConnection = fallbackConnection;

/**
 * Executes a function with the primary RPC, falling back to the secondary RPC on failure.
 * Reuses singleton connections to avoid TCP/TLS handshake overhead.
 */
export async function withFallbackRPC<T>(operation: (connection: Connection) => Promise<T>): Promise<T> {
    try {
        return await operation(primaryConnection);
    } catch (error: any) {
        const errorMsg = error.message || String(error);

        if (HELIUS_RPC === FALLBACK_RPC) {
            throw error;
        }

        // Do NOT fallback if the error is a valid response from the cluster (e.g. Simulation Failure / Logic Error)
        // These errors mean the RPC node is working perfectly fine; the transaction itself is invalid.
        if (errorMsg.includes("Simulation failed") || errorMsg.includes("Instruction error") || errorMsg.includes("custom program error")) {
            throw error;
        }

        console.warn(`[solana-connection] Primary RPC failed: ${errorMsg}. Falling back to ${FALLBACK_RPC}...`);
        try {
            return await operation(fallbackConnection);
        } catch (fallbackError: any) {
            console.error(`[solana-connection] Fallback RPC also failed: ${fallbackError.message || fallbackError}`);
            throw fallbackError;
        }
    }
}

export function getPrimaryConnection(): Connection {
    return primaryConnection;
}

export function getFallbackConnection(): Connection {
    return fallbackConnection;
}
