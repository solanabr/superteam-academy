import { NextRequest, NextResponse } from "next/server";
import { PublicKey, sendAndConfirmTransaction } from "@solana/web3.js";
import { getConnection } from "@/lib/solana/connection";
import { getBackendSigner } from "@/lib/solana/backend-signer";
import { getBackendProgram } from "@/lib/solana/program";
import { fetchConfig } from "@/lib/solana/readers";
import { buildRewardXpTx } from "@/lib/solana/transactions";

export async function POST(req: NextRequest) {
  const adminSecret = req.headers.get("x-admin-secret");
  if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { recipient, amount, memo } = await req.json();
  if (!recipient || !amount) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  const connection = getConnection();
  const backendKeypair = getBackendSigner();
  const program = getBackendProgram(backendKeypair);

  const config = await fetchConfig();
  if (!config || config.seasonClosed) {
    return NextResponse.json({ error: "no active season" }, { status: 400 });
  }

  const tx = await buildRewardXpTx(
    program,
    backendKeypair.publicKey,
    new PublicKey(recipient),
    amount,
    memo ?? "",
    config.xpMint,
  );
  tx.feePayer = backendKeypair.publicKey;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  const sig = await sendAndConfirmTransaction(connection, tx, [backendKeypair]);

  return NextResponse.json({ ok: true, txSignature: sig });
}
