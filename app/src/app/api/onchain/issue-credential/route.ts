import { NextRequest, NextResponse } from "next/server";
import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
// @ts-ignore
import onchainAcademyIdl from "@/lib/idl/onchain_academy.json";
import bs58 from "bs58";
import { prisma } from "@/lib/db";
import { learningProgressService as service } from "@/lib/learning-progress/service";

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://api.devnet.solana.com";
const BACKEND_WALLET_KEY = process.env.BACKEND_WALLET_PRIVATE_KEY;
const MPL_CORE_PROGRAM_ID = new PublicKey("CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");

export async function POST(req: NextRequest) {
    try {
        const { wallet, trackId, trackName, xpEarned } = await req.json();

        if (!BACKEND_WALLET_KEY) return NextResponse.json({ error: "Backend wallet missing" }, { status: 500 });
        if (!wallet || !trackId) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

        const connection = new Connection(RPC_URL, "confirmed");
        const backendWallet = Keypair.fromSecretKey(bs58.decode(BACKEND_WALLET_KEY));

        const provider = new AnchorProvider(
            connection,
            // @ts-ignore
            { publicKey: backendWallet.publicKey, signTransaction: async (tx) => { tx.sign(backendWallet); return tx; }, signAllTransactions: async (txs) => { txs.forEach(t => t.sign(backendWallet)); return txs; } },
            AnchorProvider.defaultOptions()
        );

        const program = new Program(onchainAcademyIdl as any, provider);

        const learner = new PublicKey(wallet);
        // We use trackId as courseId in the context of the platform
        const courseId = trackId;

        const [configPda] = PublicKey.findProgramAddressSync([Buffer.from("config")], program.programId);
        const [coursePda] = PublicKey.findProgramAddressSync([Buffer.from("course"), Buffer.from(courseId)], program.programId);
        const [enrollmentPda] = PublicKey.findProgramAddressSync([Buffer.from("enrollment"), Buffer.from(courseId), learner.toBuffer()], program.programId);

        // Let's get actual progress numbers from the database/service just for metadata rendering
        const user = await prisma.user.findUnique({ where: { walletAddress: wallet }, select: { id: true } });
        let coursesCompleted = 1;
        let totalXp = xpEarned || 0;

        if (user) {
            const progress = await service.getProgress(user.id);
            if (progress) {
                totalXp = progress.xp;
                // We would ideally query total completed courses, hardcode to 1 for this MVP mapping
                coursesCompleted = 1;
            }
        }

        // Generate a new keypair for the credential asset (Metaplex Core standard)
        const credentialAsset = Keypair.generate();

        const tx = await program.methods
            .issueCredential(
                `${trackName} Certificate`,
                `https://superteam.fun/credential/${courseId}.json`, // Mock URI for Metaplex metadata
                coursesCompleted,
                new (program.provider as any).anchor.BN(totalXp)
            )
            .accounts({
                config: configPda,
                course: coursePda,
                enrollment: enrollmentPda,
                learner: learner,
                credentialAsset: credentialAsset.publicKey,
                payer: backendWallet.publicKey,
                backendSigner: backendWallet.publicKey,
                mplCoreProgram: MPL_CORE_PROGRAM_ID,
                systemProgram: SystemProgram.programId,
            } as any)
            .transaction();

        tx.feePayer = backendWallet.publicKey;
        tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
        tx.sign(backendWallet, credentialAsset);

        const sig = await connection.sendRawTransaction(tx.serialize());
        await connection.confirmTransaction(sig);

        return NextResponse.json({ success: true, signature: sig });

    } catch (error: any) {
        console.error("Issue Credential Error:", error);
        return NextResponse.json({ error: error.message || "Failed to issue credential" }, { status: 500 });
    }
}
