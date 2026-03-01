import { NextRequest, NextResponse } from "next/server";
import type { CredentialInfo } from "@/lib/services/learning-progress";

const HELIUS_RPC = process.env.NEXT_PUBLIC_HELIUS_RPC ?? "";
const HELIUS_API_KEY = process.env.HELIUS_API_KEY ?? "";
const CLUSTER = process.env.NEXT_PUBLIC_CLUSTER ?? "devnet";
const TRACK_COLLECTIONS_ENV = (process.env.NEXT_PUBLIC_CREDENTIAL_TRACK_COLLECTIONS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:3001";
const API_TOKEN = process.env.BACKEND_API_TOKEN ?? "";

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

/** DAS asset shape (minimal) */
interface DasAsset {
  id: string;
  uri?: string;
  grouping?: Array<{ group_key: string; group_value: string }>;
  content?: {
    metadata?: {
      name?: string;
      uri?: string;
      attributes?: Array<{ key: string; value: string }> | Record<string, string>;
    };
    json_uri?: string;
    links?: { image?: string };
  };
}

function getMetadataUri(asset: DasAsset): string | undefined {
  return (
    asset.content?.metadata?.uri ??
    asset.content?.json_uri ??
    asset.uri
  );
}

interface GetAssetsByOwnerResponse {
  result?: { items?: DasAsset[] };
  error?: { message?: string };
}

function parseAttributes(
  attrs: Array<{ key: string; value: string }> | Record<string, string> | undefined
): Record<string, string> {
  if (!attrs) return {};
  if (Array.isArray(attrs)) return Object.fromEntries(attrs.map((a) => [a.key, a.value]));
  return attrs as Record<string, string>;
}

function assetToCredentialInfo(asset: DasAsset): CredentialInfo {
  const attrs = parseAttributes(asset.content?.metadata?.attributes);
  const uri = getMetadataUri(asset);
  const imageUrl = asset.content?.links?.image ?? null;
  const name = asset.content?.metadata?.name ?? null;
  return {
    asset: asset.id,
    trackId: parseInt(attrs.track_id ?? "0", 10),
    level: parseInt(attrs.level ?? "0", 10),
    coursesCompleted: parseInt(attrs.courses_completed ?? "0", 10),
    totalXp: parseInt(attrs.total_xp ?? "0", 10),
    imageUrl: imageUrl ?? undefined,
    name: name ?? undefined,
    metadataUri: uri ?? undefined,
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get("wallet")?.trim();
  if (!wallet) {
    return NextResponse.json({ credentials: [], error: "wallet required" }, { status: 400 });
  }

  const url = getHeliusUrl();
  if (!url) {
    return NextResponse.json({ credentials: [], error: "Helius RPC not configured" }, { status: 200 });
  }

  let collections: string[] = [...TRACK_COLLECTIONS_ENV];
  if (collections.length === 0 && API_TOKEN) {
    try {
      const res = await fetch(
        `${BACKEND_URL.replace(/\/$/, "")}/v1/academy/credential-collections`,
        { headers: { "X-API-Key": API_TOKEN }, cache: "no-store" }
      );
      const data = (await res.json().catch(() => ({}))) as {
        list?: Array<{ collectionAddress: string }>;
      };
      if (data.list?.length) {
        collections = data.list.map((r) => r.collectionAddress).filter(Boolean);
      }
    } catch {
      // keep collections empty
    }
  }

  if (collections.length === 0) {
    return NextResponse.json({ credentials: [], error: "No credential collections configured" }, { status: 200 });
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "1",
        method: "getAssetsByOwner",
        params: { ownerAddress: wallet, page: 1, limit: 100 },
      }),
    });
    const data = (await response.json()) as GetAssetsByOwnerResponse;
    if (data.error || !data.result?.items) {
      return NextResponse.json({ credentials: [], error: data.error?.message ?? "DAS request failed" }, { status: 200 });
    }
    const credentials = data.result.items
      .filter((item) =>
        item.grouping?.some((g) => g.group_key === "collection" && collections.includes(g.group_value))
      )
      .map(assetToCredentialInfo);
    return NextResponse.json({ credentials });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Request failed";
    return NextResponse.json({ credentials: [], error: msg }, { status: 200 });
  }
}
