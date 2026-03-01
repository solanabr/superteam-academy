import { NextRequest, NextResponse } from "next/server";
import { communityService } from "@/services/community";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const likers = await communityService.getLikers(id);
  return NextResponse.json(likers);
}
