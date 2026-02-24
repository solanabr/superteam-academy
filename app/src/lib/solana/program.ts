import { AnchorProvider } from '@coral-xyz/anchor';
import { Connection } from '@solana/web3.js';
import { HELIUS_RPC } from './constants';

/**
 * Lightweight program wrapper for Superteam Academy on-chain program.
 *
 * No full Anchor IDL is available yet (program not buildable from frontend),
 * so this module provides connection and provider factories used by the
 * account readers and instruction builders.
 *
 * Once the IDL JSON is generated from `anchor build`, this module will
 * export a typed `Program<OnchainAcademy>` instance.
 */

let _connection: Connection | null = null;

/**
 * Returns a shared Connection instance configured for the Helius RPC.
 * Reuses a singleton so multiple callers share the same websocket/HTTP pool.
 */
export function getConnection(): Connection {
  if (!_connection) {
    _connection = new Connection(HELIUS_RPC, 'confirmed');
  }
  return _connection;
}

/**
 * Creates a fresh Connection (bypasses singleton).
 * Useful when you need a different commitment level or custom endpoint.
 */
export function createConnection(
  endpoint: string = HELIUS_RPC,
  commitment: 'processed' | 'confirmed' | 'finalized' = 'confirmed',
): Connection {
  return new Connection(endpoint, commitment);
}

/**
 * Creates an AnchorProvider from a wallet adapter and connection.
 * Used client-side where the wallet adapter provides signing capabilities.
 */
export function createProvider(
  connection: Connection,
  wallet: AnchorProvider['wallet'],
): AnchorProvider {
  return new AnchorProvider(connection, wallet, { commitment: 'confirmed' });
}
