/**
 * Achievement Service — on-chain achievement management.
 *
 * Integrates with deployed devnet program for:
 * - Creating achievement types (Metaplex Core NFT collections)
 * - Awarding achievements (minting NFTs + XP rewards)
 * - Querying achievement status
 */
import { PublicKey, Keypair, SystemProgram } from '@solana/web3.js';
import { TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import type { Program } from '@coral-xyz/anchor';
import {
    fetchAchievementTypeAccount,
    fetchAchievementReceiptAccount,
    fetchAllAchievementTypes,
    type RawAchievementTypeAccount,
} from './anchor-accounts';
import {
    deriveAchievementTypePda,
    deriveAchievementReceiptPda,
} from './pda';
import { deriveConfigPda } from './pda';
import { PROGRAM_ID, XP_MINT } from './constants';
import { withRetry } from '@/backend/retry';
import { ServiceError } from '@/backend/errors';

// ─── Types ──────────────────────────────────────────────────────────

export interface CreateAchievementParams {
    achievementId: string;
    name: string;
    metadataUri: string;
    collection: Keypair;
    maxSupply: number;
    xpReward: number;
}

export interface AwardAchievementParams {
    achievementId: string;
    recipient: PublicKey;
    minter: Keypair;
    payer: Keypair;
}

export interface AchievementDetails {
    achievementId: string;
    name: string;
    metadataUri: string;
    collection: PublicKey;
    maxSupply: number;
    currentSupply: number;
    xpReward: number;
    isActive: boolean;
}

export interface AchievementReceipt {
    achievementId: string;
    asset: PublicKey;
    awardedAt: number;
}

// ─── 1. Create Achievement Type ─────────────────────────────────────

export async function createAchievementType(
    program: Program,
    params: CreateAchievementParams,
    authority: Keypair
): Promise<{ achievementTypePda: PublicKey; collection: PublicKey }> {
    const [achievementTypePda] = deriveAchievementTypePda(
        params.achievementId,
        PROGRAM_ID
    );

    const [configPda] = deriveConfigPda(PROGRAM_ID);

    const txHash = await withRetry<string>(() =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (program.methods as any)
            .createAchievementType(
                params.achievementId,
                params.name,
                params.metadataUri,
                params.maxSupply,
                params.xpReward
            )
            .accounts({
                config: configPda,
                achievementType: achievementTypePda,
                collection: params.collection.publicKey,
                authority: authority.publicKey,
                systemProgram: SystemProgram.programId,
            })
            .signers([authority, params.collection])
            .rpc()
    );

    return {
        achievementTypePda,
        collection: params.collection.publicKey,
    };
}

// ─── 2. Deactivate Achievement Type ────────────────────────────────

export async function deactivateAchievementType(
    program: Program,
    achievementId: string,
    authority: Keypair
): Promise<{ txHash: string }> {
    const [achievementTypePda] = deriveAchievementTypePda(
        achievementId,
        PROGRAM_ID
    );
    const [configPda] = deriveConfigPda(PROGRAM_ID);

    const txHash = await withRetry<string>(() =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (program.methods as any)
            .deactivateAchievementType(achievementId)
            .accounts({
                config: configPda,
                achievementType: achievementTypePda,
                authority: authority.publicKey,
            })
            .signers([authority])
            .rpc()
    );

    return { txHash };
}

// ─── 3. Award Achievement ──────────────────────────────────────────

export async function awardAchievement(
    program: Program,
    params: AwardAchievementParams
): Promise<{ asset: PublicKey; txHash: string }> {
    const [achievementTypePda] = deriveAchievementTypePda(
        params.achievementId,
        PROGRAM_ID
    );
    const [receiptPda] = deriveAchievementReceiptPda(
        params.achievementId,
        params.recipient,
        PROGRAM_ID
    );
    const [configPda] = deriveConfigPda(PROGRAM_ID);

    // Check if already awarded
    const existing = await fetchAchievementReceiptAccount(program, receiptPda);
    if (existing) {
        throw new ServiceError(
            'ALREADY_AWARDED',
            `Achievement "${params.achievementId}" already awarded to ${params.recipient.toBase58()}`
        );
    }

    const asset = Keypair.generate();

    // Fetch achievement type to get collection
    const achievementType = await fetchAchievementTypeAccount(
        program,
        achievementTypePda
    );
    if (!achievementType) {
        throw new ServiceError(
            'NOT_FOUND',
            `Achievement type "${params.achievementId}" not found`
        );
    }
    if (!achievementType.isActive) {
        throw new ServiceError(
            'INACTIVE',
            `Achievement type "${params.achievementId}" is deactivated`
        );
    }

    const txHash = await withRetry<string>(() =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (program.methods as any)
            .awardAchievement(params.achievementId)
            .accounts({
                config: configPda,
                achievementType: achievementTypePda,
                achievementReceipt: receiptPda,
                asset: asset.publicKey,
                collection: achievementType.collection,
                recipient: params.recipient,
                xpMint: XP_MINT,
                payer: params.payer.publicKey,
                minter: params.minter.publicKey,
                tokenProgram: TOKEN_2022_PROGRAM_ID,
                systemProgram: SystemProgram.programId,
            })
            .signers([params.payer, params.minter, asset])
            .rpc()
    );

    return { asset: asset.publicKey, txHash };
}

// ─── 4. Check if Awarded ───────────────────────────────────────────

export async function hasAchievement(
    program: Program,
    achievementId: string,
    recipient: PublicKey
): Promise<boolean> {
    const [receiptPda] = deriveAchievementReceiptPda(
        achievementId,
        recipient,
        PROGRAM_ID
    );
    const receipt = await fetchAchievementReceiptAccount(program, receiptPda);
    return !!receipt;
}

// ─── 5. Get Achievement Details ────────────────────────────────────

export async function getAchievementDetails(
    program: Program,
    achievementId: string
): Promise<AchievementDetails | null> {
    const [pda] = deriveAchievementTypePda(achievementId, PROGRAM_ID);
    const account = await fetchAchievementTypeAccount(program, pda);
    if (!account) return null;

    return mapAccountToDetails(account);
}

// ─── 6. Get User Achievements ──────────────────────────────────────

export async function getUserAchievements(
    program: Program,
    user: PublicKey,
    achievementIds: string[]
): Promise<AchievementReceipt[]> {
    const receipts: AchievementReceipt[] = [];

    for (const id of achievementIds) {
        const [receiptPda] = deriveAchievementReceiptPda(id, user, PROGRAM_ID);
        const receipt = await fetchAchievementReceiptAccount(
            program,
            receiptPda
        );
        if (receipt) {
            receipts.push({
                achievementId: id,
                asset: receipt.asset,
                awardedAt: receipt.awardedAt.toNumber(),
            });
        }
    }

    return receipts;
}

// ─── 7. Get All / Active Achievement Types ─────────────────────────

export async function getAllAchievementTypes(
    program: Program
): Promise<AchievementDetails[]> {
    const all = await fetchAllAchievementTypes(program);
    return all.map((a) => mapAccountToDetails(a.account));
}

export async function getActiveAchievements(
    program: Program
): Promise<AchievementDetails[]> {
    const all = await getAllAchievementTypes(program);
    return all.filter((a) => a.isActive);
}

// ─── Helpers ────────────────────────────────────────────────────────

function mapAccountToDetails(
    account: RawAchievementTypeAccount
): AchievementDetails {
    return {
        achievementId: account.achievementId,
        name: account.name,
        metadataUri: account.metadataUri,
        collection: account.collection,
        maxSupply: account.maxSupply,
        currentSupply: account.currentSupply,
        xpReward: account.xpReward,
        isActive: account.isActive,
    };
}
