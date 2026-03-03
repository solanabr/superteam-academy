
import {
    Connection,
    PublicKey,
    Transaction,
    SystemProgram,
    Keypair,
} from "@solana/web3.js";
import { Program, AnchorProvider, BN } from "@coral-xyz/anchor";
import { LearningProgressService } from "./interface";
// @ts-ignore
import onchainAcademyIdl from "@/lib/idl/onchain_academy.json";
// import { prisma } from "@/lib/db"; // Removed for browser safety
import { withFallbackRPC, HELIUS_RPC } from "@/lib/solana-connection";
import { TOKEN_2022_PROGRAM_ID, getAssociatedTokenAddressSync, createAssociatedTokenAccountIdempotentInstruction } from "@solana/spl-token";
import bs58 from "bs58";
import { getLevelFromXp } from "@/lib/ranks";

// Utils for PDAs
const PROGRAM_ID = new PublicKey("AVES32TXPwZ7kuVizTZsqzBr1UVYrcZyqQ6BxHaGchWU");
const BACKEND_WALLET_KEY = process.env.BACKEND_WALLET_PRIVATE_KEY;
const MPL_CORE_PROGRAM_ID = new PublicKey("CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");

export class OnChainLearningService implements LearningProgressService {
    private connection: Connection;
    private program: Program<any>;
    private dbService?: LearningProgressService;

    constructor(connection: Connection, dbService?: LearningProgressService) {
        this.connection = connection;
        this.dbService = dbService;
        const provider = new AnchorProvider(
            connection,
            { publicKey: PublicKey.default, signTransaction: async () => { throw new Error("Read-only") }, signAllTransactions: async () => { throw new Error("Read-only") } },
            AnchorProvider.defaultOptions()
        );
        this.program = new Program(onchainAcademyIdl as any, provider);
    }

    private async withProgram<T>(operation: (program: Program<any>, connection: Connection) => Promise<T>): Promise<T> {
        return await withFallbackRPC(async (connection) => {
            const provider = new AnchorProvider(
                connection,
                { publicKey: PublicKey.default, signTransaction: async () => { throw new Error("Read-only") }, signAllTransactions: async () => { throw new Error("Read-only") } },
                AnchorProvider.defaultOptions()
            );
            const program = new Program(onchainAcademyIdl as any, provider);
            return await operation(program, connection);
        });
    }

    private async withBackendProgram<T>(operation: (program: Program<any>, connection: Connection, backendWallet: Keypair) => Promise<T>): Promise<T> {
        if (!BACKEND_WALLET_KEY) throw new Error("BACKEND_WALLET_PRIVATE_KEY is missing");

        return await withFallbackRPC(async (connection) => {
            const backendWallet = Keypair.fromSecretKey(bs58.decode(BACKEND_WALLET_KEY));
            const provider = new AnchorProvider(
                connection,
                {
                    publicKey: backendWallet.publicKey,
                    signTransaction: async (tx: any) => { tx.sign(backendWallet); return tx; },
                    signAllTransactions: async (txs: any[]) => { txs.forEach(t => t.sign(backendWallet)); return txs; }
                },
                AnchorProvider.defaultOptions()
            );
            const program = new Program(onchainAcademyIdl as any, provider);
            return await operation(program, connection, backendWallet);
        });
    }

    // PDA Helpers
    private getCoursePDA(courseId: string) {
        return PublicKey.findProgramAddressSync(
            [Buffer.from("course"), Buffer.from(courseId)],
            this.program.programId
        )[0];
    }

    private getEnrollmentPDA(courseId: string, userKey: PublicKey) {
        return PublicKey.findProgramAddressSync(
            [Buffer.from("enrollment"), Buffer.from(courseId), userKey.toBuffer()],
            this.program.programId
        )[0];
    }

    // --- READ Methods ---

    async getProgress(userId: string): Promise<any> {
        // Parallelize XP fetch (RPC) and Database fetch (Service)
        const [xpResult, dbResult] = await Promise.allSettled([
            this.getXP(userId),
            this.dbService ? this.dbService.getProgress(userId) : Promise.resolve(null)
        ]);

        const xp = xpResult.status === "fulfilled" ? xpResult.value : 0;
        const progress = dbResult.status === "fulfilled" ? dbResult.value : null;

        /**
         * HYBRID SYNC: If the database XP is out of sync, we delegate to dbService.
         * The dbService (prisma-impl) should handle the actual DB update.
         */
        if (this.dbService && progress && progress.xp !== xp) {
            // Note: We don't have a specific "syncXP" on the interface, 
            // but prisma-impl handles XP synchronization during completeLesson/claimBonus.
            // For general read-sync, we rely on the next write operation or manual sync.
        }

        if (!progress) {
            return { xp, currentStreak: 0, longestStreak: 0, lastActivityDate: null, achievementFlags: [] };
        }

        return {
            xp,
            currentStreak: progress.currentStreak,
            longestStreak: progress.longestStreak,
            lastActivityDate: progress.lastActivityDate,
            achievementFlags: progress.achievementFlags
        };
    }

    async getEnrollmentProgress(userId: string, courseId: string): Promise<any> {
        // 1. Resolve identifier to wallet address if needed
        let walletAddress = userId;
        const isWallet = userId.length >= 32 && userId.length <= 44 && !userId.includes("-");

        if (!isWallet && this.dbService) {
            // If we have a dbService, we might be on the server. 
            // We need to resolve the internal userId to a walletAddress.
            // However, the OnChain service primarily works with wallets.
            // If the caller passed a UUID, we try to fetch the wallet via dbService if it supports a way to resolve it.
            // For now, if it's not a wallet, we fallback to DB service.
            return await this.dbService.getEnrollmentProgress(userId, courseId);
        }

        // 2. Fetch from On-Chain
        return await this.withProgram(async (program, connection) => {
            try {
                const userKey = new PublicKey(walletAddress);
                const enrollmentPda = this.getEnrollmentPDA(courseId, userKey);
                const coursePda = this.getCoursePDA(courseId);

                const [enrollmentResult, courseResult] = await Promise.allSettled([
                    (program.account as any).enrollment.fetchNullable(enrollmentPda),
                    (program.account as any).course.fetch(coursePda)
                ]);

                if (enrollmentResult.status === "rejected" || !enrollmentResult.value) {
                    if (!this.dbService) return null;
                    const progress = await this.dbService.getEnrollmentProgress(userId, courseId);
                    return progress ? { ...progress, onChainActive: false } : null;
                }

                const enrollment = enrollmentResult.value;
                const courseAccount = courseResult.status === "fulfilled" ? courseResult.value : { lessonCount: 0 };

                const buffer = Buffer.alloc(32);
                enrollment.lessonFlags.forEach((bn: BN, i: number) => {
                    const bytes = bn.toArrayLike(Buffer, 'le', 8);
                    bytes.copy(buffer, i * 8);
                });

                const countSetBits = (buf: Buffer) => {
                    let count = 0;
                    for (let byte of buf) {
                        let b = byte;
                        while (b > 0) {
                            count += b & 1;
                            b >>= 1;
                        }
                    }
                    return count;
                };

                return {
                    courseId,
                    lessonFlags: buffer,
                    completedAt: enrollment.completedAt ? new Date(enrollment.completedAt.toNumber() * 1000) : null,
                    bonusClaimed: false,
                    completedCount: countSetBits(buffer),
                    totalLessons: courseAccount.lessonCount,
                    onChainActive: true
                };
            } catch (e) {
                if (!this.dbService) return null;
                const progress = await this.dbService.getEnrollmentProgress(userId, courseId);
                return progress ? { ...progress, onChainActive: false } : null;
            }
        });
    }

    async getXP(userId: string): Promise<number> {
        const { getCached } = await import("@/lib/cache");
        return await getCached(`user:${userId}:xp`, async () => {
            return await this.withProgram(async (program, connection) => {
                const [configPda] = PublicKey.findProgramAddressSync(
                    [Buffer.from("config")],
                    program.programId
                );
                const configAccount = await (program.account as any).config.fetch(configPda);
                const xpMint = configAccount.xpMint;

                const userKey = new PublicKey(userId);
                const accounts = await connection.getTokenAccountsByOwner(userKey, { mint: xpMint });

                if (accounts.value.length === 0) return 0;

                const balance = await connection.getTokenAccountBalance(accounts.value[0].pubkey);
                return balance.value.uiAmount || 0;
            });
        }, { ttl: 60 });
    }

    async getStreak(userId: string): Promise<any> {
        // Hybrid Implementation: Streaks are always off-chain
        if (!this.dbService) return { currentStreak: 0, longestStreak: 0, lastActivityDate: null };
        return this.dbService.getStreak(userId);
    }

    async getLeaderboard(options?: { limit?: number; page?: number; timeframe?: "daily" | "weekly" | "all-time"; courseId?: string }): Promise<any[]> {
        if (!this.dbService) return [];
        return this.dbService.getLeaderboard(options);
    }

    private assetCache = new Map<string, { items: any[]; expires: number }>();

    private async getOnChainAssets(owner: string): Promise<any[]> {
        const now = Date.now();
        const cached = this.assetCache.get(owner);
        if (cached && cached.expires > now) {
            return cached.items;
        }

        const heliusUrl = HELIUS_RPC;
        const response = await fetch(heliusUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 'get-assets',
                method: 'getAssetsByOwner',
                params: {
                    ownerAddress: owner,
                    page: 1,
                    limit: 100, // Reasonable limit for academic credentials
                    displayOptions: { showCollectionMetadata: true },
                },
            }),
        });

        const data = await response.json();
        if (data.error) {
            if (data.error.code === -32401) {
                console.warn("[onchain-impl] Helius API key is invalid or missing.");
            } else {
                console.error("Helius DAS Error:", data.error);
            }
            return [];
        }

        const items = data.result?.items || [];
        this.assetCache.set(owner, { items, expires: now + 30000 }); // 30s cache
        return items;
    }

    async getCredentials(userId: string, options?: { limit?: number; skip?: number }): Promise<any[]> {
        try {
            // Validate public key
            try { new PublicKey(userId); } catch (e) { return []; }

            const items = await this.getOnChainAssets(userId);

            // Filter for Academy Credentials
            const filteredAssets = items.filter((asset: any) => {
                const metadataName = asset.content?.metadata?.name || "";
                return metadataName.includes("Credential") ||
                    asset.content?.metadata?.attributes?.some((a: any) => a.trait_type === "Track");
            });

            // Fetch true earnedAt dates and course info from DB if possible
            const dbCreds = this.dbService ? await this.dbService.getCredentials(userId) : [];

            const credentials = filteredAssets.map((asset: any) => {
                const attrs = asset.content?.metadata?.attributes || [];
                const track = attrs.find((a: any) => a.trait_type === "Track")?.value || "General";
                const level = attrs.find((a: any) => a.trait_type === "Level")?.value;
                const xp = attrs.find((a: any) => a.trait_type === "XP")?.value;
                const courses = attrs.find((a: any) => a.trait_type === "Courses Completed")?.value;

                // Match with DB record
                const dbMatch = dbCreds.find((c: any) => c.id === asset.id || c.mintAddress === asset.id);
                const earnedAt = dbMatch ? (typeof dbMatch.earnedAt === 'string' ? dbMatch.earnedAt : (dbMatch.earnedAt as Date).toISOString()) : new Date().toISOString();
                const trackName = dbMatch?.trackName || track;
                const trackId = dbMatch?.trackId || track.toLowerCase().replace(/\s/g, "-");

                return {
                    id: asset.id,
                    userId: asset.ownership.owner,
                    walletAddress: asset.ownership.owner,
                    courseId: dbMatch?.courseId || null,
                    courseName: dbMatch?.courseName || null,
                    trackId,
                    trackName,
                    level: level ? parseInt(level) : 1,
                    coursesCompleted: courses ? parseInt(courses) : 1,
                    totalXpEarned: xp ? parseInt(xp) : 0,
                    earnedAt,
                    metadataUrl: asset.content?.json_uri,
                    image: asset.content?.links?.image || asset.content?.files?.[0]?.uri,
                };
            });

            // Handle pagination for on-chain
            let paginated = credentials;
            if (options?.skip !== undefined || options?.limit !== undefined) {
                const skipAmount = options.skip || 0;
                const limitAmount = options.limit || credentials.length;
                paginated = credentials.slice(skipAmount, skipAmount + limitAmount);
            }

            return paginated;

        } catch (e) {
            console.error("Failed to fetch credentials from DAS", e);
            return [];
        }
    }

    async getCredential(id: string): Promise<any | null> {
        try {
            const heliusUrl = HELIUS_RPC;
            const response = await fetch(heliusUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 'get-asset',
                    method: 'getAsset',
                    params: { id }
                }),
            });

            const data = await response.json();
            if (data.error) {
                if (data.error.code === -32401) {
                    console.warn("[onchain-impl] Helius API key is invalid or missing. Credential details unavailable.");
                } else {
                    console.error("Helius DAS Error:", data.error);
                }
                return null;
            }
            const result = data.result;
            if (!result) return null;

            const asset = result;
            const attrs = asset.content?.metadata?.attributes || [];
            const track = attrs.find((a: any) => a.trait_type === "Track")?.value || "General";
            const level = attrs.find((a: any) => a.trait_type === "Level")?.value || "1";
            const xp = attrs.find((a: any) => a.trait_type === "XP")?.value || "0";
            const courses = attrs.find((a: any) => a.trait_type === "Courses Completed")?.value || "1";

            // Try to find the matching record in DB
            let earnedAt = new Date().toISOString();
            let trackName = track;
            let trackId = track.toLowerCase().replace(/\s/g, "-");

            const dbCred = this.dbService ? await this.dbService.getCredential(id) : null;
            if (dbCred) {
                earnedAt = typeof dbCred.earnedAt === 'string' ? dbCred.earnedAt : (dbCred.earnedAt as Date).toISOString();
                if (dbCred.trackName) trackName = dbCred.trackName;
                if (dbCred.trackId) trackId = dbCred.trackId;
            }

            return {
                id: asset.id,
                userId: asset.ownership.owner,
                walletAddress: asset.ownership.owner,
                trackId,
                trackName,
                level: parseInt(level.toString()),
                coursesCompleted: parseInt(courses.toString()),
                totalXpEarned: parseInt(xp.toString()),
                earnedAt,
                metadataUrl: asset.content?.json_uri,
                mintAddress: asset.id,
                image: asset.content?.links?.image || asset.content?.files?.[0]?.uri,
            };
        } catch (e) {
            console.error("Failed to fetch credential", e);
            return null;
        }
    }

    // --- WRITE Methods ---

    async enroll(userId: string, courseId: string): Promise<any> {
        // 1. Sync to DB if we have a service (server-side)
        if (this.dbService) {
            await this.dbService.enroll(userId, courseId).catch(e => console.error("[onchain-service] DB sync failed", e));
        }

        // 2. Generate on-chain transaction
        return await this.withProgram(async (program, connection) => {
            const userKey = new PublicKey(userId);
            const coursePda = this.getCoursePDA(courseId);
            const enrollmentPda = this.getEnrollmentPDA(courseId, userKey);

            const tx = await (program.methods as any)
                .enroll(courseId)
                .accounts({
                    course: coursePda,
                    enrollment: enrollmentPda,
                    learner: userKey,
                    systemProgram: SystemProgram.programId,
                } as any)
                .transaction();

            tx.feePayer = userKey;
            tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

            return tx;
        });
    }

    async unenroll(userId: string, courseId: string): Promise<any> {
        // 1. Resolve identifier to wallet address if needed
        let walletAddress = userId;
        const isWallet = userId.length >= 32 && userId.length <= 44 && !userId.includes("-");

        if (!isWallet && this.dbService) {
            // If we have a dbService, it's on the server.
            // Delegate to dbService (unenroll is already implemented there)
            return await this.dbService.unenroll(userId, courseId);
        }

        // 2. Generate on-chain transaction
        return await this.withProgram(async (program, connection) => {
            const userKey = new PublicKey(walletAddress);
            const coursePda = this.getCoursePDA(courseId);
            const enrollmentPda = this.getEnrollmentPDA(courseId, userKey);

            const tx = await (program.methods as any)
                .closeEnrollment()
                .accounts({
                    course: coursePda,
                    enrollment: enrollmentPda,
                    learner: userKey,
                } as any)
                .transaction();

            tx.feePayer = userKey;
            tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

            return tx;
        });
    }

    async completeLesson(params: { userId: string; courseId: string; lessonIndex: number; xpReward: number }): Promise<void> {
        if (this.dbService) {
            // Server-side: Execute on-chain lesson completion using backend signer
            await this.withBackendProgram(async (program, connection, backendWallet) => {
                const learner = new PublicKey(params.userId);
                const [coursePda] = PublicKey.findProgramAddressSync([Buffer.from("course"), Buffer.from(params.courseId)], program.programId);
                const [enrollmentPda] = PublicKey.findProgramAddressSync([Buffer.from("enrollment"), Buffer.from(params.courseId), learner.toBuffer()], program.programId);
                const [configPda] = PublicKey.findProgramAddressSync([Buffer.from("config")], program.programId);

                const config = await (program.account as any).config.fetch(configPda);

                const learnerTokenAccounts = await connection.getTokenAccountsByOwner(learner, { mint: config.xpMint });
                const learnerTokenAccount = learnerTokenAccounts.value[0]?.pubkey;

                if (!learnerTokenAccount) throw new Error("Learner XP token account missing");

                const tx = await (program.methods as any)
                    .completeLesson(params.lessonIndex)
                    .accounts({
                        config: configPda,
                        course: coursePda,
                        enrollment: enrollmentPda,
                        learner: learner,
                        learnerTokenAccount: learnerTokenAccount,
                        xpMint: config.xpMint,
                        backendSigner: backendWallet.publicKey,
                        tokenProgram: TOKEN_2022_PROGRAM_ID,
                    } as any)
                    .transaction();

                tx.feePayer = backendWallet.publicKey;
                tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
                tx.sign(backendWallet);

                const signature = await connection.sendRawTransaction(tx.serialize());
                await connection.confirmTransaction(signature);
                console.log(`[onchain-service] Lesson ${params.lessonIndex} completed on-chain: ${signature}`);
            });
            // Sync to DB
            await this.dbService.completeLesson(params);
        } else {
            const res = await fetch("/api/onchain/complete-lesson", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    wallet: params.userId,
                    courseId: params.courseId,
                    lessonIndex: params.lessonIndex
                })
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to complete lesson on-chain via API");
            }
        }
    }

    async finalizeCourse(userId: string, courseId: string, lessonCount: number): Promise<void> {
        if (typeof window === "undefined") {
            // Server-side: Execute on-chain logic directly using backend signer
            console.log(`[onchain-service] finalizeCourse: START for user ${userId}, course ${courseId}`);
            await this.withBackendProgram(async (program, connection, backendWallet) => {
                const learner = new PublicKey(userId);
                const [configPda] = PublicKey.findProgramAddressSync([Buffer.from("config")], program.programId);
                let config: any;
                try {
                    config = await (program.account as any).config.fetch(configPda);
                } catch (e) {
                    console.error(`[onchain-service] CRITICAL: Config account not found at ${configPda.toBase58()}. Program must be initialized.`);
                    throw new Error("On-chain program configuration is missing. Please contact an administrator.");
                }

                console.log(`[onchain-service] finalizeCourse: configPda=${configPda.toBase58()}, xpMint=${config.xpMint.toBase58()}`);

                // Find token accounts
                const learnerTokenAccounts = await connection.getTokenAccountsByOwner(learner, { mint: config.xpMint });
                let learnerTokenAccount = learnerTokenAccounts.value[0]?.pubkey;

                const [coursePda] = PublicKey.findProgramAddressSync([Buffer.from("course"), Buffer.from(courseId)], program.programId);
                const course = await (program.account as any).course.fetch(coursePda);
                const creator = course.creator;
                const creatorTokenAccounts = await connection.getTokenAccountsByOwner(creator, { mint: config.xpMint });
                let creatorTokenAccount = creatorTokenAccounts.value[0]?.pubkey;

                const enrollmentPda = this.getEnrollmentPDA(courseId, learner);

                console.log(`[onchain-service] finalizeCourse: derived PDAs: course=${coursePda.toBase58()}, enrollment=${enrollmentPda.toBase58()}`);
                console.log(`[onchain-service] finalizeCourse: existing tokens: learner=${learnerTokenAccount?.toBase58()}, creator=${creatorTokenAccount?.toBase58()}`);

                const tx = new Transaction();

                if (!learnerTokenAccount) {
                    learnerTokenAccount = getAssociatedTokenAddressSync(config.xpMint, learner, true, TOKEN_2022_PROGRAM_ID);
                    tx.add(
                        createAssociatedTokenAccountIdempotentInstruction(
                            backendWallet.publicKey,
                            learnerTokenAccount,
                            learner,
                            config.xpMint,
                            TOKEN_2022_PROGRAM_ID
                        )
                    );
                    console.log(`[onchain-service] finalizeCourse: Adding instruction to create missing learner ATA: ${learnerTokenAccount.toBase58()}`);
                }

                if (!creatorTokenAccount) {
                    creatorTokenAccount = getAssociatedTokenAddressSync(config.xpMint, creator, true, TOKEN_2022_PROGRAM_ID);
                    tx.add(
                        createAssociatedTokenAccountIdempotentInstruction(
                            backendWallet.publicKey,
                            creatorTokenAccount,
                            creator,
                            config.xpMint,
                            TOKEN_2022_PROGRAM_ID
                        )
                    );
                    console.log(`[onchain-service] finalizeCourse: Adding instruction to create missing creator ATA: ${creatorTokenAccount.toBase58()}`);
                }

                console.log(`[onchain-service] finalizeCourse: Building transaction for learner ${learner.toBase58()} and creator ${creator.toBase58()}`);
                const finalizeIz = await (program.methods as any)
                    .finalizeCourse()
                    .accounts({
                        config: configPda,
                        course: coursePda,
                        enrollment: enrollmentPda,
                        learner: learner,
                        learnerTokenAccount: learnerTokenAccount,
                        creatorTokenAccount: creatorTokenAccount,
                        creator: creator,
                        xpMint: config.xpMint,
                        backendSigner: backendWallet.publicKey,
                        tokenProgram: TOKEN_2022_PROGRAM_ID,
                    } as any)
                    .instruction();

                tx.add(finalizeIz);

                tx.feePayer = backendWallet.publicKey;
                tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
                tx.sign(backendWallet);

                const signature = await connection.sendRawTransaction(tx.serialize());
                console.log(`[onchain-service] finalizeCourse: TX sent, signature=${signature}`);
                await connection.confirmTransaction(signature);
                console.log(`[onchain-service] finalizeCourse: SUCCESS! signature=${signature}`);
            });
        } else {
            // Client-side: use API
            const res = await fetch("/api/onchain/finalize-course", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    wallet: userId,
                    courseId: courseId
                })
            });
            if (!res.ok) throw new Error("Failed to finalize course via API");
        }
    }

    async claimCompletionBonus(userId: string, courseId: string, xpAmount: number): Promise<void> {
        if (this.dbService) {
            await this.withBackendProgram(async (program, connection, backendWallet) => {
                const learner = new PublicKey(userId);
                const [configPda] = PublicKey.findProgramAddressSync([Buffer.from("config")], program.programId);
                const config = await (program.account as any).config.fetch(configPda);

                const learnerTokenAccounts = await connection.getTokenAccountsByOwner(learner, { mint: config.xpMint });
                const learnerTokenAccount = learnerTokenAccounts.value[0]?.pubkey;

                if (!learnerTokenAccount) throw new Error("Learner XP token account missing");

                const tx = await (program.methods as any)
                    .claimBonus(new BN(xpAmount))
                    .accounts({
                        config: configPda,
                        learner: learner,
                        learnerTokenAccount: learnerTokenAccount,
                        xpMint: config.xpMint,
                        backendSigner: backendWallet.publicKey,
                        tokenProgram: TOKEN_2022_PROGRAM_ID,
                    } as any)
                    .transaction();

                tx.feePayer = backendWallet.publicKey;
                tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
                tx.sign(backendWallet);

                const signature = await connection.sendRawTransaction(tx.serialize());
                await connection.confirmTransaction(signature);
                console.log(`[onchain-service] Bonus claimed on-chain: ${signature}`);

                // SYNC TO DB
                if (this.dbService) {
                    await this.dbService.claimCompletionBonus(userId, courseId, xpAmount).catch(e => console.error("[onchain-sync] Bonus DB sync failed:", e));
                }
            });
        } else {
            const res = await fetch("/api/onchain/claim-bonus", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ wallet: userId, xpAmount })
            });
            if (!res.ok) throw new Error("Failed to claim on-chain bonus via API");
        }
    }

    async issueCredential(params: { userId: string; wallet?: string; courseId: string; courseName?: string; trackId: string; trackName: string; xpEarned: number }): Promise<string> {
        if (typeof window === "undefined") {
            // Server-side: Issue NFT Credential using Metaplex Core
            const { userId, wallet, courseId, courseName, trackId, trackName, xpEarned } = params;
            const targetWallet = wallet || userId;

            if (!targetWallet) {
                throw new Error("[onchain-service] issueCredential: No target wallet provided.");
            }

            console.log(`[onchain-service] Starting issueCredential for ${targetWallet} (Course: ${courseId}, Track: ${trackId})`);

            return await this.withBackendProgram(async (program, connection, backendWallet) => {
                let learner: PublicKey;
                try {
                    learner = new PublicKey(targetWallet);
                } catch (e) {
                    console.error(`[onchain-service] Invalid learner public key: ${targetWallet}`);
                    throw new Error(`Invalid learner public key: ${targetWallet}`);
                }
                const asset = Keypair.generate();
                const [configPda] = PublicKey.findProgramAddressSync([Buffer.from("config")], program.programId);
                const config = await (program.account as any).config.fetch(configPda);

                // We use the issue_credential instruction from the IDL:
                // credential_name, metadata_uri, courses_completed, total_xp
                const credentialName = courseName ? `${courseName} Certificate` : `${trackName} Certificate`;
                const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
                const metadataUri = `${appUrl}/api/metadata/credential/${asset.publicKey.toBase58()}`;

                const collectionAddress = process.env.NEXT_PUBLIC_COLLECTION_ADDRESS;
                if (!collectionAddress) {
                    console.warn("[onchain-service] issueCredential: NEXT_PUBLIC_COLLECTION_ADDRESS is missing. Skipping on-chain NFT minting.");
                    // We still proceed to sync with Prisma below if possible, 
                    // or we return a dummy/success as we've already done the DB work in graduation route usually.
                    // Actually, let's just return a placeholder or throw a specific error that the route can catch.
                    // The graduation route expects this to return the mintAddress.
                    return "SKIPPED_NO_COLLECTION";
                }

                // CRITICAL: Use courseId for PDA derivation, not trackId
                const [coursePda] = PublicKey.findProgramAddressSync([Buffer.from("course"), Buffer.from(courseId)], program.programId);
                const enrollmentPda = this.getEnrollmentPDA(courseId, learner);

                console.log(`[onchain-service] issueCredential: PDA derived: Course=${coursePda.toBase58()}, Enrollment=${enrollmentPda.toBase58()}`);
                console.log(`[onchain-service] issueCredential: Asset to mint: ${asset.publicKey.toBase58()}`);
                console.log(`[onchain-service] issueCredential: Collection: ${collectionAddress}`);

                const tx = await (program.methods as any)
                    .issueCredential(
                        credentialName,
                        metadataUri,
                        1, // courses_completed
                        new BN(xpEarned) // total_xp
                    )
                    .accounts({
                        config: configPda,
                        course: coursePda,
                        enrollment: enrollmentPda,
                        learner: learner,
                        credentialAsset: asset.publicKey,
                        trackCollection: new PublicKey(collectionAddress),
                        payer: backendWallet.publicKey,
                        backendSigner: backendWallet.publicKey,
                        mplCoreProgram: MPL_CORE_PROGRAM_ID,
                        systemProgram: SystemProgram.programId,
                    } as any)
                    .transaction();

                tx.feePayer = backendWallet.publicKey;
                tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
                tx.partialSign(backendWallet);
                tx.partialSign(asset);

                const signature = await connection.sendRawTransaction(tx.serialize());
                console.log(`[onchain-service] issueCredential: TX sent, signature=${signature}`);
                await connection.confirmTransaction(signature);
                console.log(`[onchain-service] issueCredential: SUCCESS! signature=${signature}`);

                const mintAddress = asset.publicKey.toBase58();
                if (this.dbService) {
                    await this.dbService.issueCredential({
                        ...params,
                        mintAddress,
                        verificationUrl: `https://explorer.solana.com/address/${mintAddress}?cluster=devnet`
                    }).catch((e: any) => console.error("Failed to sync credential to DB:", e));
                }

                return mintAddress;
            });
        } else {
            const res = await fetch("/api/onchain/issue-credential", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    wallet: params.userId,
                    courseId: params.courseId,
                    courseName: params.courseName, // Added
                    trackId: params.trackId,
                    trackName: params.trackName,
                    xpEarned: params.xpEarned
                })
            });
            if (!res.ok) throw new Error("Failed to issue on-chain credential via API");
            const data = await res.json();
            return data.mintAddress;
        }
    }

    async completeQuiz(params: { userId: string; courseId: string; moduleId: string; quizId: string; xpReward: number; }): Promise<void> {
        // 1. Mint XP tokens on-chain for quiz completion
        if (this.dbService) {
            try {
                await this.withBackendProgram(async (program, connection, backendWallet) => {
                    const learner = new PublicKey(params.userId);
                    const [configPda] = PublicKey.findProgramAddressSync([Buffer.from("config")], program.programId);
                    const config = await (program.account as any).config.fetch(configPda);

                    const learnerTokenAccounts = await connection.getTokenAccountsByOwner(learner, { mint: config.xpMint });
                    const learnerTokenAccount = learnerTokenAccounts.value[0]?.pubkey;

                    if (!learnerTokenAccount) {
                        console.warn(`[onchain-service] Quiz XP: No token account for ${params.userId}, skipping on-chain mint.`);
                        return;
                    }

                    const [minterPda] = PublicKey.findProgramAddressSync(
                        [Buffer.from("minter"), backendWallet.publicKey.toBuffer()],
                        program.programId
                    );

                    const tx = await (program.methods as any)
                        .rewardXp(new BN(params.xpReward))
                        .accounts({
                            config: configPda,
                            minterRole: minterPda,
                            xpMint: config.xpMint,
                            recipientTokenAccount: learnerTokenAccount,
                            minter: backendWallet.publicKey,
                            tokenProgram: TOKEN_2022_PROGRAM_ID,
                        } as any)
                        .transaction();

                    tx.feePayer = backendWallet.publicKey;
                    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
                    tx.sign(backendWallet);

                    const signature = await connection.sendRawTransaction(tx.serialize());
                    await connection.confirmTransaction(signature);
                    console.log(`[onchain-service] Quiz ${params.quizId} XP minted on-chain: ${signature}`);
                });
            } catch (e) {
                console.error("[onchain-service] Quiz on-chain XP mint failed, proceeding with DB sync:", e);
            }

            // 2. Sync to DB (records XP + XpEvent)
            await this.dbService.completeQuiz(params);
        } else {
            // Client-side: use API
            const res = await fetch("/api/complete-quiz", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    walletAddress: params.userId,
                    courseId: params.courseId,
                    moduleId: params.moduleId,
                    quizId: params.quizId,
                    xpReward: params.xpReward
                })
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || "Failed to complete quiz");
            }
        }
    }

    async claimAchievement(userId: string, achievementId: string): Promise<boolean> {
        if (this.dbService) {
            return this.dbService.claimAchievement(userId, achievementId);
        }

        const res = await fetch("/api/onchain/claim-achievement", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ wallet: userId, achievementId })
        });

        if (!res.ok) {
            console.error("Failed to claim achievement");
            return false;
        }

        const data = await res.json();
        return data.claimed === true;
    }

    async logActivity(userId: string): Promise<boolean> {
        if (!this.dbService) return false;
        return this.dbService.logActivity(userId);
    }
}
