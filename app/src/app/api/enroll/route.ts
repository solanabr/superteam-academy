import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { learningProgressService } from "@/lib/learning-progress/service";

/** POST /api/enroll — enroll user (by wallet) in a course. Body: { wallet, courseId } */
export async function POST(request: NextRequest) {
  let body: { wallet?: string; courseId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { wallet, courseId } = body;
  if (!wallet || !courseId) {
    return NextResponse.json({ error: "Missing wallet or courseId" }, { status: 400 });
  }
  const user = await prisma.user.upsert({
    where: { walletAddress: wallet },
    create: { walletAddress: wallet },
    update: {},
    select: { id: true },
  });
  const service = learningProgressService;

  // If off-chain, we insert the Prisma record. If on-chain, we skip this since we have a dedicated adminEnroll flow below.
  if (process.env.NEXT_PUBLIC_USE_ONCHAIN !== "true") {
    await service.enroll(user.id, courseId);
  }

  // If on-chain is enabled, we perform the admin enrollment to ensure PDAs exist
  if (process.env.NEXT_PUBLIC_USE_ONCHAIN === "true") {
    try {
      const { Connection, Keypair, PublicKey, Transaction, SystemProgram } = await import("@solana/web3.js");
      const { Program, AnchorProvider } = await import("@coral-xyz/anchor");
      // @ts-ignore
      const onchainAcademyIdl = (await import("@/lib/idl/onchain_academy.json")).default;
      const bs58 = (await import("bs58")).default;

      const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://api.devnet.solana.com";
      const BACKEND_WALLET_KEY = process.env.BACKEND_WALLET_PRIVATE_KEY;

      if (BACKEND_WALLET_KEY) {
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
        const [coursePda] = PublicKey.findProgramAddressSync([Buffer.from("course"), Buffer.from(courseId)], program.programId);
        const [enrollmentPda] = PublicKey.findProgramAddressSync([Buffer.from("enrollment"), Buffer.from(courseId), learner.toBuffer()], program.programId);
        const [configPda] = PublicKey.findProgramAddressSync([Buffer.from("config")], program.programId);

        const enrollmentInfo = await connection.getAccountInfo(enrollmentPda);
        if (!enrollmentInfo) {
          console.log(`Initial admin-enroll for ${wallet} in course ${courseId}`);
          const tx = await program.methods
            .adminEnroll(courseId)
            .accounts({
              config: configPda,
              course: coursePda,
              enrollment: enrollmentPda,
              learner: learner,
              authority: backendWallet.publicKey,
              systemProgram: SystemProgram.programId,
            } as any)
            .transaction();

          tx.feePayer = backendWallet.publicKey;
          tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
          tx.sign(backendWallet);
          const sig = await connection.sendRawTransaction(tx.serialize());
          console.log("Sent admin-enroll tx:", sig);
          const confirmation = await connection.confirmTransaction(sig, "confirmed");
          if (confirmation.value.err) {
            console.error("Admin-enroll tx failed:", confirmation.value.err);
          } else {
            console.log("Admin-enroll tx confirmed!");
          }
        }
      }
    } catch (onchainErr) {
      console.error("Secondary on-chain enrollment failed:", onchainErr);
      // We don't fail the whole request if on-chain sync fails here, 
      // as it will retry during complete-lesson anyway.
    }
  }

  return NextResponse.json({ ok: true });
}
