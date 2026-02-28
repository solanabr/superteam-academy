import { Keypair, Connection } from '@solana/web3.js';
import { HELIUS_RPC_SERVER } from '../constants';

/**
 * Backend signer keypair loader and server-side connection factory.
 *
 * The keypair is loaded from the BACKEND_SIGNER_KEYPAIR env var (JSON array
 * of 64 secret key bytes). Cached in module scope to avoid repeated parsing.
 *
 * IMPORTANT: This module must only be imported in server-side code (API routes,
 * server components). Importing in client bundles will fail since the env var
 * is not prefixed with NEXT_PUBLIC_.
 */

let cachedSigner: Keypair | null = null;

export function getBackendSigner(): Keypair {
  if (cachedSigner) return cachedSigner;

  const keypairJson = process.env.BACKEND_SIGNER_KEYPAIR;
  if (!keypairJson) {
    throw new Error('BACKEND_SIGNER_KEYPAIR environment variable is not set');
  }

  try {
    const secretKey = JSON.parse(keypairJson);
    if (!Array.isArray(secretKey) || secretKey.length !== 64) {
      throw new Error('BACKEND_SIGNER_KEYPAIR must be a JSON array of 64 bytes');
    }
    cachedSigner = Keypair.fromSecretKey(Uint8Array.from(secretKey));
    return cachedSigner;
  } catch (err) {
    if (err instanceof SyntaxError) {
      throw new Error('BACKEND_SIGNER_KEYPAIR is not valid JSON');
    }
    throw err;
  }
}

export function getServerConnection(): Connection {
  return new Connection(HELIUS_RPC_SERVER, 'confirmed');
}
