/**
 * Credential service for Superteam Academy.
 *
 * Orchestrates credential (Metaplex Core NFT) operations:
 * - Issue new credentials after course finalization
 * - Upgrade existing credentials for subsequent course completions
 * - Query credential status from enrollment accounts
 * - Fetch credential details via Helius DAS
 *
 * Relies on TransactionBuilder for instruction construction
 * and helius-service for indexed asset queries.
 */
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { TransactionBuilder, type TransactionResult } from './tx-builder';
import { deriveEnrollmentPda, deriveCoursePda } from './pda';
import { PROGRAM_ID, XP_MINT } from './constants';
import { fetchEnrollmentAccount, fetchCourseAccount } from './anchor-accounts';
import { getReadOnlyProgram } from './course-service';
import {
    getCredentials,
    getAsset,
    type CredentialInfo,
    type DasAsset,
} from './helius-service';
import { ServiceError } from '@/backend/errors';

// ─── Types ───────────────────────────────────────────────────────────

export interface IssueCredentialParams {
    learner: PublicKey;
    courseId: string;
    credentialName: string;
    metadataUri: string;
    coursesCompleted: number;
    totalXp: number;
    trackCollection: PublicKey;
}

export interface UpgradeCredentialParams {
    learner: PublicKey;
    courseId: string;
    credentialAsset: PublicKey;
    newName: string;
    newMetadataUri: string;
    coursesCompleted: number;
    totalXp: number;
    trackCollection: PublicKey;
}

export interface CredentialStatus {
    hasCredential: boolean;
    credentialAsset: string | null;
    finalized: boolean;
}

// ─── Track Collections ───────────────────────────────────────────────

/** Track collection addresses (to be populated with real addresses) */
export const TRACK_COLLECTIONS: Record<number, string> = {
    // These will be populated when track collections are created on-chain
    // 1: 'AnchorCollectionAddress...',
    // 2: 'DeFiCollectionAddress...',
};

export const TRACK_NAMES: Record<number, string> = {
    1: 'Anchor Developer',
    2: 'DeFi Specialist',
    3: 'Mobile Developer',
    4: 'Pinocchio Developer',
    5: 'Token Engineer',
};

// ─── Credential Operations ───────────────────────────────────────────

/**
 * Issue a new credential NFT for a learner.
 *
 * Prerequisites:
 * - Course must be finalized (all lessons complete)
 * - Learner must not already have a credential for this enrollment
 */
export async function issueCredential(
    connection: Connection,
    backendSigner: Keypair,
    payer: Keypair,
    params: IssueCredentialParams
): Promise<TransactionResult & { credentialAsset: PublicKey }> {
    // Verify enrollment is finalized
    const program = getReadOnlyProgram(connection);
    const [enrollmentPda] = deriveEnrollmentPda(params.courseId, params.learner);
    const enrollment = await fetchEnrollmentAccount(program, enrollmentPda);

    if (!enrollment) {
        throw new ServiceError('Enrollment not found — learner must be enrolled', 'ENROLLMENT_NOT_FOUND', 404);
    }

    if (!enrollment.completedAt) {
        throw new ServiceError('Course not finalized — must finalize before issuing credential', 'COURSE_NOT_FINALIZED', 409);
    }

    if (enrollment.credentialAsset) {
        throw new ServiceError('Credential already issued for this enrollment', 'CREDENTIAL_EXISTS', 409);
    }

    // Build and execute
    const txBuilder = new TransactionBuilder({
        connection,
        backendSigner,
        programId: PROGRAM_ID,
        xpMint: XP_MINT,
    });

    const built = await txBuilder.buildIssueCredentialIx(
        params.courseId,
        params.learner,
        params.credentialName,
        params.metadataUri,
        params.coursesCompleted,
        params.totalXp,
        params.trackCollection,
        payer
    );

    // The credential asset keypair is the first additional signer
    const credentialAsset = built.additionalSigners[0];

    const result = await txBuilder.executeTransaction(
        built.transaction,
        built.additionalSigners
    );

    return {
        ...result,
        credentialAsset: credentialAsset.publicKey,
    };
}

/**
 * Upgrade an existing credential NFT with new metadata.
 */
export async function upgradeCredential(
    connection: Connection,
    backendSigner: Keypair,
    payer: Keypair,
    params: UpgradeCredentialParams
): Promise<TransactionResult> {
    const txBuilder = new TransactionBuilder({
        connection,
        backendSigner,
        programId: PROGRAM_ID,
        xpMint: XP_MINT,
    });

    const built = await txBuilder.buildUpgradeCredentialIx(
        params.courseId,
        params.learner,
        params.credentialAsset,
        params.newName,
        params.newMetadataUri,
        params.coursesCompleted,
        params.totalXp,
        params.trackCollection,
        payer
    );

    return txBuilder.executeTransaction(
        built.transaction,
        built.additionalSigners
    );
}

// ─── Query Functions ─────────────────────────────────────────────────

/**
 * Check if a learner has a credential for a specific course enrollment.
 */
export async function checkCredentialStatus(
    connection: Connection,
    courseId: string,
    learner: PublicKey
): Promise<CredentialStatus> {
    const program = getReadOnlyProgram(connection);
    const [enrollmentPda] = deriveEnrollmentPda(courseId, learner);

    try {
        const enrollment = await fetchEnrollmentAccount(program, enrollmentPda);

        if (!enrollment) {
            return { hasCredential: false, credentialAsset: null, finalized: false };
        }

        return {
            hasCredential: !!enrollment.credentialAsset,
            credentialAsset: enrollment.credentialAsset?.toBase58() ?? null,
            finalized: !!enrollment.completedAt,
        };
    } catch {
        return { hasCredential: false, credentialAsset: null, finalized: false };
    }
}

/**
 * Get detailed credential info via Helius DAS API.
 */
export async function getCredentialDetails(
    assetId: string
): Promise<DasAsset> {
    return getAsset(assetId);
}

/**
 * Get all credentials owned by a wallet.
 */
export async function getUserCredentials(
    ownerAddress: string,
    trackCollections?: string[]
): Promise<CredentialInfo[]> {
    return getCredentials(ownerAddress, trackCollections);
}

/**
 * Check if a learner has any credential in a specific track.
 */
export async function hasTrackCredential(
    ownerAddress: string,
    trackCollectionAddress: string
): Promise<{ has: boolean; credential: CredentialInfo | null }> {
    const credentials = await getCredentials(ownerAddress, [trackCollectionAddress]);
    if (credentials.length === 0) {
        return { has: false, credential: null };
    }
    return { has: true, credential: credentials[0] };
}
