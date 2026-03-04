import { NextRequest, NextResponse } from "next/server";
import { supabaseRest } from "@/lib/backend/server-supabase";
import { ensureUser } from "@/lib/backend/server-utils";

type VisibilityRow = {
  learner_id: string;
  is_public: boolean;
  updated_at: string;
};

function normalize(row: VisibilityRow | null, learnerId: string) {
  return {
    learnerId,
    isPublic: row?.is_public ?? true,
    updatedAt: row?.updated_at ?? new Date().toISOString(),
  };
}

export async function GET(request: NextRequest) {
  const learnerId = request.nextUrl.searchParams.get("learnerId");
  if (!learnerId) {
    return NextResponse.json({ learnerId: "", isPublic: true, updatedAt: new Date().toISOString() }, { status: 400 });
  }
  if (!supabaseRest.hasConfig()) {
    return NextResponse.json({ learnerId, isPublic: true, updatedAt: new Date().toISOString() });
  }

  const row =
    (
      await supabaseRest.select<VisibilityRow>({
        table: "academy_profile_visibility",
        select: "learner_id,is_public,updated_at",
        filters: { learner_id: `eq.${learnerId}` },
        limit: 1,
      })
    )?.[0] ?? null;

  return NextResponse.json(normalize(row, learnerId));
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { learnerId?: string; isPublic?: boolean };
  if (!body.learnerId || typeof body.isPublic !== "boolean") {
    return NextResponse.json({ error: "learnerId and isPublic are required" }, { status: 400 });
  }
  if (!supabaseRest.hasConfig()) {
    return NextResponse.json({
      learnerId: body.learnerId,
      isPublic: body.isPublic,
      updatedAt: new Date().toISOString(),
    });
  }

  await ensureUser(body.learnerId);
  const rows = await supabaseRest.upsert<VisibilityRow>(
    "academy_profile_visibility",
    {
      learner_id: body.learnerId,
      is_public: body.isPublic,
      updated_at: new Date().toISOString(),
    },
    "learner_id",
  );

  return NextResponse.json(normalize(rows?.[0] ?? null, body.learnerId));
}

