import { NextRequest, NextResponse } from "next/server";
import { Keypair, PublicKey } from "@solana/web3.js";
import { Program, AnchorProvider, Idl, Wallet } from "@coral-xyz/anchor";
import IDL from "@/lib/idl/onchain_academy.json";
import {
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
        const { courseId, learnerWallet } = await request.json();

        if (!courseId || !learnerWallet) {
            return NextResponse.json(
                { error: "Missing courseId or learnerWallet" },
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

        // We also need the course creator's token account for creator rewards
        // Fetch the course account to get the creator pubkey
        const walletImpl = {
            publicKey: backendSigner.publicKey,
            signTransaction: async (tx: any) => { tx.sign(backendSigner); return tx; },
            signAllTransactions: async (txs: any[]) => { txs.forEach(tx => tx.sign(backendSigner)); return txs; },
        } as unknown as Wallet;
        const provider = new AnchorProvider(connection, walletImpl, { commitment: "confirmed" });
        const program = new Program(IDL as Idl, provider);

        // Fetch course to get creator
        const courseAccount = await (program.account as any).course.fetch(coursePda);
        const creatorTokenAccount = getAssociatedTokenAddressToken2022(XP_MINT, courseAccount.creator);

        // Build and send finalize_course transaction
        const tx = await (program.methods as any)
            .finalizeCourse()
            .accounts({
                config: configPda,
                course: coursePda,
                enrollment: enrollmentPda,
                learner: learner,
                learnerTokenAccount: learnerTokenAccount,
                creatorTokenAccount: creatorTokenAccount,
                creator: courseAccount.creator,
                xpMint: XP_MINT,
                backendSigner: backendSigner.publicKey,
                tokenProgram: TOKEN_2022_PROGRAM_ID,
            })
            .signers([backendSigner])
            .rpc();

        return NextResponse.json({ success: true, txSignature: tx });
    } catch (error: any) {
        console.error("finalize-course error:", error);
        return NextResponse.json(
            { error: error.message || "Transaction failed" },
            { status: 500 }
        );
    }
}
