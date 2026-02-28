import { NextRequest, NextResponse } from "next/server";
import { PublicKey, sendAndConfirmTransaction } from "@solana/web3.js";
import { getConnection } from "@/lib/solana/connection";
import { getBackendSigner } from "@/lib/solana/backend-signer";
import { getBackendProgram } from "@/lib/solana/program";
import { buildUpdateConfigTx } from "@/lib/solana/transactions";

export async function PUT(req: NextRequest) {
  const adminSecret = req.headers.get("x-admin-secret");
  if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { newBackendSigner, maxDailyXp, maxAchievementXp } = await req.json();

  const connection = getConnection();
  const backendKeypair = getBackendSigner();
  const program = getBackendProgram(backendKeypair);

  const tx = await buildUpdateConfigTx(program, backendKeypair.publicKey, {
    newBackendSigner: newBackendSigner ? new PublicKey(newBackendSigner) : null,
    maxDailyXp: maxDailyXp ?? null,
    maxAchievementXp: maxAchievementXp ?? null,
  });
  tx.feePayer = backendKeypair.publicKey;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  const sig = await sendAndConfirmTransaction(connection, tx, [backendKeypair]);

  return NextResponse.json({ ok: true, txSignature: sig });
}
