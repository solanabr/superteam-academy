import { NextRequest, NextResponse } from "next/server";
import { PublicKey, sendAndConfirmTransaction } from "@solana/web3.js";
import { getConnection } from "@/lib/solana/connection";
import { getBackendSigner } from "@/lib/solana/backend-signer";
import { getBackendProgram } from "@/lib/solana/program";
import { buildAwardStreakFreezeTx } from "@/lib/solana/transactions";

export async function POST(req: NextRequest) {
  const { userId } = await req.json();
  if (!userId) {
    return NextResponse.json({ error: "missing userId" }, { status: 400 });
  }

  try {
    const connection = getConnection();
    const backendKeypair = getBackendSigner();
    const program = getBackendProgram(backendKeypair);
    const wallet = new PublicKey(userId);

    const tx = await buildAwardStreakFreezeTx(
      program,
      backendKeypair.publicKey,
      wallet
    );
    tx.feePayer = backendKeypair.publicKey;
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    const txSignature = await sendAndConfirmTransaction(connection, tx, [backendKeypair]);

    return NextResponse.json({ ok: true, txSignature });
  } catch (err: any) {
    return NextResponse.json(
      { error: "on-chain tx failed", details: err?.message ?? "" },
      { status: 500 }
    );
  }
}
