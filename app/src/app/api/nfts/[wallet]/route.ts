import { NextRequest, NextResponse } from "next/server";

// Superteam Academy collection/creator addresses for filtering
// Replace with actual addresses once cNFT minting is deployed
const ACADEMY_CREATORS: string[] = [];

interface HeliusAsset {
  id: string;
  content: {
    metadata: {
      name: string;
      symbol: string;
    };
    json_uri: string;
    links?: {
      image?: string;
    };
  };
  authorities: { address: string }[];
  compression?: {
    compressed: boolean;
    tree: string;
    leaf_index: number;
  };
  grouping?: { group_key: string; group_value: string }[];
  ownership: {
    owner: string;
  };
  created_at?: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ wallet: string }> }
) {
  const { wallet } = await params;
  const apiKey = process.env.HELIUS_API_KEY;

  if (!apiKey) {
    // Gracefully return empty when no API key is configured
    return NextResponse.json({ certificates: [], total: 0 });
  }

  // Basic wallet address validation (Solana base58, 32-44 chars)
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(wallet)) {
    return NextResponse.json(
      { error: "Invalid wallet address" },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(
      `https://devnet.helius-rpc.com/?api-key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: "superteam-nfts",
          method: "getAssetsByOwner",
          params: {
            ownerAddress: wallet,
            page: 1,
            limit: 50,
            displayOptions: {
              showCollectionMetadata: true,
            },
          },
        }),
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Helius API request failed" },
        { status: response.status }
      );
    }

    const data = await response.json();
    const assets: HeliusAsset[] = data.result?.items || [];

    // Filter to only Superteam Academy certificates
    // When ACADEMY_CREATORS is empty, return all NFTs (useful during dev)
    const filtered =
      ACADEMY_CREATORS.length > 0
        ? assets.filter(
            (asset) =>
              asset.authorities?.some((auth) =>
                ACADEMY_CREATORS.includes(auth.address)
              ) ||
              asset.grouping?.some(
                (group) =>
                  group.group_key === "collection" &&
                  ACADEMY_CREATORS.includes(group.group_value)
              )
          )
        : assets;

    // Transform to a clean response shape
    const certificates = filtered.map((asset) => ({
      mintAddress: asset.id,
      name: asset.content?.metadata?.name || "Superteam Certificate",
      symbol: asset.content?.metadata?.symbol || "STA",
      image: asset.content?.links?.image || null,
      metadataUri: asset.content?.json_uri || null,
      isCompressed: asset.compression?.compressed || false,
      createdAt: asset.created_at || null,
    }));

    return NextResponse.json({ certificates, total: certificates.length });
  } catch (error) {
    console.error("Helius API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch NFTs" },
      { status: 500 }
    );
  }
}
