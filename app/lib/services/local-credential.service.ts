import { PublicKey } from "@solana/web3.js";
import { CredentialNFT, ICredentialService } from "./interfaces";

/**
 * MVP Implementation of ICredentialService using simple mock logic.
 * Simulates Helius DAS API queries for Metaplex Core NFTs.
 */
export class LocalCredentialService implements ICredentialService {
    // Generate some mock credentials based on the wallet address for UI testing
    async getCredentials(walletPublicKey: PublicKey | string): Promise<CredentialNFT[]> {
        const wallet = typeof walletPublicKey === "string" ? walletPublicKey : walletPublicKey.toString();

        // Simulating network delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Return a stable mock based on the wallet string
        if (wallet.includes("empty") || wallet.length < 5) {
            return [];
        }

        return [
            {
                assetId: "cred_anchor_1",
                name: "Anchor Developer Track",
                imageUri: "https://arweave.net/mock-anchor-cert",
                trackId: 1,
                level: 3,
                coursesCompleted: 3,
                totalXp: 1500
            },
            {
                assetId: "cred_defi_1",
                name: "DeFi Builder Track",
                imageUri: "https://arweave.net/mock-defi-cert",
                trackId: 2,
                level: 1,
                coursesCompleted: 1,
                totalXp: 500
            }
        ];
    }
}

export const credentialService = new LocalCredentialService();
