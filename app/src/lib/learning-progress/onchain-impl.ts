
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
import { prisma } from "@/lib/db";
import { withFallbackRPC, HELIUS_RPC } from "@/lib/solana-connection";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import bs58 from "bs58";

// Utils for PDAs
const PROGRAM_ID = new PublicKey("AVES32TXPwZ7kuVizTZsqzBr1UVYrcZyqQ6BxHaGchWU");
const BACKEND_WALLET_KEY = process.env.BACKEND_WALLET_PRIVATE_KEY;
const MPL_CORE_PROGRAM_ID = new PublicKey("CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");

export class OnChainLearningService implements LearningProgressService {
    private connection: Connection;
    private program: Program<any>;

    constructor(connection: Connection) {
        this.connection = connection;
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
        // Get XP from on-chain balance
        const xp = await this.getXP(userId);

        // Get streak and achievement flags from DB (off-chain) using Prisma
        const user = await prisma.user.findFirst({
            where: { OR: [{ walletAddress: userId }, { id: userId }] },
            include: { progress: true }
        });

        if (!user || !user.progress) {
            return { xp, currentStreak: 0, longestStreak: 0, lastActivityDate: null, achievementFlags: [] };
        }

        return {
            xp,
            currentStreak: user.progress.currentStreak,
            longestStreak: user.progress.longestStreak,
            lastActivityDate: user.progress.lastActivityDate,
            achievementFlags: user.progress.achievementFlags
        };
    }

    async getEnrollmentProgress(userId: string, courseId: string): Promise<any> {
        // 1. Resolve identifier to wallet address if needed
        let walletAddress = userId;
        const isWallet = userId.length >= 32 && userId.length <= 44 && !userId.includes("-");

        if (!isWallet) {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { walletAddress: true }
            });
            if (user?.walletAddress) {
                walletAddress = user.walletAddress;
            } else {
                // Not a wallet and not in DB - fall back to Prisma implementation
                const { createLearningProgressService } = await import("./prisma-impl");
                const prismaService = createLearningProgressService(prisma);
                return await prismaService.getEnrollmentProgress(userId, courseId);
            }
        }

        // 2. Try fetching from On-Chain
        return await this.withProgram(async (program, connection) => {
            try {
                const userKey = new PublicKey(walletAddress);
                const enrollmentPda = this.getEnrollmentPDA(courseId, userKey);

                const enrollment = await (program.account as any).enrollment.fetchNullable(enrollmentPda);
                if (!enrollment) {
                    // Not on-chain yet? Fall back to Prisma for hybrid sync
                    const { createLearningProgressService } = await import("./prisma-impl");
                    const prismaService = createLearningProgressService(prisma);
                    const progress = await prismaService.getEnrollmentProgress(walletAddress, courseId);
                    if (progress) {
                        return { ...progress, onChainActive: false };
                    }
                    return null;
                }

                // Fetch course to get total lesson count for simulation/UI consistency
                const coursePda = this.getCoursePDA(courseId);
                const courseAccount = await (program.account as any).course.fetch(coursePda);

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
                // Fallback to Prisma on any error (e.g. PublicKey conversion if walletAddress is still invalid)
                const { createLearningProgressService } = await import("./prisma-impl");
                const prismaService = createLearningProgressService(prisma);
                const progress = await prismaService.getEnrollmentProgress(walletAddress, courseId);
                return progress ? { ...progress, onChainActive: false } : null;
            }
        });
    }

    async getXP(userId: string): Promise<number> {
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
    }

    async getStreak(userId: string): Promise<any> {
        // Hybrid Implementation: Streaks are always off-chain (DB/Frontend)
        // We use Prisma directly here to fetch streak data even in On-Chain mode.
        try {
            // We need to resolve wallet to User ID if possible, or just query by wallet if schema supports it.
            // But 'progress' table uses internal User ID.
            // So we first find the user by wallet.
            const user = await prisma.user.findUnique({
                where: { walletAddress: userId },
                include: { progress: true }
            });

            if (!user || !user.progress) {
                return { currentStreak: 0, longestStreak: 0, lastActivityDate: null };
            }

            return {
                currentStreak: user.progress.currentStreak,
                longestStreak: user.progress.longestStreak,
                lastActivityDate: user.progress.lastActivityDate
            };
        } catch (e) {
            console.error("Failed to fetch streak", e);
            return { currentStreak: 0, longestStreak: 0, lastActivityDate: null };
        }
    }

    async getLeaderboard(options?: { limit?: number; timeframe?: "daily" | "weekly" | "all-time" }): Promise<any[]> {
        return await this.withProgram(async (program, connection) => {
            const [configPda] = PublicKey.findProgramAddressSync(
                [Buffer.from("config")],
                program.programId
            );
            const configAccount = await (program.account as any).config.fetch(configPda);
            const xpMint = configAccount.xpMint;

            const largestAccounts = await connection.getTokenLargestAccounts(xpMint);
            const topAccounts = largestAccounts.value.slice(0, options?.limit || 50);

            const accountInfos = await connection.getMultipleAccountsInfo(topAccounts.map(a => a.address));

            const leaderboard = accountInfos.map((info, index) => {
                if (!info) return null;
                const owner = new PublicKey(info.data.slice(32, 64));
                const amount = topAccounts[index].amount;

                return {
                    rank: index + 1,
                    userId: owner.toBase58(),
                    walletAddress: owner.toBase58(),
                    xp: Number(topAccounts[index].uiAmount ?? amount),
                    level: 1,
                    currentStreak: 0
                };
            }).filter(Boolean);

            return leaderboard as any[];
        });
    }

    async getCredentials(userId: string): Promise<any[]> {
        try {
            // Helius DAS API - getAssetsByOwner
            const heliusUrl = HELIUS_RPC;
            const response = await fetch(heliusUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 'my-id',
                    method: 'getAssetsByOwner',
                    params: {
                        ownerAddress: userId,
                        page: 1,
                        limit: 100,
                        displayOptions: {
                            showCollectionMetadata: true,
                        },
                    },
                }),
            });

            const data = await response.json();
            if (data.error) {
                if (data.error.code === -32401) {
                    console.warn("[onchain-impl] Helius API key is invalid or missing. Credentials will not be displayed.");
                } else {
                    console.error("Helius DAS Error:", data.error);
                }
                return [];
            }
            const { result } = data;

            if (!result || !result.items) return [];

            // Filter for Academy Credentials using Collection Address or specific metadata
            // For now, we fitler by checking if it has Attributes we expect (Level, Track, XP)
            const credentials = result.items
                // @ts-ignore
                .filter((asset: any) => {
                    // Check if it's a Metaplex Core asset? Or just check attributes
                    // Ideally we check asset.grouping to match our Collection Address
                    // But for now, let's look for "Course Credential" in name or attributes
                    return asset.content?.metadata?.name?.includes("Credential") ||
                        asset.content?.metadata?.attributes?.some((a: any) => a.trait_type === "Track");
                })
                // @ts-ignore
                .map((asset: any) => {
                    const attrs = asset.content?.metadata?.attributes || [];
                    const track = attrs.find((a: any) => a.trait_type === "Track")?.value || "General";
                    const level = attrs.find((a: any) => a.trait_type === "Level")?.value || "1";
                    const xp = attrs.find((a: any) => a.trait_type === "XP")?.value || "0";
                    const courses = attrs.find((a: any) => a.trait_type === "Courses Completed")?.value || "1";

                    return {
                        id: asset.id,
                        userId: userId,
                        trackId: track.toLowerCase().replace(/\s/g, "-"),
                        trackName: track,
                        level: parseInt(level.toString()),
                        coursesCompleted: parseInt(courses.toString()),
                        totalXpEarned: parseInt(xp.toString()),
                        earnedAt: new Date().toISOString(), // DAS doesn't easily give "earnedAt" timestamp without parsing history?? Use current info
                        metadataUrl: asset.content?.json_uri,
                        image: asset.content?.links?.image,
                    };
                });

            return credentials;

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

            return {
                id: asset.id,
                userId: asset.ownership.owner,
                trackId: track.toLowerCase().replace(/\s/g, "-"),
                trackName: track,
                level: parseInt(level.toString()),
                coursesCompleted: parseInt(courses.toString()),
                totalXpEarned: parseInt(xp.toString()),
                earnedAt: new Date().toISOString(),
                metadataUrl: asset.content?.json_uri,
                image: asset.content?.links?.image,
            };
        } catch (e) {
            console.error("Failed to fetch credential", e);
            return null;
        }
    }

    // --- WRITE Methods ---

    async enroll(userId: string, courseId: string): Promise<any> {
        // 1. Sync to Prisma if on the server
        if (typeof window === "undefined") {
            try {
                const user = await prisma.user.findFirst({
                    where: { OR: [{ walletAddress: userId }, { id: userId }] },
                    select: { id: true }
                });
                if (user) {
                    const { createLearningProgressService } = await import("./prisma-impl");
                    const prismaService = createLearningProgressService(prisma);
                    await prismaService.enroll(user.id, courseId);
                    console.log(`[onchain-service] Synced enrollment to DB for user ${user.id}`);
                }
            } catch (e) {
                console.error("[onchain-service] Failed to sync enrollment to DB:", e);
            }
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

        if (!isWallet) {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { walletAddress: true }
            });
            if (user?.walletAddress) {
                walletAddress = user.walletAddress;
            }
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
        if (typeof window === "undefined") {
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

    async finalizeCourse(userId: string, courseId: string): Promise<void> {
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
                const learnerTokenAccount = learnerTokenAccounts.value[0]?.pubkey;

                const [coursePda] = PublicKey.findProgramAddressSync([Buffer.from("course"), Buffer.from(courseId)], program.programId);
                const course = await (program.account as any).course.fetch(coursePda);
                const creator = course.creator;
                const creatorTokenAccounts = await connection.getTokenAccountsByOwner(creator, { mint: config.xpMint });
                const creatorTokenAccount = creatorTokenAccounts.value[0]?.pubkey;

                const enrollmentPda = this.getEnrollmentPDA(courseId, learner);

                console.log(`[onchain-service] finalizeCourse: derived PDAs: course=${coursePda.toBase58()}, enrollment=${enrollmentPda.toBase58()}`);
                console.log(`[onchain-service] finalizeCourse: tokens: learner=${learnerTokenAccount?.toBase58()}, creator=${creatorTokenAccount?.toBase58()}`);

                if (!learnerTokenAccount || !creatorTokenAccount) {
                    throw new Error(`Token accounts missing: learner=${!!learnerTokenAccount}, creator=${!!creatorTokenAccount}`);
                }

                console.log(`[onchain-service] finalizeCourse: Building transaction for learner ${learner.toBase58()} and creator ${creator.toBase58()}`);
                const tx = await (program.methods as any)
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
                    .transaction();

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
        if (typeof window === "undefined") {
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

    async issueCredential(params: { userId: string; wallet?: string; courseId: string; trackId: string; trackName: string; xpEarned: number }): Promise<string> {
        if (typeof window === "undefined") {
            // Server-side: Issue NFT Credential using Metaplex Core
            const { userId, wallet, courseId, trackId, trackName, xpEarned } = params;
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
                const credentialName = `${trackName} Certificate`;
                const metadataUri = `https://api.superteam.academy/metadata/credential/${asset.publicKey.toBase58()}`;

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

                // Find Prisma user to link the credential
                const prismaUser = await prisma.user.findFirst({
                    where: { OR: [{ walletAddress: wallet }, { id: wallet }] },
                    select: { id: true }
                });

                if (prismaUser) {
                    await prisma.credential.create({
                        data: {
                            id: asset.publicKey.toBase58(),
                            userId: prismaUser.id,
                            trackId,
                            trackName,
                            totalXpEarned: xpEarned,
                            mintAddress: asset.publicKey.toBase58(),
                            metadataUrl: metadataUri,
                        }
                    }).catch(e => console.error("Failed to sync credential to DB:", e));
                } else {
                    console.warn("[onchain-service] Could not find Prisma user to sync credential for wallet:", wallet);
                }
                return asset.publicKey.toBase58();
            });
        } else {
            const res = await fetch("/api/onchain/issue-credential", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    wallet: params.userId,
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

    async claimAchievement(userId: string, achievementId: string): Promise<boolean> {
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

    async logActivity(userId: string): Promise<void> {
        // Hybrid Implementation: Streaks are always off-chain (DB/Frontend)
        try {
            const user = await prisma.user.findUnique({
                where: { walletAddress: userId },
                select: { id: true }
            });
            if (!user) return;

            const { createLearningProgressService } = await import("./prisma-impl");
            const prismaService = createLearningProgressService(prisma);
            await prismaService.logActivity(user.id);
        } catch (e) {
            console.error("Failed to log activity", e);
        }
    }
}
