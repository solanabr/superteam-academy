import { NextRequest, NextResponse } from "next/server";
import { Keypair, sendAndConfirmTransaction } from "@solana/web3.js";
import { getConnection } from "@/lib/solana/connection";
import { getBackendSigner } from "@/lib/solana/backend-signer";
import { getBackendProgram } from "@/lib/solana/program";
import {
  buildCreateSeasonTx,
  buildCloseSeasonTx,
} from "@/lib/solana/transactions";
import { fetchConfig } from "@/lib/solana/readers";

export async function POST(req: NextRequest) {
  const adminSecret = req.headers.get("x-admin-secret");
  if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { season } = await req.json();
  if (!season) {
    return NextResponse.json({ error: "missing season" }, { status: 400 });
  }

  const connection = getConnection();
  const backendKeypair = getBackendSigner();
  const program = getBackendProgram(backendKeypair);
  const mintKeypair = Keypair.generate();

  const { tx } = await buildCreateSeasonTx(
    program,
    backendKeypair.publicKey,
    mintKeypair,
    season,
  );
  tx.feePayer = backendKeypair.publicKey;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  const sig = await sendAndConfirmTransaction(connection, tx, [
    backendKeypair,
    mintKeypair,
  ]);

  return NextResponse.json({
    ok: true,
    txSignature: sig,
    mintAddress: mintKeypair.publicKey.toBase58(),
  });
}

export async function DELETE(req: NextRequest) {
  const adminSecret = req.headers.get("x-admin-secret");
  if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const connection = getConnection();
  const backendKeypair = getBackendSigner();
  const program = getBackendProgram(backendKeypair);

  const config = await fetchConfig();
  if (!config || config.seasonClosed) {
    return NextResponse.json(
      { error: "no active season to close" },
      { status: 400 },
    );
  }

  const tx = await buildCloseSeasonTx(program, backendKeypair.publicKey);
  tx.feePayer = backendKeypair.publicKey;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  const sig = await sendAndConfirmTransaction(connection, tx, [backendKeypair]);

  return NextResponse.json({ ok: true, txSignature: sig });
}
