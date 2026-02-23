import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
// @ts-ignore
import onchainAcademyIdl from "@/lib/idl/onchain_academy.json";
import bs58 from "bs58";
import { withFallbackRPC } from "@/lib/solana-connection";

const BACKEND_WALLET_KEY = process.env.BACKEND_WALLET_PRIVATE_KEY;

/**
 * Syncs a course to the Solana blockchain by creating a Course PDA.
 * This should be called whenever a course is published (either on creation or later).
 */
export async function syncCourseOnChain(params: {
    courseId: string;
    wallet: string;
    lessonCount: number;
    difficulty?: number;
    xpPerLesson?: number;
    trackId?: number;
    trackLevel?: number;
}): Promise<string | null> {
    const { courseId, wallet, lessonCount, difficulty = 1, xpPerLesson = 100, trackId = 1, trackLevel = 1 } = params;

    if (!BACKEND_WALLET_KEY) {
        console.error("[onchain-admin] BACKEND_WALLET_PRIVATE_KEY is missing. Cannot sync course on-chain.");
        return null;
    }

    if (process.env.NEXT_PUBLIC_USE_ONCHAIN !== "true") {
        console.log("[onchain-admin] NEXT_PUBLIC_USE_ONCHAIN is not true. Skipping on-chain sync.");
        return "SKIPPED_CONFIG";
    }

    try {
        return await withFallbackRPC(async (connection) => {
            const backendWallet = Keypair.fromSecretKey(bs58.decode(BACKEND_WALLET_KEY));

            const provider = new AnchorProvider(
                connection,
                // @ts-ignore
                {
                    publicKey: backendWallet.publicKey,
                    signTransaction: async (tx) => { (tx as any).sign(backendWallet); return tx; },
                    signAllTransactions: async (txs) => { txs.forEach(t => (t as any).sign(backendWallet)); return txs; }
                },
                AnchorProvider.defaultOptions()
            );

            const program = new Program(onchainAcademyIdl as any, provider);

            const publishedId = courseId.startsWith("drafts.") ? courseId.replace("drafts.", "") : courseId;

            const [coursePda] = PublicKey.findProgramAddressSync(
                [Buffer.from("course"), Buffer.from(publishedId)],
                program.programId
            );
            const [configPda] = PublicKey.findProgramAddressSync(
                [Buffer.from("config")],
                program.programId
            );

            // Check if course account already exists
            const courseAccountInfo = await connection.getAccountInfo(coursePda);

            if (!courseAccountInfo) {
                console.log(`[onchain-admin] Creating course on-chain: ${publishedId}`);
                const creatorPubkey = new PublicKey(wallet);
                const finalLessonCount = lessonCount || 1;

                const tx = await (program.methods as any)
                    .createCourse({
                        courseId: publishedId.substring(0, 32),
                        creator: creatorPubkey,
                        contentTxId: Array(32).fill(0),
                        lessonCount: finalLessonCount,
                        difficulty: difficulty,
                        xpPerLesson: xpPerLesson,
                        trackId: trackId,
                        trackLevel: trackLevel,
                        prerequisite: null,
                        creatorRewardXp: 500,
                        minCompletionsForReward: 10,
                    })
                    .accounts({
                        course: coursePda,
                        config: configPda,
                        authority: backendWallet.publicKey,
                        systemProgram: SystemProgram.programId,
                    })
                    .transaction();

                tx.feePayer = backendWallet.publicKey;
                tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
                tx.sign(backendWallet);

                const sig = await connection.sendRawTransaction(tx.serialize());
                await connection.confirmTransaction(sig);
                console.log(`[onchain-admin] On-chain course created, tx signature: ${sig}`);
                return sig;
            } else {
                console.log(`[onchain-admin] Course already exists on-chain: ${publishedId}`);
                return "ALREADY_EXISTS";
            }
        });
    } catch (error) {
        console.error("[onchain-admin] Failed to sync course on-chain:", error);
        throw error;
    }
}
