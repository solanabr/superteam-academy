/**
 * Account fetching utilities for Superteam Academy on-chain program.
 *
 * These functions fetch account data from the Solana blockchain
 * using the Anchor program client. They are typed against the
 * program IDL and return strongly-typed account data.
 *
 * NOTE: Requires @coral-xyz/anchor and the program IDL to be
 * installed/available. These functions are designed to be used
 * once the Anchor dependency is added.
 */
import { Connection, PublicKey, AccountInfo } from '@solana/web3.js';

/**
 * Raw account info fetcher — works without Anchor dependency.
 * Returns the raw account data for any Solana account.
 */
export async function fetchAccountInfo(
    connection: Connection,
    address: PublicKey
): Promise<AccountInfo<Buffer> | null> {
    return connection.getAccountInfo(address);
}

/**
 * Check if an account exists on-chain.
 */
export async function accountExists(
    connection: Connection,
    address: PublicKey
): Promise<boolean> {
    const info = await connection.getAccountInfo(address);
    return info !== null;
}

/**
 * Fetch multiple account infos in a single RPC call.
 * More efficient than individual fetches for batch operations.
 */
export async function fetchMultipleAccountInfos(
    connection: Connection,
    addresses: PublicKey[]
): Promise<(AccountInfo<Buffer> | null)[]> {
    return connection.getMultipleAccountsInfo(addresses);
}

/**
 * Fetch the SOL balance for a given public key.
 */
export async function fetchSolBalance(
    connection: Connection,
    address: PublicKey
): Promise<number> {
    const lamports = await connection.getBalance(address);
    return lamports / 1e9;
}

/**
 * Fetch the token balance for a Token-2022 ATA.
 */
export async function fetchTokenBalance(
    connection: Connection,
    tokenAccount: PublicKey
): Promise<bigint> {
    const info = await connection.getTokenAccountBalance(tokenAccount);
    return BigInt(info.value.amount);
}
