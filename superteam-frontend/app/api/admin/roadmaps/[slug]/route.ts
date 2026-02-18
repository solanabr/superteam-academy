import { NextResponse } from "next/server";
import { checkPermission } from "@/lib/server/admin-auth";
import {
  getRoadmapBySlug,
  upsertRoadmap,
  deleteRoadmap,
} from "@/lib/server/admin-store";
import type { RoadmapDef } from "@/lib/roadmaps/types";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

type Params = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: Params) {
  const user = await checkPermission("roadmaps.read");
  if (!user) return unauthorized();
  const { slug } = await params;
  const roadmap = await getRoadmapBySlug(slug);
  if (!roadmap) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(roadmap);
}

export async function PUT(request: Request, { params }: Params) {
  const user = await checkPermission("roadmaps.write");
  if (!user) return unauthorized();
  const { slug } = await params;
  const body = (await request.json()) as RoadmapDef;
  body.slug = slug;
  await upsertRoadmap(body);
  return NextResponse.json(body);
}

export async function DELETE(_request: Request, { params }: Params) {
  const user = await checkPermission("roadmaps.write");
  if (!user) return unauthorized();
  const { slug } = await params;
  const deleted = await deleteRoadmap(slug);
  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
