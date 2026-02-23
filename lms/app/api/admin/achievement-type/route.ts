import { NextRequest, NextResponse } from "next/server";
import { Keypair, sendAndConfirmTransaction } from "@solana/web3.js";
import { getConnection } from "@/lib/solana/connection";
import { getBackendSigner } from "@/lib/solana/backend-signer";
import { getBackendProgram } from "@/lib/solana/program";
import {
  buildCreateAchievementTypeTx,
  buildDeactivateAchievementTypeTx,
} from "@/lib/solana/transactions";

export async function POST(req: NextRequest) {
  const adminSecret = req.headers.get("x-admin-secret");
  if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { achievementId, name, metadataUri, maxSupply, xpReward } =
    await req.json();
  if (
    !achievementId ||
    !name ||
    maxSupply === undefined ||
    xpReward === undefined
  ) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  const connection = getConnection();
  const backendKeypair = getBackendSigner();
  const program = getBackendProgram(backendKeypair);
  const collectionKeypair = Keypair.generate();

  const { tx } = await buildCreateAchievementTypeTx(
    program,
    backendKeypair.publicKey,
    collectionKeypair,
    {
      achievementId,
      name,
      metadataUri: metadataUri ?? "",
      maxSupply,
      xpReward,
    },
  );
  tx.feePayer = backendKeypair.publicKey;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  const sig = await sendAndConfirmTransaction(connection, tx, [
    backendKeypair,
    collectionKeypair,
  ]);

  return NextResponse.json({
    ok: true,
    txSignature: sig,
    collectionAddress: collectionKeypair.publicKey.toBase58(),
  });
}

export async function DELETE(req: NextRequest) {
  const adminSecret = req.headers.get("x-admin-secret");
  if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { achievementId } = await req.json();
  if (!achievementId) {
    return NextResponse.json(
      { error: "missing achievementId" },
      { status: 400 },
    );
  }

  const connection = getConnection();
  const backendKeypair = getBackendSigner();
  const program = getBackendProgram(backendKeypair);

  const tx = await buildDeactivateAchievementTypeTx(
    program,
    backendKeypair.publicKey,
    achievementId,
  );
  tx.feePayer = backendKeypair.publicKey;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  const sig = await sendAndConfirmTransaction(connection, tx, [backendKeypair]);

  return NextResponse.json({ ok: true, txSignature: sig });
}
