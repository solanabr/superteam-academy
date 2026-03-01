import { NextRequest, NextResponse } from "next/server";

const HELIUS_RPC = process.env.NEXT_PUBLIC_HELIUS_RPC ?? "";
const HELIUS_API_KEY = process.env.HELIUS_API_KEY ?? "";
const CLUSTER = process.env.NEXT_PUBLIC_CLUSTER ?? "devnet";

function getHeliusUrl(): string | null {
  if (HELIUS_RPC) return HELIUS_RPC;
  if (HELIUS_API_KEY) {
    const base =
      CLUSTER === "mainnet-beta"
        ? "https://mainnet.helius-rpc.com"
        : "https://devnet.helius-rpc.com";
    return `${base}/?api-key=${HELIUS_API_KEY}`;
  }
  return null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id")?.trim();
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const url = getHeliusUrl();
  if (!url) {
    return NextResponse.json({ error: "Helius RPC not configured" }, { status: 503 });
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "1",
        method: "getAsset",
        params: { id },
      }),
    });
    const data = (await response.json()) as { result?: unknown; error?: { message?: string } };
    if (data.error || !data.result) {
      return NextResponse.json({ error: data.error?.message ?? "Asset not found" }, { status: 404 });
    }
    return NextResponse.json(data.result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Request failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
