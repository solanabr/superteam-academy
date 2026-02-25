import { NextResponse } from "next/server";

// Helius RPC URL (берем из env или хардкод для хакатона)
// ВАЖНО: Убедись, что HELIUS_API_KEY есть в .env.local
const HELIUS_RPC = `https://devnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY || "твой_ключ"}`;

export async function GET(request: Request, { params }: { params: { mint: string } }) {
  const { mint } = params;

  try {
    const response = await fetch(HELIUS_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "my-id",
        method: "getAsset",
        params: { id: mint },
      }),
    });

    const { result } = await response.json();

    if (!result) {
        return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch asset" }, { status: 500 });
  }
}