// app/src/app/api/finalize-course/route.ts
import { NextResponse } from "next/server";
import { getServerProgram, getBackendWallet } from "@/lib/server";
import { PublicKey } from "@solana/web3.js";
import { PROGRAM_ID, XP_MINT } from "@/lib/constants";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";

export async function POST(request: Request) {
  try {
    const { courseId, walletAddress } = await request.json();
    
    const program = getServerProgram();
    const backendWallet = getBackendWallet();
    const learnerPubkey = new PublicKey(walletAddress);

    // PDAs
    const [configPda] = PublicKey.findProgramAddressSync([Buffer.from("config")], PROGRAM_ID);
    const [coursePda] = PublicKey.findProgramAddressSync([Buffer.from("course"), Buffer.from(courseId)], PROGRAM_ID);
    const [enrollmentPda] = PublicKey.findProgramAddressSync([Buffer.from("enrollment"), Buffer.from(courseId), learnerPubkey.toBuffer()], PROGRAM_ID);

    // Читаем курс, чтобы узнать создателя (для начисления награды автору)
    const courseAccount = await program.account.course.fetch(coursePda);
    const creatorPubkey = courseAccount.creator;

    // ATAs
    const learnerXpAta = getAssociatedTokenAddressSync(XP_MINT, learnerPubkey, false, new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"));
    
    // ATA Создателя курса (куда начислить роялти)
    const creatorXpAta = getAssociatedTokenAddressSync(XP_MINT, creatorPubkey, false, new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"));

    const tx = await program.methods
    .finalizeCourse()
    .accountsPartial({
        config: configPda,
        course: coursePda,
        enrollment: enrollmentPda,
        learner: learnerPubkey,
        learnerTokenAccount: learnerXpAta,
        creatorTokenAccount: creatorXpAta,
        creator: creatorPubkey,
        xpMint: XP_MINT,
        backendSigner: backendWallet.publicKey,
        tokenProgram: new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"),
    } as any)
    .signers([backendWallet.payer])
    .rpc();

    return NextResponse.json({ success: true, txSignature: tx });

  } catch (error: any) {
    console.error("API finalize-course error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}