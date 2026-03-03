/**
 * XP Token (Token-2022) utilities for Superteam Academy.
 *
 * Manages Associated Token Accounts (ATAs) for the soulbound
 * XP token. Before any XP minting operation, the recipient
 * must have a Token-2022 ATA created.
 */
import {
    Connection,
    Keypair,
    PublicKey,
    Transaction,
} from '@solana/web3.js';
import {
    getAssociatedTokenAddressSync,
    createAssociatedTokenAccountInstruction,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { XP_MINT } from './constants';

/**
 * Derive the Token-2022 ATA address for a given owner and the XP mint.
 */
export function deriveXpAta(owner: PublicKey): PublicKey {
    return getAssociatedTokenAddressSync(
        XP_MINT,
        owner,
        false,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
    );
}

/**
 * Check if an XP ATA exists for the given owner.
 */
export async function xpAtaExists(
    connection: Connection,
    owner: PublicKey
): Promise<boolean> {
    const ata = deriveXpAta(owner);
    const info = await connection.getAccountInfo(ata);
    return info !== null;
}

/**
 * Ensure that the recipient has a Token-2022 ATA for XP.
 * If the ATA doesn't exist, creates it in a transaction.
 * Returns the ATA address.
 */
export async function ensureXpAta(
    connection: Connection,
    owner: PublicKey,
    payer: Keypair
): Promise<{ ata: PublicKey; created: boolean }> {
    const ata = deriveXpAta(owner);
    const info = await connection.getAccountInfo(ata);

    if (info !== null) {
        return { ata, created: false };
    }

    // Create the ATA
    const instruction = createAssociatedTokenAccountInstruction(
        payer.publicKey,
        ata,
        owner,
        XP_MINT,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const transaction = new Transaction().add(instruction);
    const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash('confirmed');

    transaction.recentBlockhash = blockhash;
    transaction.feePayer = payer.publicKey;
    transaction.sign(payer);

    const signature = await connection.sendRawTransaction(transaction.serialize());
    await connection.confirmTransaction(
        { signature, blockhash, lastValidBlockHeight },
        'confirmed'
    );

    return { ata, created: true };
}

/**
 * Build an instruction to create an XP ATA without sending.
 * Use this when you want to bundle ATA creation with other
 * instructions in a single transaction.
 */
export function buildCreateXpAtaInstruction(
    owner: PublicKey,
    payer: PublicKey
): { instruction: ReturnType<typeof createAssociatedTokenAccountInstruction>; ata: PublicKey } {
    const ata = deriveXpAta(owner);
    const instruction = createAssociatedTokenAccountInstruction(
        payer,
        ata,
        owner,
        XP_MINT,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
    );

    return { instruction, ata };
}

/**
 * Get the XP balance for a single wallet owner.
 * Returns 0 if the ATA doesn't exist.
 */
export async function getXpBalance(
    connection: Connection,
    owner: PublicKey
): Promise<number> {
    const ata = deriveXpAta(owner);
    try {
        const balance = await connection.getTokenAccountBalance(ata);
        return Number(balance.value.amount);
    } catch {
        // ATA doesn't exist or fetch failed
        return 0;
    }
}

/**
 * Get XP balances for multiple wallet owners in a single RPC call.
 * Uses getMultipleAccountsInfo for efficiency.
 */
export async function getXpBalances(
    connection: Connection,
    owners: PublicKey[]
): Promise<Map<string, number>> {
    const atas = owners.map(deriveXpAta);
    const accounts = await connection.getMultipleAccountsInfo(atas);

    const result = new Map<string, number>();

    for (let i = 0; i < owners.length; i++) {
        const accountInfo = accounts[i];
        if (accountInfo && accountInfo.data.length >= 72) {
            // Token-2022 account layout: amount is a u64 at offset 64
            const amountBytes = accountInfo.data.subarray(64, 72);
            const amount = Number(amountBytes.readBigUInt64LE(0));
            result.set(owners[i].toBase58(), amount);
        } else {
            result.set(owners[i].toBase58(), 0);
        }
    }

    return result;
}

