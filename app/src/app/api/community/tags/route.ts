import { NextResponse } from "next/server";
import { communityService } from "@/services/community";

export async function GET() {
  const tags = await communityService.getDistinctTags();
  return NextResponse.json(tags);
}
