import { NextRequest } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { require_auth } from "@/lib/api/guard";
import { api_error, api_success } from "@/lib/api/response";
import { enrollment_sync_body_schema } from "@/lib/validators/enrollment";
import { db } from "@/lib/db";
import { course_enrollments, wallets } from "@/lib/db/schema";

export async function POST(request: NextRequest): Promise<Response> {
  const result = await require_auth();
  if (result.response) return result.response;
  const { session } = result;

  const body = await request.json();
  const parsed = enrollment_sync_body_schema.safeParse(body);
  if (!parsed.success) return api_error("Invalid body", 400);

  const { course_slug } = parsed.data;

  const [wallet] = await db
    .select()
    .from(wallets)
    .where(eq(wallets.user_id, session.sub))
    .limit(1);

  if (!wallet) {
    return api_error("Wallet not linked", 400);
  }

  const [existing] = await db
    .select()
    .from(course_enrollments)
    .where(
      and(
        eq(course_enrollments.user_id, session.sub),
        eq(course_enrollments.course_slug, course_slug),
        isNull(course_enrollments.closed_at),
      ),
    )
    .limit(1);

  if (existing) {
    return api_success(
      {
        already_enrolled: true,
      },
      "Enrollment already mirrored",
      200,
    );
  }

  const message = `Enroll in course:${course_slug} as user:${session.sub}`;

  return api_success(
    {
      message,
    },
    "Sign this message with your wallet to enroll. Submit signature to /api/enrollment/sync/confirm.",
    200,
  );
}
