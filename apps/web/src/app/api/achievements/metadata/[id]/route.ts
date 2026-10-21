import type { NextRequest } from "next/server";
import { achievementMetadataResponse } from "@/lib/metadata/serve";

/**
 * Achievement type metadata. `award_achievement` copies the type's URI into
 * every achievement NFT, and a type can't be updated on-chain, so this path is
 * permanent once an achievement type is created.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return achievementMetadataResponse(id);
}
