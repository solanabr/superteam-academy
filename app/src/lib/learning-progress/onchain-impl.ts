
import {
    Connection,
    PublicKey,
    Transaction,
    SystemProgram,
} from "@solana/web3.js";
import { Program, AnchorProvider, BN } from "@coral-xyz/anchor";
import { LearningProgressService } from "./interface";
// @ts-ignore
import onchainAcademyIdl from "@/lib/idl/onchain_academy.json";
import { prisma } from "@/lib/db";

// Utils for PDAs
const PROGRAM_ID = new PublicKey("AVEskHawcLAjVP8AweAbKHQUyS1jzeB2PY2Fw7UAK1qv");

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
        // Using 'any' as the IDL type to bypass version conflicts between the .ts file and .json during the transition to 0.31.1
        this.program = new Program(onchainAcademyIdl as any, provider);
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
        try {
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
        } catch (e) {
            console.error("Failed to get progress", e);
            return null;
        }
    }

    async getEnrollmentProgress(userId: string, courseId: string): Promise<any> {
        try {
            console.log(`[getEnrollmentProgress] userId=${userId}, courseId=${courseId}`);
            const userKey = new PublicKey(userId);
            const enrollmentPda = this.getEnrollmentPDA(courseId, userKey);
            // In 0.31, account names usually follow the IDL casing. 
            // We use 'enrollment' or 'Enrollment' based on the JSON. 
            // In the JSON it's defined in the 'accounts' array.
            const enrollment = await (this.program.account as any).enrollment.fetchNullable(enrollmentPda);

            if (!enrollment) return null;

            const buffer = Buffer.alloc(32);
            enrollment.lessonFlags.forEach((bn: BN, i: number) => {
                const bytes = bn.toArrayLike(Buffer, 'le', 8);
                bytes.copy(buffer, i * 8);
            });

            return {
                courseId,
                lessonFlags: buffer,
                completedAt: enrollment.completedAt ? new Date(enrollment.completedAt.toNumber() * 1000) : null,
                bonusClaimed: false,
                completedCount: 0,
                totalLessons: 256
            };
        } catch (e) {
            console.error("Error fetching enrollment", e);
            return null;
        }
    }

    async getXP(userId: string): Promise<number> {
        try {
            // 1. Get Config PDA to find XP Mint
            const [configPda] = PublicKey.findProgramAddressSync(
                [Buffer.from("config")],
                this.program.programId
            );
            const configAccount = await (this.program.account as any).config.fetch(configPda);
            const xpMint = configAccount.xpMint;

            // 2. Find Associated Token Account (or any account) for User and Mint
            // Note: On-Chain program might use ATA or just a specific PDA.
            // The 'completeLesson' used `getTokenAccountsByOwner` so we follow that.
            const userKey = new PublicKey(userId);
            const accounts = await this.connection.getTokenAccountsByOwner(userKey, { mint: xpMint });

            if (accounts.value.length === 0) return 0;

            // 3. Get Balance
            const balance = await this.connection.getTokenAccountBalance(accounts.value[0].pubkey);
            return balance.value.uiAmount || 0;

        } catch (e) {
            console.error("Failed to get XP", e);
            return 0;
        }
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

    async getLeaderboard(options?: { limit?: number }): Promise<any[]> {
        try {
            // 1. Get Config PDA to find XP Mint
            const [configPda] = PublicKey.findProgramAddressSync(
                [Buffer.from("config")],
                this.program.programId
            );
            // We need to fetch Config to get XP Mint address. 
            // In 0.31, we need to be careful with type casting.
            const configAccount = await (this.program.account as any).config.fetch(configPda);
            const xpMint = configAccount.xpMint;

            // 2. Get Largest Token Accounts for XP Mint
            const largestAccounts = await this.connection.getTokenLargestAccounts(xpMint);
            const topAccounts = largestAccounts.value.slice(0, options?.limit || 50);

            // 3. We have Token Account Addresses. We need the Owners (User Wallets).
            // We can fetch Account Info for each Token Account to get the 'owner' field.
            const accountInfos = await this.connection.getMultipleAccountsInfo(topAccounts.map(a => a.address));

            // Parse Account Info to get Owners and Balances
            const leaderboard = accountInfos.map((info, index) => {
                if (!info) return null;
                // Parse Token Account Data (Layout: mint, owner, amount, etc.)
                // Or just use the `amount` from `getTokenLargestAccounts` (it returns amount!)
                // But we definitely need the Owner.
                // Token Account Layout: Mint (32), Owner (32), Amount (8), ...
                // Owner is at offset 32.
                const owner = new PublicKey(info.data.slice(32, 64));
                const amount = topAccounts[index].amount; // Raw amount string or number? It's string usually in recent versions, or UiAmount

                return {
                    rank: index + 1,
                    userId: owner.toBase58(),
                    walletAddress: owner.toBase58(),
                    xp: Number(topAccounts[index].uiAmount ?? amount), // Use UI amount if available, else raw
                    level: 1, // Calculate from XP? Need helper.
                    currentStreak: 0 // Not available on-chain
                };
            }).filter(Boolean);

            return leaderboard as any[];

        } catch (e) {
            console.error("Failed to fetch leaderboard", e);
            return [];
        }
    }

    async getCredentials(userId: string): Promise<any[]> {
        try {
            // Helius DAS API - getAssetsByOwner
            const heliusUrl = process.env.NEXT_PUBLIC_HELIUS_RPC_URL || "https://devnet.helius-rpc.com/?api-key=387cb3e9-0527-4194-98e1-b2acb4791c57";
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
                        page: 1, // Start with page 1
                        limit: 100,
                        displayOptions: {
                            showCollectionMetadata: true,
                        },
                    },
                }),
            });

            const { result } = await response.json();

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
            const heliusUrl = process.env.NEXT_PUBLIC_HELIUS_RPC_URL || "https://devnet.helius-rpc.com/?api-key=387cb3e9-0527-4194-98e1-b2acb4791c57";
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

            const { result } = await response.json();
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
        const userKey = new PublicKey(userId);
        const coursePda = this.getCoursePDA(courseId);
        const enrollmentPda = this.getEnrollmentPDA(courseId, userKey);

        const tx = await (this.program.methods as any)
            .enroll(courseId)
            .accounts({
                course: coursePda,
                enrollment: enrollmentPda,
                learner: userKey,
                systemProgram: SystemProgram.programId,
            } as any)
            .transaction();

        tx.feePayer = userKey;
        tx.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash;

        return tx;
    }

    async completeLesson(params: { userId: string; courseId: string; lessonIndex: number; xpReward: number }): Promise<void> {
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
            throw new Error(err.error || "Failed to complete lesson on-chain");
        }
    }

    async finalizeCourse(userId: string, courseId: string, lessonCount: number): Promise<void> {
        const res = await fetch("/api/onchain/finalize-course", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                wallet: userId,
                courseId: courseId
            })
        });

        if (!res.ok) throw new Error("Failed to finalize course");
    }

    async claimCompletionBonus(userId: string, courseId: string, xpAmount: number): Promise<void> {
        const res = await fetch("/api/onchain/claim-bonus", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ wallet: userId, xpAmount })
        });
        if (!res.ok) throw new Error("Failed to claim on-chain bonus");
    }

    async issueCredential(params: any): Promise<void> {
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
        if (!res.ok) throw new Error("Failed to issue on-chain credential");
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
