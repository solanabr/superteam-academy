import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { checkPermission } from "@/lib/server/admin-auth";
import { getAllRoadmaps, upsertRoadmap } from "@/lib/server/admin-store";
import { CacheTags } from "@/lib/server/cache-tags";
import type { RoadmapDef } from "@/lib/roadmaps/types";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET() {
  const user = await checkPermission("roadmaps.read");
  if (!user) return unauthorized();
  return NextResponse.json(await getAllRoadmaps());
}

export async function POST(request: Request) {
  const user = await checkPermission("roadmaps.write");
  if (!user) return unauthorized();
  const body = (await request.json()) as RoadmapDef;
  if (!body.slug || !body.title) {
    return NextResponse.json(
      { error: "slug and title are required" },
      { status: 400 },
    );
  }
  await upsertRoadmap(body);
  revalidateTag(CacheTags.ROADMAPS, "max");
  return NextResponse.json(body, { status: 201 });
}
