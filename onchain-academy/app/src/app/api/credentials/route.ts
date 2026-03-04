import { NextRequest, NextResponse } from "next/server";

type HeliusAsset = {
  id: string;
  content?: {
    links?: { image?: string };
    metadata?: { attributes?: Array<{ trait_type: string; value: string }> };
  };
};

type HeliusResponse = {
  result?: {
    items?: HeliusAsset[];
  };
};

const HELIUS_RPC_URL = process.env.HELIUS_RPC_URL ?? process.env.NEXT_PUBLIC_HELIUS_RPC_URL;

export async function GET(request: NextRequest) {
  const wallet = request.nextUrl.searchParams.get("wallet");
  if (!wallet) {
    return NextResponse.json([], { status: 400 });
  }
  if (!HELIUS_RPC_URL) {
    return NextResponse.json([]);
  }

  try {
    const response = await fetch(HELIUS_RPC_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "academy-credentials-api",
        method: "getAssetsByOwner",
        params: { ownerAddress: wallet, page: 1, limit: 100 },
      }),
      cache: "no-store",
    });
    if (!response.ok) {
      return NextResponse.json([]);
    }

    const data = (await response.json()) as HeliusResponse;
    const credentials = (data.result?.items ?? []).map((asset) => {
      const attrs = Object.fromEntries(
        (asset.content?.metadata?.attributes ?? []).map((item) => [item.trait_type, item.value]),
      );
      return {
        id: asset.id,
        track: attrs.track_id ?? "Unknown",
        level: Number(attrs.level ?? 0),
        coursesCompleted: Number(attrs.courses_completed ?? 0),
        totalXp: Number(attrs.total_xp ?? 0),
        mintAddress: asset.id,
        explorerUrl: `https://explorer.solana.com/address/${asset.id}?cluster=devnet`,
        imageUrl: asset.content?.links?.image ?? "",
      };
    });

    return NextResponse.json(credentials);
  } catch {
    return NextResponse.json([]);
  }
}

