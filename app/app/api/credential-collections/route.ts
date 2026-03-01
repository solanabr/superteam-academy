import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:3001";
const API_TOKEN = process.env.BACKEND_API_TOKEN ?? "";

export async function GET() {
  if (!API_TOKEN) {
    return NextResponse.json(
      { error: "Server misconfigured: missing API token", collections: {}, list: [] },
      { status: 200 }
    );
  }
  try {
    const res = await fetch(
      `${BACKEND_URL.replace(/\/$/, "")}/v1/academy/credential-collections`,
      {
        method: "GET",
        headers: { "X-API-Key": API_TOKEN },
        cache: "no-store",
      }
    );
    const data = (await res.json().catch(() => ({}))) as {
      collections?: Record<string, string>;
      list?: Array<{
        trackId: number;
        collectionAddress: string;
        name: string | null;
        imageUrl: string | null;
        metadataUri: string | null;
      }>;
      error?: string;
    };
    if (!res.ok) {
      return NextResponse.json(
        { collections: {}, list: [], error: data.error ?? res.statusText },
        { status: 200 }
      );
    }
    return NextResponse.json({
      collections: data.collections ?? {},
      list: data.list ?? [],
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Request failed";
    return NextResponse.json({ collections: {}, list: [], error: msg }, { status: 200 });
  }
}
