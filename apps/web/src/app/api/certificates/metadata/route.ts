import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const CACHE_HEADERS = {
  "Cache-Control": "public, max-age=31536000, immutable",
};

/**
 * Serves NFT metadata JSON for Metaplex Core credentials.
 *
 * `?id=<uuid>` — reads metadata from the `nft_metadata` table
 */
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "Missing id parameter" },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("nft_metadata")
    .select("data")
    .eq("id", id)
    .single();

  if (error) {
    // PGRST116 = .single() returned zero rows → genuine 404
    if (error.code === "PGRST116") {
      return NextResponse.json(
        { error: "Metadata not found" },
        { status: 404 }
      );
    }
    console.error("[certificates/metadata] DB error:", error.message);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }

  if (!row) {
    return NextResponse.json({ error: "Metadata not found" }, { status: 404 });
  }

  return NextResponse.json(row.data, { headers: CACHE_HEADERS });
}
