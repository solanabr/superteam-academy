import { NextResponse } from "next/server";
import { Keypair } from "@solana/web3.js";

// The pubkey the on-chain Config expects as backend_signer.
// Fetched once from devnet: Config.backend_signer field.
const REQUIRED_PUBKEY = "ACAd3USj2sMV6drKcMY2wZtNkhVDHWpC4tfJe93hgqYn";

function tryParseSigner(raw: string): Keypair | null {
  const trimmed = raw.trim();
  try {
    if (trimmed.startsWith("[")) {
      const arr = JSON.parse(trimmed) as number[];
      return Keypair.fromSecretKey(Uint8Array.from(arr));
    }
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const bs58 = require("bs58") as { decode: (s: string) => Uint8Array };
    return Keypair.fromSecretKey(bs58.decode(trimmed));
  } catch {
    return null;
  }
}

export async function GET() {
  const raw = process.env.BACKEND_SIGNER_KEYPAIR;
  if (!raw) return NextResponse.json({ mode: "stub" });

  const keypair = tryParseSigner(raw);
  if (!keypair) return NextResponse.json({ mode: "stub" });

  if (keypair.publicKey.toBase58() !== REQUIRED_PUBKEY) {
    return NextResponse.json({ mode: "stub" });
  }

  return NextResponse.json({ mode: "onchain" });
}
