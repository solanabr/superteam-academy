import { NextRequest, NextResponse } from "next/server";

/**
 * Proxies credential metadata JSON fetch to avoid CORS when the client needs
 * to resolve image from the on-chain metadata URI (e.g. Pinata/IPFS).
 * GET /api/credential-metadata?uri=https://...
 */
export async function GET(request: NextRequest) {
  const uri = request.nextUrl.searchParams.get("uri");
  if (!uri || !uri.startsWith("http")) {
    return NextResponse.json({ error: "Missing or invalid uri" }, { status: 400 });
  }

  try {
    const res = await fetch(uri, { next: { revalidate: 60 } });
    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream returned ${res.status}` },
        { status: res.status === 404 ? 404 : 502 }
      );
    }
    const json = (await res.json()) as Record<string, unknown>;
    return NextResponse.json(json);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Fetch failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
