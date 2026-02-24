import { NextRequest, NextResponse } from "next/server";

const SOLANA_NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK ?? "devnet";
const HELIUS_KEY = process.env.HELIUS_API_KEY ?? "";

const UPSTREAM_URL = HELIUS_KEY
  ? `https://${SOLANA_NETWORK === "devnet" ? "devnet" : "mainnet"}.helius-rpc.com/?api-key=${HELIUS_KEY}`
  : SOLANA_NETWORK === "devnet"
    ? "https://api.devnet.solana.com"
    : "https://api.mainnet-beta.solana.com";

export async function POST(req: NextRequest) {
  const body = await req.text();

  const upstream = await fetch(UPSTREAM_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });

  const data = await upstream.text();
  return new NextResponse(data, {
    status: upstream.status,
    headers: { "Content-Type": "application/json" },
  });
}
