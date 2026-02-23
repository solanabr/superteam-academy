
import { NextRequest, NextResponse } from "next/server";
import { Connection, Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
// @ts-ignore
import onchainAcademyIdl from "@/lib/idl/onchain_academy.json";
import bs58 from "bs58";
import { withFallbackRPC } from "@/lib/solana-connection";

const RPC_URL = process.env.NEXT_PUBLIC_HELIUS_RPC_URL || process.env.NEXT_PUBLIC_RPC_URL || "https://api.devnet.solana.com";
const BACKEND_WALLET_KEY = process.env.BACKEND_WALLET_PRIVATE_KEY;

export async function POST(req: NextRequest) {
    try {
        const { courseId, wallet } = await req.json();

        if (!BACKEND_WALLET_KEY) return NextResponse.json({ error: "Backend wallet missing" }, { status: 500 });

        const sig = await withFallbackRPC(async (connection) => {
            const backendWallet = Keypair.fromSecretKey(bs58.decode(BACKEND_WALLET_KEY));
            const provider = new AnchorProvider(
                connection,
                // @ts-ignore
                { publicKey: backendWallet.publicKey, signTransaction: async (tx) => { tx.sign(backendWallet); return tx; }, signAllTransactions: async (txs) => { txs.forEach(t => t.sign(backendWallet)); return txs; } },
                AnchorProvider.defaultOptions()
            );

            const program = new Program(onchainAcademyIdl as any, provider);

            const learner = new PublicKey(wallet);
            const [coursePda] = PublicKey.findProgramAddressSync([Buffer.from("course"), Buffer.from(courseId)], program.programId);
            const [enrollmentPda] = PublicKey.findProgramAddressSync([Buffer.from("enrollment"), Buffer.from(courseId), learner.toBuffer()], program.programId);
            const [configPda] = PublicKey.findProgramAddressSync([Buffer.from("config")], program.programId);

            const config = await (program.account as any).config.fetch(configPda);
            const learnerTokenAccount = (await connection.getTokenAccountsByOwner(learner, { mint: config.xpMint })).value[0]?.pubkey;

            const course = await (program.account as any).course.fetch(coursePda);
            const creator = course.creator;
            const creatorTokenAccount = (await connection.getTokenAccountsByOwner(creator, { mint: config.xpMint })).value[0]?.pubkey;

            if (!learnerTokenAccount || !creatorTokenAccount) {
                throw new Error("Token accounts missing for learner or creator");
            }

            const tx = await program.methods
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
            await connection.confirmTransaction(signature);
            return signature;
        });

        // Sync to Off-Chain DB so Achievements and UI load properly
        try {
            const { prisma } = await import("@/lib/db");
            const user = await prisma.user.findUnique({ where: { walletAddress: wallet }, select: { id: true } });
            if (user) {
                await prisma.enrollment.updateMany({
                    where: { userId: user.id, courseId },
                    data: { completedAt: new Date() }
                });
            }
        } catch (dbErr) {
            console.error("Failed to sync off-chain finalization:", dbErr);
        }

        return NextResponse.json({ success: true, signature: sig });

    } catch (error: any) {
        console.error("Finalize Course Error:", error);
        return NextResponse.json({ error: error.message || "Failed to finalize" }, { status: 500 });
    }
}
