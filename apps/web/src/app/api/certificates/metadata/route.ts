import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logError } from "@/lib/logging";
import { ERROR_IDS } from "@/constants/errorIds";

const CACHE_HEADERS = {
  "Cache-Control": "public, max-age=31536000, immutable",
};

/**
 * Serves NFT metadata JSON for Metaplex Token Metadata.
 *
 * Supports two modes:
 *   1. `?id=<uuid>` — reads metadata from the `nft_metadata` table (primary)
 *   2. `?data=<url-encoded-json>` — legacy inline mode (kept for old mints)
 */
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  const data = request.nextUrl.searchParams.get("data");

  // ── Mode 1: read from DB by ID ──────────────────────────────────────
  if (id) {
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
      return NextResponse.json(
        { error: "Metadata not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(row.data, { headers: CACHE_HEADERS });
  }

  // ── Mode 2: legacy inline JSON ──────────────────────────────────────
  if (data) {
    try {
      const metadata: unknown = JSON.parse(decodeURIComponent(data));

      if (
        typeof metadata !== "object" ||
        metadata === null ||
        !("name" in metadata)
      ) {
        return NextResponse.json(
          { error: "Invalid metadata format" },
          { status: 400 }
        );
      }

      return NextResponse.json(metadata, { headers: CACHE_HEADERS });
    } catch (err: unknown) {
      logError({
        errorId: ERROR_IDS.CERTIFICATE_METADATA_FAILED,
        error: err instanceof Error ? err : new Error(String(err)),
        context: { route: "/api/certificates/metadata", mode: "legacy-inline" },
      });
      return NextResponse.json(
        { error: "Invalid data parameter" },
        { status: 400 }
      );
    }
  }

  return NextResponse.json(
    { error: "Missing id or data parameter" },
    { status: 400 }
  );
}
