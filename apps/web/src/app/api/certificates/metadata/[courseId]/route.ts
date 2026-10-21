import type { NextRequest } from "next/server";
import { courseCollectionMetadataResponse } from "@/lib/metadata/serve";

/**
 * A course's credential collection metadata. The per-credential documents
 * stay on `../route.ts` (`?id=<nft_metadata uuid>`).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;
  return courseCollectionMetadataResponse(courseId);
}
