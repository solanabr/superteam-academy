import { NextRequest, NextResponse } from "next/server";
import { Connection, Keypair, Transaction, SystemProgram, PublicKey } from "@solana/web3.js";

export async function POST(req: NextRequest) {
  try {
    const { walletAddress, courseSlug } = await req.json();
    if (!walletAddress || !courseSlug) return NextResponse.json({ error: "Missing params" }, { status: 400 });

    const sponsorKey = process.env.SPONSOR_WALLET_PRIVATE_KEY;
    if (!sponsorKey) return NextResponse.json({ error: "Sponsor wallet not configured" }, { status: 500 });

    const sponsorKeypair = Keypair.fromSecretKey(Buffer.from(sponsorKey, "base64"));
    const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC || "https://api.devnet.solana.com", "confirmed");

    // Record enrollment on-chain as a memo transaction (gasless for user)
    const { blockhash } = await connection.getLatestBlockhash();
    const tx = new Transaction();
    tx.recentBlockhash = blockhash;
    tx.feePayer = sponsorKeypair.publicKey;

    // Transfer tiny amount to self as enrollment proof
    tx.add(SystemProgram.transfer({
      fromPubkey: sponsorKeypair.publicKey,
      toPubkey: new PublicKey(walletAddress),
      lamports: 1000,
    }));

    tx.sign(sponsorKeypair);
    const sig = await connection.sendRawTransaction(tx.serialize());
    await connection.confirmTransaction(sig, "confirmed");

    return NextResponse.json({ success: true, signature: sig, course: courseSlug });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}