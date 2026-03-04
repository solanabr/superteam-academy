import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import { require_admin_role } from "@/lib/api/guard";
import { json_error, json_ok } from "@/lib/api/response";
import { admin_role_body_schema } from "@/lib/validators/admin";
import { db } from "@/lib/db";
import { admin_logs, users } from "@/lib/db/schema";

export async function PATCH(request: NextRequest): Promise<Response> {
  const result = await require_admin_role();
  if (result.response) return result.response;

  const body = await request.json();
  const parsed = admin_role_body_schema.safeParse(body);
  if (!parsed.success) return json_error("Invalid body", 400);

  const { user_id, role } = parsed.data;

  const [user] = await db.select().from(users).where(eq(users.id, user_id)).limit(1);
  if (!user) {
    return json_error("User not found", 404);
  }

  if (user.role === role) {
    return json_ok({ ok: true });
  }

  await db
    .update(users)
    .set({ role, updated_at: new Date() })
    .where(eq(users.id, user_id));

  await db.insert(admin_logs).values({
    admin_id: result.session.sub,
    action: "update_role",
    target_type: "user",
    target_id: user_id,
    metadata: {
      previous_role: user.role,
      new_role: role,
    },
  });

  return json_ok({ ok: true });
}

