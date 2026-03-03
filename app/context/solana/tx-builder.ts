/**
 * Transaction builder for Superteam Academy backend operations.
 *
 * Constructs and signs transactions for backend-signed operations:
 * - complete_lesson
 * - finalize_course
 * - issue_credential
 * - upgrade_credential
 * - reward_xp (streak milestones, generic XP)
 * - award_achievement (NFT badge + XP)
 *
 * Uses the Anchor IDL for typed instruction construction.
 */
import { isTransientError } from '@/backend/retry';
import {
    Connection,
    Keypair,
    PublicKey,
    Transaction,
    TransactionInstruction,
    TransactionSignature,
} from '@solana/web3.js';
import { Program, AnchorProvider, BN, type Idl } from '@coral-xyz/anchor';
import { deriveCoursePda, deriveEnrollmentPda, deriveConfigPda, deriveMinterRolePda, deriveAchievementTypePda, deriveAchievementReceiptPda } from './pda';
import { deriveXpAta } from './xp';
import { TOKEN_2022_PROGRAM_ID, MPL_CORE_PROGRAM_ID } from './constants';

import idlJson from '@/context/idl/onchain_academy.json';

// ─── Types ───────────────────────────────────────────────────────────

/** Result of a successful transaction execution */
export interface TransactionResult {
    signature: TransactionSignature;
    slot: number;
}

/** Configuration for the transaction builder */
export interface TransactionBuilderConfig {
    connection: Connection;
    backendSigner: Keypair;
    programId: PublicKey;
    xpMint: PublicKey;
}

/** Built instruction ready for execution */
export interface BuiltInstruction {
    transaction: Transaction;
    additionalSigners: Keypair[];
}


// ─── TransactionBuilder ──────────────────────────────────────────────

/**
 * TransactionBuilder handles construction, signing, and submission
 * of on-chain transactions for backend-signed operations.
 */
export class TransactionBuilder {
    private readonly connection: Connection;
    private readonly backendSigner: Keypair;
    private readonly programId: PublicKey;
    private readonly xpMint: PublicKey;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private readonly program: Program<any>;

    constructor(config: TransactionBuilderConfig) {
        this.connection = config.connection;
        this.backendSigner = config.backendSigner;
        this.programId = config.programId;
        this.xpMint = config.xpMint;

        // Create an Anchor provider + program for typed instruction building
        const dummyWallet = {
            publicKey: this.backendSigner.publicKey,
            signTransaction: async <T,>(tx: T): Promise<T> => tx,
            signAllTransactions: async <T,>(txs: T[]): Promise<T[]> => txs,
            payer: this.backendSigner,
        };
        const provider = new AnchorProvider(this.connection, dummyWallet, {
            commitment: 'confirmed',
        });
        this.program = new Program(idlJson as Idl, provider);
    }

    // ─── Instruction Builders ────────────────────────────────────────

    /**
     * Build a complete_lesson instruction.
     *
     * Marks a lesson as completed in the enrollment bitmap
     * and mints xp_per_lesson XP to the learner.
     */
    async buildCompleteLessonIx(
        courseId: string,
        lessonIndex: number,
        learner: PublicKey
    ): Promise<BuiltInstruction> {
        const [configPda] = deriveConfigPda();
        const [coursePda] = deriveCoursePda(courseId);
        const [enrollmentPda] = deriveEnrollmentPda(courseId, learner);
        const learnerXpAta = deriveXpAta(learner);

        const ix = await this.program.methods
            .completeLesson(lessonIndex)
            .accountsPartial({
                config: configPda,
                course: coursePda,
                enrollment: enrollmentPda,
                learner: learner,
                learnerTokenAccount: learnerXpAta,
                xpMint: this.xpMint,
                backendSigner: this.backendSigner.publicKey,
                tokenProgram: TOKEN_2022_PROGRAM_ID,
            })
            .instruction();

        const tx = new Transaction().add(ix);
        return { transaction: tx, additionalSigners: [] };
    }

    /**
     * Build a finalize_course instruction.
     *
     * Awards 50% bonus XP to learner and creator reward XP if threshold met.
     * Requires all lessons completed (bitmap check done on-chain).
     */
    async buildFinalizeCourseIx(
        courseId: string,
        learner: PublicKey,
        creator: PublicKey
    ): Promise<BuiltInstruction> {
        const [configPda] = deriveConfigPda();
        const [coursePda] = deriveCoursePda(courseId);
        const [enrollmentPda] = deriveEnrollmentPda(courseId, learner);
        const learnerXpAta = deriveXpAta(learner);
        const creatorXpAta = deriveXpAta(creator);

        const ix = await this.program.methods
            .finalizeCourse()
            .accountsPartial({
                config: configPda,
                course: coursePda,
                enrollment: enrollmentPda,
                learner: learner,
                learnerTokenAccount: learnerXpAta,
                creatorTokenAccount: creatorXpAta,
                creator: creator,
                xpMint: this.xpMint,
                backendSigner: this.backendSigner.publicKey,
                tokenProgram: TOKEN_2022_PROGRAM_ID,
            })
            .instruction();

        const tx = new Transaction().add(ix);
        return { transaction: tx, additionalSigners: [] };
    }

    /**
     * Build an issue_credential instruction.
     *
     * Creates a soulbound Metaplex Core NFT credential.
     * Generates a new keypair for the credential asset.
     */
    async buildIssueCredentialIx(
        courseId: string,
        learner: PublicKey,
        credentialName: string,
        metadataUri: string,
        coursesCompleted: number,
        totalXp: number,
        trackCollection: PublicKey,
        payer: Keypair
    ): Promise<BuiltInstruction> {
        const [configPda] = deriveConfigPda();
        const [coursePda] = deriveCoursePda(courseId);
        const [enrollmentPda] = deriveEnrollmentPda(courseId, learner);
        const credentialAsset = Keypair.generate();

        const ix = await this.program.methods
            .issueCredential(
                credentialName,
                metadataUri,
                coursesCompleted,
                new BN(totalXp)
            )
            .accountsPartial({
                config: configPda,
                course: coursePda,
                enrollment: enrollmentPda,
                learner: learner,
                credentialAsset: credentialAsset.publicKey,
                trackCollection: trackCollection,
                payer: payer.publicKey,
                backendSigner: this.backendSigner.publicKey,
                mplCoreProgram: MPL_CORE_PROGRAM_ID,
                systemProgram: PublicKey.default,
            })
            .instruction();

        const tx = new Transaction().add(ix);
        return {
            transaction: tx,
            additionalSigners: [credentialAsset, payer],
        };
    }

    /**
     * Build an upgrade_credential instruction.
     *
     * Updates an existing credential NFT with new metadata.
     */
    async buildUpgradeCredentialIx(
        courseId: string,
        learner: PublicKey,
        credentialAsset: PublicKey,
        newName: string,
        newUri: string,
        coursesCompleted: number,
        totalXp: number,
        trackCollection: PublicKey,
        payer: Keypair
    ): Promise<BuiltInstruction> {
        const [configPda] = deriveConfigPda();
        const [coursePda] = deriveCoursePda(courseId);
        const [enrollmentPda] = deriveEnrollmentPda(courseId, learner);

        const ix = await this.program.methods
            .upgradeCredential(
                newName,
                newUri,
                coursesCompleted,
                new BN(totalXp)
            )
            .accountsPartial({
                config: configPda,
                course: coursePda,
                enrollment: enrollmentPda,
                learner: learner,
                credentialAsset: credentialAsset,
                trackCollection: trackCollection,
                payer: payer.publicKey,
                backendSigner: this.backendSigner.publicKey,
                mplCoreProgram: MPL_CORE_PROGRAM_ID,
                systemProgram: PublicKey.default,
            })
            .instruction();

        const tx = new Transaction().add(ix);
        return { transaction: tx, additionalSigners: [payer] };
    }

    /**
     * Build a reward_xp instruction.
     *
     * Mints arbitrary XP to a recipient with a memo string.
     * Used for streak milestones, events, community rewards, etc.
     * Requires the backend signer to have a registered minter role.
     */
    async buildRewardXpIx(
        recipient: PublicKey,
        amount: number | bigint,
        memo: string
    ): Promise<BuiltInstruction> {
        const [configPda] = deriveConfigPda();
        const [minterRolePda] = deriveMinterRolePda(this.backendSigner.publicKey);
        const recipientXpAta = deriveXpAta(recipient);

        const ix = await this.program.methods
            .rewardXp(new BN(amount.toString()), memo)
            .accountsPartial({
                config: configPda,
                minterRole: minterRolePda,
                xpMint: this.xpMint,
                recipientTokenAccount: recipientXpAta,
                minter: this.backendSigner.publicKey,
                tokenProgram: TOKEN_2022_PROGRAM_ID,
            })
            .instruction();

        const tx = new Transaction().add(ix);
        return { transaction: tx, additionalSigners: [] };
    }

    /**
     * Build an award_achievement instruction.
     *
     * Mints a Metaplex Core NFT achievement badge + XP to the recipient.
     * Creates an achievement_receipt PDA to prevent double-awards.
     * Generates a new keypair for the NFT asset.
     */
    async buildAwardAchievementIx(
        achievementId: string,
        recipient: PublicKey,
        collection: PublicKey
    ): Promise<BuiltInstruction> {
        const [configPda] = deriveConfigPda();
        const [achievementTypePda] = deriveAchievementTypePda(achievementId);
        const [achievementReceiptPda] = deriveAchievementReceiptPda(achievementId, recipient);
        const [minterRolePda] = deriveMinterRolePda(this.backendSigner.publicKey);
        const recipientXpAta = deriveXpAta(recipient);
        const achievementAsset = Keypair.generate();

        const ix = await this.program.methods
            .awardAchievement()
            .accountsPartial({
                config: configPda,
                achievementType: achievementTypePda,
                achievementReceipt: achievementReceiptPda,
                minterRole: minterRolePda,
                asset: achievementAsset.publicKey,
                collection: collection,
                recipient: recipient,
                recipientTokenAccount: recipientXpAta,
                xpMint: this.xpMint,
                payer: this.backendSigner.publicKey,
                minter: this.backendSigner.publicKey,
                mplCoreProgram: MPL_CORE_PROGRAM_ID,
                tokenProgram: TOKEN_2022_PROGRAM_ID,
                systemProgram: PublicKey.default,
            })
            .instruction();

        const tx = new Transaction().add(ix);
        return { transaction: tx, additionalSigners: [achievementAsset] };
    }

    // ─── Transaction Execution ───────────────────────────────────────

    /**
     * Execute a transaction with the backend signer.
     * Includes simulation, signing, sending, confirmation with timeout.
     */
    async executeTransaction(
        transaction: Transaction,
        additionalSigners: Keypair[] = []
    ): Promise<TransactionResult> {
        const { blockhash, lastValidBlockHeight } =
            await this.connection.getLatestBlockhash('confirmed');

        transaction.recentBlockhash = blockhash;
        transaction.feePayer = this.backendSigner.publicKey;

        // Sign with backend signer + any additional signers
        const allSigners = [this.backendSigner, ...additionalSigners];
        transaction.sign(...allSigners);

        // Simulate first to catch errors early
        const simulation = await this.connection.simulateTransaction(transaction);
        if (simulation.value.err) {
            throw new TransactionSimulationError(
                simulation.value.err,
                simulation.value.logs ?? []
            );
        }

        // Send and confirm with timeout
        const signature = await this.connection.sendRawTransaction(
            transaction.serialize(),
            { skipPreflight: true }
        );

        const confirmPromise = this.connection.confirmTransaction(
            { signature, blockhash, lastValidBlockHeight },
            'confirmed'
        );

        const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new TransactionTimeoutError(signature)), 60_000)
        );

        const confirmation = await Promise.race([confirmPromise, timeoutPromise]);

        if (confirmation.value.err) {
            throw new TransactionConfirmationError(
                signature,
                confirmation.value.err
            );
        }

        return {
            signature,
            slot: confirmation.context.slot,
        };
    }

    /**
     * Execute a transaction with retry logic for transient failures.
     * Retries up to maxRetries times with exponential backoff.
     */
    async executeWithRetry(
        buildFn: () => Promise<BuiltInstruction>,
        maxRetries = 3
    ): Promise<TransactionResult> {
        let lastError: Error | undefined;

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const { transaction, additionalSigners } = await buildFn();
                return await this.executeTransaction(transaction, additionalSigners);
            } catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));

                // Don't retry simulation errors (deterministic failures)
                if (error instanceof TransactionSimulationError) throw error;

                // Only retry transient network/RPC errors
                if (!isTransientError(error)) throw lastError;

                // Don't retry on last attempt
                if (attempt === maxRetries - 1) break;

                // Exponential backoff with jitter: ~1s, ~2s, ~4s
                const jitter = Math.random() * 500;
                const delay = Math.pow(2, attempt) * 1000 + jitter;
                console.warn(`Tx retry ${attempt + 1}/${maxRetries} after ${Math.round(delay)}ms:`, lastError.message);
                await new Promise(r => setTimeout(r, delay));
            }
        }

        throw lastError;
    }

    /**
     * Build and execute a complete_lesson operation in one call.
     */
    async completeLesson(
        courseId: string,
        lessonIndex: number,
        learner: PublicKey
    ): Promise<TransactionResult> {
        return this.executeWithRetry(() =>
            this.buildCompleteLessonIx(courseId, lessonIndex, learner)
        );
    }

    /**
     * Build and execute a finalize_course operation in one call.
     */
    async finalizeCourse(
        courseId: string,
        learner: PublicKey,
        creator: PublicKey
    ): Promise<TransactionResult> {
        return this.executeWithRetry(() =>
            this.buildFinalizeCourseIx(courseId, learner, creator)
        );
    }

    /**
     * Build and execute a reward_xp operation in one call.
     */
    async rewardXp(
        recipient: PublicKey,
        amount: number | bigint,
        memo: string
    ): Promise<TransactionResult> {
        return this.executeWithRetry(() =>
            this.buildRewardXpIx(recipient, amount, memo)
        );
    }

    /**
     * Build and execute an award_achievement operation in one call.
     */
    async awardAchievement(
        achievementId: string,
        recipient: PublicKey,
        collection: PublicKey
    ): Promise<TransactionResult> {
        return this.executeWithRetry(() =>
            this.buildAwardAchievementIx(achievementId, recipient, collection)
        );
    }

    // ─── Utilities ───────────────────────────────────────────────────

    /** Build a transaction from a single instruction */
    buildTransaction(instruction: TransactionInstruction): Transaction {
        const tx = new Transaction();
        tx.add(instruction);
        return tx;
    }

    /** Build a transaction from multiple instructions */
    buildTransactionFromInstructions(
        instructions: TransactionInstruction[]
    ): Transaction {
        const tx = new Transaction();
        for (const ix of instructions) {
            tx.add(ix);
        }
        return tx;
    }

    /** Get the backend signer's public key */
    getSignerPublicKey(): PublicKey {
        return this.backendSigner.publicKey;
    }

    /** Get the program ID */
    getProgramId(): PublicKey {
        return this.programId;
    }

    /** Get the XP mint address */
    getXpMint(): PublicKey {
        return this.xpMint;
    }
}

// ─── Error Classes ───────────────────────────────────────────────────

/** Error thrown when transaction simulation fails */
export class TransactionSimulationError extends Error {
    constructor(
        public readonly simulationError: unknown,
        public readonly logs: string[]
    ) {
        const logSummary = logs.length > 0
            ? `\nLogs:\n${logs.slice(-5).join('\n')}`
            : '';
        super(`Transaction simulation failed: ${JSON.stringify(simulationError)}${logSummary}`);
        this.name = 'TransactionSimulationError';
    }
}

/** Error thrown when transaction confirmation fails */
export class TransactionConfirmationError extends Error {
    constructor(
        public readonly signature: string,
        public readonly confirmationError: unknown
    ) {
        super(
            `Transaction confirmation failed for ${signature}: ${JSON.stringify(confirmationError)}`
        );
        this.name = 'TransactionConfirmationError';
    }
}

/** Error thrown when transaction confirmation times out */
export class TransactionTimeoutError extends Error {
    constructor(public readonly signature: string) {
        super(`Transaction confirmation timed out for ${signature}`);
        this.name = 'TransactionTimeoutError';
    }
}
