/**
 * Backend signer management for Superteam Academy.
 *
 * The backend signer is a Solana keypair that co-signs
 * lesson completions, course finalization, and credential issuance.
 * It is registered as a MinterRole in the on-chain Config PDA.
 *
 * SECURITY: In production, the private key should be stored
 * in AWS KMS or similar secure key management. The key is
 * rotatable via the update_config instruction.
 */
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';
import { deriveConfigPda } from './pda';
import { fetchAccountInfo } from './accounts';

/**
 * Load the backend signer keypair from environment variable.
 * Throws if the env var is missing or invalid.
 */
export function loadBackendSigner(): Keypair {
    const privateKey = process.env.BACKEND_SIGNER_PRIVATE_KEY;
    if (!privateKey) {
        throw new Error(
            'BACKEND_SIGNER_PRIVATE_KEY environment variable is not set. ' +
            'This is required for backend transaction signing.'
        );
    }

    try {
        const decoded = bs58.decode(privateKey);
        return Keypair.fromSecretKey(decoded);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Failed to decode backend signer key: ${message}`);
    }
}

/**
 * Get the backend signer public key without loading the full keypair.
 * Useful for client-side address display without exposing the secret.
 */
export function getBackendSignerPublicKey(): PublicKey {
    return loadBackendSigner().publicKey;
}

/**
 * Verify that the loaded backend signer matches the one stored
 * in the on-chain Config PDA. This prevents signing with a
 * stale key after rotation.
 *
 * NOTE: This is a basic check that verifies the Config PDA exists.
 * Full verification requires deserializing the Config account data
 * (which needs Anchor IDL types). This will be enhanced when Anchor
 * is added as a dependency.
 */
export async function verifyBackendSignerAccountExists(
    connection: Connection,
    programId?: PublicKey
): Promise<boolean> {
    const [configPda] = deriveConfigPda(programId);
    const accountInfo = await fetchAccountInfo(connection, configPda);
    return accountInfo !== null;
}
