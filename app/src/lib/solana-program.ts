import { Connection, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { getAssociatedTokenAddressSync, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { PROGRAM_ID, XP_TOKEN_MINT, METAPLEX_CORE_PROGRAM, DEVNET_RPC } from "@/lib/constants";

// ────────────────────────────────────────────────────────────────
// Solana Program Integration
// PDA derivation, token reads, and transaction builders for the
// Superteam Academy on-chain program.
// ────────────────────────────────────────────────────────────────

const programId = new PublicKey(PROGRAM_ID);
const xpMint = new PublicKey(XP_TOKEN_MINT);
const metaplexCore = new PublicKey(METAPLEX_CORE_PROGRAM);

/**
 * Derive all PDA addresses used by the Academy program.
 * See docs/SPEC.md for the full seed specifications.
 */
export const PDAs = {
    /** Global program config PDA */
    config(): [PublicKey, number] {
        return PublicKey.findProgramAddressSync(
            [Buffer.from("config")],
            programId
        );
    },

    /** Course PDA — seeds: ["course", course_id (u64 LE)] */
    course(courseId: number): [PublicKey, number] {
        const buf = Buffer.alloc(8);
        buf.writeBigUInt64LE(BigInt(courseId));
        return PublicKey.findProgramAddressSync(
            [Buffer.from("course"), buf],
            programId
        );
    },

    /** Enrollment PDA — seeds: ["enrollment", course_id (u64 LE), learner pubkey] */
    enrollment(courseId: number, learner: PublicKey): [PublicKey, number] {
        const buf = Buffer.alloc(8);
        buf.writeBigUInt64LE(BigInt(courseId));
        return PublicKey.findProgramAddressSync(
            [Buffer.from("enrollment"), buf, learner.toBytes()],
            programId
        );
    },

    /** Minter role PDA — seeds: ["minter_role", minter pubkey] */
    minterRole(minter: PublicKey): [PublicKey, number] {
        return PublicKey.findProgramAddressSync(
            [Buffer.from("minter_role"), minter.toBytes()],
            programId
        );
    },

    /** Achievement type PDA — seeds: ["achievement_type", type_id (u64 LE)] */
    achievementType(typeId: number): [PublicKey, number] {
        const buf = Buffer.alloc(8);
        buf.writeBigUInt64LE(BigInt(typeId));
        return PublicKey.findProgramAddressSync(
            [Buffer.from("achievement_type"), buf],
            programId
        );
    },

    /** Achievement receipt PDA — seeds: ["achievement_receipt", type_id (u64 LE), recipient pubkey] */
    achievementReceipt(typeId: number, recipient: PublicKey): [PublicKey, number] {
        const buf = Buffer.alloc(8);
        buf.writeBigUInt64LE(BigInt(typeId));
        return PublicKey.findProgramAddressSync(
            [Buffer.from("achievement_receipt"), buf, recipient.toBytes()],
            programId
        );
    },

    /** Credential PDA — seeds: ["credential", track string, learner pubkey] */
    credential(track: string, learner: PublicKey): [PublicKey, number] {
        return PublicKey.findProgramAddressSync(
            [Buffer.from("credential"), Buffer.from(track), learner.toBytes()],
            programId
        );
    },
};

/**
 * Get a learner's XP balance from their Token-2022 token account.
 * XP is a soulbound (NonTransferable) fungible token.
 */
export async function getXPBalance(
    connection: Connection,
    walletAddress: PublicKey
): Promise<number> {
    try {
        const ata = getAssociatedTokenAddressSync(
            xpMint,
            walletAddress,
            false,
            TOKEN_2022_PROGRAM_ID
        );

        const accountInfo = await connection.getTokenAccountBalance(ata);
        return Number(accountInfo.value.amount);
    } catch (error) {
        // Account doesn't exist yet = 0 XP
        console.warn("XP balance read failed (account may not exist):", error);
        return 0;
    }
}

/**
 * Get the learner's XP level from their balance.
 * Level = floor(sqrt(xp / 100))
 */
export function calculateLevelFromXP(xp: number): number {
    return Math.floor(Math.sqrt(xp / 100));
}

/**
 * Check if a learner is enrolled in a course by checking if the enrollment PDA exists.
 */
export async function checkEnrollment(
    connection: Connection,
    courseId: number,
    learner: PublicKey
): Promise<boolean> {
    try {
        const [enrollmentPDA] = PDAs.enrollment(courseId, learner);
        const account = await connection.getAccountInfo(enrollmentPDA);
        return account !== null;
    } catch {
        return false;
    }
}

/**
 * Get enrollment data from on-chain PDA.
 * Returns lesson bitmap, completion status, and enrolled timestamp.
 */
export async function getEnrollmentData(
    connection: Connection,
    courseId: number,
    learner: PublicKey
): Promise<{
    enrolled: boolean;
    lessonFlags: number[];
    completedAt: number | null;
} | null> {
    try {
        const [enrollmentPDA] = PDAs.enrollment(courseId, learner);
        const account = await connection.getAccountInfo(enrollmentPDA);
        if (!account) return null;

        // Parse the enrollment account data
        // Layout: discriminator(8) + course_id(8) + learner(32) + lesson_flags(4*8=32) + enrolled_at(8) + completed_at(9)
        const data = account.data;
        const lessonFlags: number[] = [];
        for (let i = 0; i < 4; i++) {
            lessonFlags.push(Number(data.readBigUInt64LE(48 + i * 8)));
        }
        const completedAtOffset = 48 + 32 + 8;
        const hasCompleted = data[completedAtOffset] === 1;
        const completedAt = hasCompleted
            ? Number(data.readBigInt64LE(completedAtOffset + 1))
            : null;

        return { enrolled: true, lessonFlags, completedAt };
    } catch (error) {
        console.warn("Failed to read enrollment:", error);
        return null;
    }
}

/**
 * Fetch credential NFTs owned by a wallet using Helius DAS API.
 * Filters for Metaplex Core assets with the Academy program as authority.
 */
export async function getCredentialNFTs(
    walletAddress: string,
    heliusApiKey?: string
): Promise<CredentialNFT[]> {
    const url = heliusApiKey
        ? `https://devnet.helius-rpc.com/?api-key=${heliusApiKey}`
        : DEVNET_RPC;

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                jsonrpc: "2.0",
                id: "credential-check",
                method: "getAssetsByOwner",
                params: {
                    ownerAddress: walletAddress,
                    page: 1,
                    limit: 50,
                    displayOptions: {
                        showUnverifiedCollections: true,
                        showCollectionMetadata: true,
                    },
                },
            }),
        });

        const data = await response.json();
        if (!data.result?.items) return [];

        // Filter for Academy credential NFTs
        return data.result.items
            .filter((item: any) => {
                // Filter by update authority matching our program or known credential collection
                return (
                    item.authorities?.some(
                        (auth: any) => auth.address === PROGRAM_ID
                    ) || item.grouping?.some(
                        (g: any) => g.group_key === "collection"
                    )
                );
            })
            .map((item: any) => ({
                id: item.id,
                name: item.content?.metadata?.name || "Academy Credential",
                description: item.content?.metadata?.description || "",
                image: item.content?.files?.[0]?.uri || item.content?.links?.image || "",
                mintAddress: item.id,
                attributes: item.content?.metadata?.attributes || [],
                owner: walletAddress,
                track: item.content?.metadata?.attributes?.find(
                    (a: any) => a.trait_type === "track"
                )?.value || "Unknown",
                level: Number(
                    item.content?.metadata?.attributes?.find(
                        (a: any) => a.trait_type === "level"
                    )?.value || 0
                ),
                totalXP: Number(
                    item.content?.metadata?.attributes?.find(
                        (a: any) => a.trait_type === "total_xp"
                    )?.value || 0
                ),
                coursesCompleted: Number(
                    item.content?.metadata?.attributes?.find(
                        (a: any) => a.trait_type === "courses_completed"
                    )?.value || 0
                ),
            }));
    } catch (error) {
        console.warn("Failed to fetch credential NFTs:", error);
        return [];
    }
}

/**
 * Fetch XP token balances for leaderboard ranking.
 * Uses Helius DAS API to get all holders of the XP token.
 */
export async function getLeaderboardFromChain(
    heliusApiKey?: string
): Promise<LeaderboardOnChainEntry[]> {
    const url = heliusApiKey
        ? `https://devnet.helius-rpc.com/?api-key=${heliusApiKey}`
        : DEVNET_RPC;

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                jsonrpc: "2.0",
                id: "leaderboard",
                method: "getTokenAccounts",
                params: {
                    mint: XP_TOKEN_MINT,
                    page: 1,
                    limit: 100,
                },
            }),
        });

        const data = await response.json();
        if (!data.result?.token_accounts) return [];

        const entries: LeaderboardOnChainEntry[] = data.result.token_accounts
            .map((account: any) => ({
                walletAddress: account.owner,
                xp: Number(account.amount),
                level: calculateLevelFromXP(Number(account.amount)),
            }))
            .sort((a: LeaderboardOnChainEntry, b: LeaderboardOnChainEntry) => b.xp - a.xp)
            .map((entry: LeaderboardOnChainEntry, index: number) => ({
                ...entry,
                rank: index + 1,
            }));

        return entries;
    } catch (error) {
        console.warn("Failed to fetch leaderboard from chain:", error);
        return [];
    }
}

/**
 * Build the enrollment transaction for a course.
 * This is signed directly by the learner (no backend needed).
 */
export async function buildEnrollTransaction(
    connection: Connection,
    courseId: number,
    learner: PublicKey
): Promise<Transaction> {
    const [configPDA] = PDAs.config();
    const [coursePDA] = PDAs.course(courseId);
    const [enrollmentPDA] = PDAs.enrollment(courseId, learner);

    // Build Anchor instruction for enroll_learner
    // Discriminator for "enroll_learner" = first 8 bytes of SHA256("global:enroll_learner")
    const discriminator = Buffer.from([0x1d, 0x7f, 0x84, 0x33, 0x4c, 0x9a, 0x85, 0x5b]);

    const courseIdBuf = Buffer.alloc(8);
    courseIdBuf.writeBigUInt64LE(BigInt(courseId));

    const data = Buffer.concat([discriminator, courseIdBuf]);

    const instruction = {
        keys: [
            { pubkey: learner, isSigner: true, isWritable: true },
            { pubkey: configPDA, isSigner: false, isWritable: false },
            { pubkey: coursePDA, isSigner: false, isWritable: true },
            { pubkey: enrollmentPDA, isSigner: false, isWritable: true },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId,
        data,
    };

    const transaction = new Transaction().add(instruction);
    transaction.feePayer = learner;
    const latestBlockhash = await connection.getLatestBlockhash();
    transaction.recentBlockhash = latestBlockhash.blockhash;

    return transaction;
}

// ── Types ──

export interface CredentialNFT {
    id: string;
    name: string;
    description: string;
    image: string;
    mintAddress: string;
    attributes: Array<{ trait_type: string; value: string }>;
    owner: string;
    track: string;
    level: number;
    totalXP: number;
    coursesCompleted: number;
}

export interface LeaderboardOnChainEntry {
    walletAddress: string;
    xp: number;
    level: number;
    rank?: number;
}
