import { NextRequest, NextResponse } from "next/server";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { Program, AnchorProvider, Idl, Wallet, BN } from "@coral-xyz/anchor";
import IDL from "@/lib/idl/onchain_academy.json";
import {
    PROGRAM_ID,
    MPL_CORE_PROGRAM_ID,
    getConnection,
    getConfigPda,
    getCoursePda,
    getEnrollmentPda,
} from "@/lib/anchor-client";

function getBackendSigner(): Keypair {
    const raw = process.env.BACKEND_SIGNER_KEYPAIR;
    if (!raw) throw new Error("BACKEND_SIGNER_KEYPAIR not set");
    const secretKey = Uint8Array.from(JSON.parse(raw));
    return Keypair.fromSecretKey(secretKey);
}

export async function POST(request: NextRequest) {
    try {
        const { courseId, learnerWallet, trackCollectionAddress, credentialName, metadataUri } = await request.json();

        if (!courseId || !learnerWallet || !trackCollectionAddress) {
            return NextResponse.json(
                { error: "Missing courseId, learnerWallet, or trackCollectionAddress" },
                { status: 400 }
            );
        }

        const connection = getConnection();
        const backendSigner = getBackendSigner();
        const learner = new PublicKey(learnerWallet);
        const trackCollection = new PublicKey(trackCollectionAddress);

        // Derive PDAs
        const [configPda] = getConfigPda();
        const [coursePda] = getCoursePda(courseId);
        const [enrollmentPda] = getEnrollmentPda(courseId, learner);

        // Create wallet wrapper
        const walletImpl = {
            publicKey: backendSigner.publicKey,
            signTransaction: async (tx: any) => { tx.sign(backendSigner); return tx; },
            signAllTransactions: async (txs: any[]) => { txs.forEach(tx => tx.sign(backendSigner)); return txs; },
        } as unknown as Wallet;
        const provider = new AnchorProvider(connection, walletImpl, { commitment: "confirmed" });
        const program = new Program(IDL as Idl, provider);

        // Generate a new keypair for the credential NFT asset
        const credentialAsset = Keypair.generate();

        // Fetch enrollment to get stats
        const enrollment = await (program.account as any).enrollment.fetch(enrollmentPda);

        // Default values
        const name = credentialName || `Superteam Academy - ${courseId} Completion`;
        const uri = metadataUri || `https://arweave.net/placeholder-${courseId}`;
        const coursesCompleted = 1; // This single course
        const totalXp = new BN(0); // Will be calculated from on-chain data

        const tx = await (program.methods as any)
            .issueCredential(name, uri, coursesCompleted, totalXp)
            .accounts({
                config: configPda,
                course: coursePda,
                enrollment: enrollmentPda,
                learner: learner,
                credentialAsset: credentialAsset.publicKey,
                trackCollection: trackCollection,
                payer: backendSigner.publicKey,
                backendSigner: backendSigner.publicKey,
                mplCoreProgram: MPL_CORE_PROGRAM_ID,
                systemProgram: SystemProgram.programId,
            })
            .signers([backendSigner, credentialAsset])
            .rpc();

        return NextResponse.json({
            success: true,
            txSignature: tx,
            credentialAsset: credentialAsset.publicKey.toBase58(),
        });
    } catch (error: any) {
        console.error("issue-credential error:", error);
        return NextResponse.json(
            { error: error.message || "Transaction failed" },
            { status: 500 }
        );
    }
}
