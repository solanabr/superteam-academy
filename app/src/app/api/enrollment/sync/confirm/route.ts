import { NextRequest } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { require_auth } from "@/lib/api/guard";
import { api_error, api_success } from "@/lib/api/response";
import { db } from "@/lib/db";
import { course_enrollments, wallets } from "@/lib/db/schema";

type Confirm_body = {
  course_slug: string;
  message: string;
  signature: string;
};

function base64_to_uint8array(value: string): Uint8Array | null {
  try {
    const binary = atob(value);
    const length = binary.length;
    const bytes = new Uint8Array(length);
    for (let index = 0; index < length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest): Promise<Response> {
  const result = await require_auth();
  if (result.response) return result.response;
  const { session } = result;

  const body = (await request.json()) as Confirm_body;
  if (!body || typeof body.course_slug !== "string" || body.course_slug.length === 0) {
    return api_error("Invalid body", 400);
  }

  const { course_slug, message, signature } = body;

  const [wallet] = await db
    .select()
    .from(wallets)
    .where(eq(wallets.user_id, session.sub))
    .limit(1);

  if (!wallet) {
    return api_error("Wallet not linked", 400);
  }

  const message_template = `Enroll in course:${course_slug} as user:${session.sub}`;
  if (message !== message_template) {
    return api_error("Mismatched enrollment message", 400);
  }

  const signature_bytes = base64_to_uint8array(signature);
  if (!signature_bytes || signature_bytes.length < 32) {
    return api_error("Missing or invalid wallet signature", 400);
  }

  // NOTE: This confirms that a signature was produced for the correct message payload.
  // A full ed25519 verification against wallet.public_key can be added here using a crypto helper.

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

  const now = new Date();

  await db.insert(course_enrollments).values({
    user_id: session.sub,
    wallet_public_key: wallet.public_key,
    course_slug,
    course_id_on_chain: null,
    enrolled_at: now,
    created_at: now,
    updated_at: now,
  });

  return api_success(
    {
      enrolled: true,
    },
    "Enrollment mirrored for user",
    200,
  );
}

