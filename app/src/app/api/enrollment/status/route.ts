import { NextRequest } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { require_auth } from "@/lib/api/guard";
import { api_error, api_success } from "@/lib/api/response";
import { enrollment_status_query_schema } from "@/lib/validators/enrollment";
import { db } from "@/lib/db";
import { course_enrollments, wallets } from "@/lib/db/schema";
import { get_enrollment_status } from "@/lib/services/blockchain-service";

export async function GET(request: NextRequest): Promise<Response> {
  const result = await require_auth();
  if (result.response) return result.response;
  const { session } = result;

  const url = new URL(request.url);
  const course_slug = url.searchParams.get("course_slug") ?? "";
  const parsed = enrollment_status_query_schema.safeParse({ course_slug });
  if (!parsed.success) return api_error("Invalid query", 400);

  const [wallet] = await db
    .select()
    .from(wallets)
    .where(eq(wallets.user_id, session.sub))
    .limit(1);

  if (!wallet) {
    return api_success(
      {
        enrolled: false,
        source: "none",
      },
      "No linked wallet",
      200,
    );
  }

  const [mirror_row] = await db
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

  if (mirror_row) {
    return api_success(
      {
        enrolled: true,
        source: "db",
      },
      "Enrollment found in mirror table",
      200,
    );
  }

  const on_chain_enrolled = await get_enrollment_status(wallet.public_key, course_slug);

  return api_success(
    {
      enrolled: on_chain_enrolled,
      source: on_chain_enrolled ? "on_chain" : "none",
    },
    "Enrollment status resolved",
    200,
  );
}
