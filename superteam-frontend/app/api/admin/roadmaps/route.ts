import { NextResponse } from "next/server";
import { checkPermission } from "@/lib/server/admin-auth";
import { getAllRoadmaps, upsertRoadmap } from "@/lib/server/admin-store";
import type { RoadmapDef } from "@/lib/roadmaps/types";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET() {
  const user = await checkPermission("roadmaps.read");
  if (!user) return unauthorized();
  return NextResponse.json(getAllRoadmaps());
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
  upsertRoadmap(body);
  return NextResponse.json(body, { status: 201 });
}
