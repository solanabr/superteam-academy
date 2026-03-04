import { NextRequest, NextResponse } from "next/server";
import { supabaseRest } from "@/lib/backend/server-supabase";
import { ensureUser } from "@/lib/backend/server-utils";

type EnrollmentRow = {
  learner_id: string;
  course_id: string;
  tx_signature: string | null;
  source: string;
  enrolled_at: string;
};
type UserRow = {
  learner_id: string;
  wallet_address: string | null;
};

export async function GET(request: NextRequest) {
  const learnerId = request.nextUrl.searchParams.get("learnerId");
  const courseId = request.nextUrl.searchParams.get("courseId");
  if (!learnerId || !courseId) {
    return NextResponse.json({ enrolled: false }, { status: 400 });
  }

  if (!supabaseRest.hasConfig()) {
    return NextResponse.json({ enrolled: false, enrollment: null });
  }

  const rows = await supabaseRest.select<EnrollmentRow>({
    table: "academy_enrollments",
    select: "learner_id,course_id,tx_signature,source,enrolled_at",
    filters: {
      learner_id: `eq.${learnerId}`,
      course_id: `eq.${courseId}`,
    },
    limit: 1,
  });

  const enrollment = rows?.[0];
  return NextResponse.json({
    enrolled: Boolean(enrollment),
    enrollment: enrollment
      ? {
          learnerId: enrollment.learner_id,
          courseId: enrollment.course_id,
          signature: enrollment.tx_signature ?? undefined,
          source: enrollment.source,
          enrolledAt: enrollment.enrolled_at,
        }
      : null,
  });
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    learnerId?: string;
    courseId?: string;
    signature?: string;
    source?: string;
  };
  if (!body.learnerId || !body.courseId) {
    return NextResponse.json({ ok: false, error: "learnerId and courseId are required" }, { status: 400 });
  }

  if (!supabaseRest.hasConfig()) {
    return NextResponse.json({
      ok: true,
      enrollment: {
        learnerId: body.learnerId,
        courseId: body.courseId,
        signature: body.signature,
        source: body.source ?? "wallet",
        enrolledAt: new Date().toISOString(),
      },
    });
  }

  const userRows = await supabaseRest.select<UserRow>({
    table: "academy_users",
    select: "learner_id,wallet_address",
    filters: {
      learner_id: `eq.${body.learnerId}`,
    },
    limit: 1,
  });
  const linkedWallet = userRows?.[0]?.wallet_address ?? null;
  if (!linkedWallet) {
    return NextResponse.json(
      { ok: false, error: "wallet link required before enrollment" },
      { status: 400 },
    );
  }

  await ensureUser(body.learnerId);
  const rows = await supabaseRest.upsert<EnrollmentRow>(
    "academy_enrollments",
    {
      learner_id: body.learnerId,
      course_id: body.courseId,
      tx_signature: body.signature ?? null,
      source: body.source ?? "wallet",
      enrolled_at: new Date().toISOString(),
    },
    "learner_id,course_id",
  );

  await supabaseRest.insert("academy_activity_feed", {
    learner_id: body.learnerId,
    event_type: "course_enrolled",
    course_id: body.courseId,
    payload: { signature: body.signature ?? null },
  });

  const enrollment = rows?.[0];
  return NextResponse.json({
    ok: true,
    enrollment: {
      learnerId: enrollment?.learner_id ?? body.learnerId,
      courseId: enrollment?.course_id ?? body.courseId,
      signature: enrollment?.tx_signature ?? body.signature,
      source: enrollment?.source ?? body.source ?? "wallet",
      enrolledAt: enrollment?.enrolled_at ?? new Date().toISOString(),
    },
  });
}
