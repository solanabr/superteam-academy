import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import { require_admin_role } from "@/lib/api/guard";
import { json_error, json_ok } from "@/lib/api/response";
import { db } from "@/lib/db";
import { admin_logs, users } from "@/lib/db/schema";

export async function DELETE(request: NextRequest): Promise<Response> {
  const result = await require_admin_role();
  if (result.response) return result.response;

  const url = new URL(request.url);
  const user_id = url.searchParams.get("user_id");
  if (!user_id) return json_error("user_id required", 400);

  const [user] = await db.select().from(users).where(eq(users.id, user_id)).limit(1);
  if (!user) {
    return json_error("User not found", 404);
  }

  if (user.deleted_at) {
    return json_ok({ ok: true });
  }

  const now = new Date();

  await db
    .update(users)
    .set({ deleted_at: now, updated_at: now })
    .where(eq(users.id, user_id));

  await db.insert(admin_logs).values({
    admin_id: result.session.sub,
    action: "soft_delete_user",
    target_type: "user",
    target_id: user_id,
    metadata: {
      email: user.email,
    },
  });

  return json_ok({ ok: true });
}

