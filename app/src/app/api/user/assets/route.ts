import { NextResponse } from "next/server";

const HELIUS_RPC = `https://devnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`;

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get("wallet");

  if (!wallet) return NextResponse.json([]);

  try {
    const response = await fetch(HELIUS_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "my-id",
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
    });

    const { result } = await response.json();
    
    // Фильтруем (можно добавить проверку по коллекции, если нужно)
    // Но пока возвращаем всё, что похоже на наши сертификаты (можно фильтровать по имени)
    const items = result.items.map((item: any) => ({
        id: item.id,
        name: item.content?.metadata?.name || "Unknown",
        image: item.content?.links?.image || item.content?.files?.[0]?.uri,
        description: item.content?.metadata?.description,
        attributes: item.content?.metadata?.attributes || []
    }));

    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json([]);
  }
}