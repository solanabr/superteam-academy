import { NextRequest, NextResponse } from "next/server";
import { Connection, Keypair, PublicKey, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import { Program, AnchorProvider, Idl, Wallet, BN } from "@coral-xyz/anchor";
import IDL from "@/lib/idl/onchain_academy.json";
import {
    PROGRAM_ID,
    XP_MINT,
    TOKEN_2022_PROGRAM_ID,
    getConnection,
    getConfigPda,
    getCoursePda,
    getEnrollmentPda,
    getAssociatedTokenAddressToken2022,
} from "@/lib/anchor-client";

function getBackendSigner(): Keypair {
    const raw = process.env.BACKEND_SIGNER_KEYPAIR;
    if (!raw) throw new Error("BACKEND_SIGNER_KEYPAIR not set");
    const secretKey = Uint8Array.from(JSON.parse(raw));
    return Keypair.fromSecretKey(secretKey);
}

export async function POST(request: NextRequest) {
    try {
        const { courseId, lessonIndex, learnerWallet } = await request.json();

        if (!courseId || lessonIndex === undefined || !learnerWallet) {
            return NextResponse.json(
                { error: "Missing courseId, lessonIndex, or learnerWallet" },
                { status: 400 }
            );
        }

        const connection = getConnection();
        const backendSigner = getBackendSigner();
        const learner = new PublicKey(learnerWallet);

        // Derive PDAs
        const [configPda] = getConfigPda();
        const [coursePda] = getCoursePda(courseId);
        const [enrollmentPda] = getEnrollmentPda(courseId, learner);
        const learnerTokenAccount = getAssociatedTokenAddressToken2022(XP_MINT, learner);

        // Create Anchor provider with backend signer
        const wallet = {
            publicKey: backendSigner.publicKey,
            signTransaction: async (tx: any) => { tx.sign(backendSigner); return tx; },
            signAllTransactions: async (txs: any[]) => { txs.forEach(tx => tx.sign(backendSigner)); return txs; },
        } as unknown as Wallet;
        const provider = new AnchorProvider(connection, wallet, { commitment: "confirmed" });
        const program = new Program(IDL as Idl, provider);

        // Build and send complete_lesson transaction
        const tx = await (program.methods as any)
            .completeLesson(lessonIndex)
            .accounts({
                config: configPda,
                course: coursePda,
                enrollment: enrollmentPda,
                learner: learner,
                learnerTokenAccount: learnerTokenAccount,
                xpMint: XP_MINT,
                backendSigner: backendSigner.publicKey,
                tokenProgram: TOKEN_2022_PROGRAM_ID,
            })
            .signers([backendSigner])
            .rpc();

        return NextResponse.json({ success: true, txSignature: tx });
    } catch (error: any) {
        console.error("complete-lesson error:", error);
        return NextResponse.json(
            { error: error.message || "Transaction failed" },
            { status: 500 }
        );
    }
}
