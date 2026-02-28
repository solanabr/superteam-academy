import { NextRequest, NextResponse } from "next/server";
import { PublicKey, sendAndConfirmTransaction } from "@solana/web3.js";
import { getConnection } from "@/lib/solana/connection";
import { getBackendSigner } from "@/lib/solana/backend-signer";
import { getBackendProgram } from "@/lib/solana/program";
import {
  buildRegisterMinterTx,
  buildRevokeMinterTx,
} from "@/lib/solana/transactions";

export async function POST(req: NextRequest) {
  const adminSecret = req.headers.get("x-admin-secret");
  if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { minter, label, maxXpPerCall } = await req.json();
  if (!minter || !label || maxXpPerCall === undefined) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  const connection = getConnection();
  const backendKeypair = getBackendSigner();
  const program = getBackendProgram(backendKeypair);

  const tx = await buildRegisterMinterTx(program, backendKeypair.publicKey, {
    minter: new PublicKey(minter),
    label,
    maxXpPerCall,
  });
  tx.feePayer = backendKeypair.publicKey;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  const sig = await sendAndConfirmTransaction(connection, tx, [backendKeypair]);

  return NextResponse.json({ ok: true, txSignature: sig });
}

export async function DELETE(req: NextRequest) {
  const adminSecret = req.headers.get("x-admin-secret");
  if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { minter } = await req.json();
  if (!minter) {
    return NextResponse.json({ error: "missing minter" }, { status: 400 });
  }

  const connection = getConnection();
  const backendKeypair = getBackendSigner();
  const program = getBackendProgram(backendKeypair);

  const tx = await buildRevokeMinterTx(
    program,
    backendKeypair.publicKey,
    new PublicKey(minter),
  );
  tx.feePayer = backendKeypair.publicKey;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  const sig = await sendAndConfirmTransaction(connection, tx, [backendKeypair]);

  return NextResponse.json({ ok: true, txSignature: sig });
}
