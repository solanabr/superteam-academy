import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { eventAchievementId, generateEventCode } from "@/lib/events/events";
import {
  EVENT_COLUMNS,
  adminGuard,
  badRequest,
  isCodeTaken,
  parseCode,
  parseDescription,
  parseName,
  parseWindow,
  parseXp,
  toAdminEvent,
} from "@/lib/events/admin";

// Reads the admin cookie + service-role DB — never statically prerender.
export const dynamic = "force-dynamic";

/** GET /api/admin/events — every event, newest first, with its attendee count. */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = await adminGuard(req);
  if ("denied" in auth) return auth.denied;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("events")
    .select(EVENT_COLUMNS)
    .order("starts_at", { ascending: false });
  if (error) {
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }

  const rows = data ?? [];
  const counts = await Promise.all(
    rows.map(async (row) => {
      const { count } = await admin
        .from("event_attendances")
        .select("id", { count: "exact", head: true })
        .eq("event_id", row.id);
      return count ?? 0;
    })
  );

  return NextResponse.json({
    events: rows.map((row, i) => toAdminEvent(row, counts[i] ?? 0)),
  });
}

/**
 * POST /api/admin/events — create an event. Body: `{ name, description,
 * xpReward, startsAt, endsAt, code? }`. A blank code gets a generated one. The
 * event is not on-chain yet: deploy it from its row before anyone can redeem.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth = await adminGuard(req);
  if ("denied" in auth) return auth.denied;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return badRequest("Invalid JSON body");
  }

  const name = parseName(body.name);
  if (!name.ok) return badRequest(name.error);
  const description = parseDescription(body.description);
  if (!description.ok) return badRequest(description.error);
  const xp = parseXp(body.xpReward);
  if (!xp.ok) return badRequest(xp.error);
  const window = parseWindow(body.startsAt, body.endsAt);
  if (!window.ok) return badRequest(window.error);
  const typedCode = typeof body.code === "string" && body.code.trim() !== "";
  const code = typedCode
    ? parseCode(body.code)
    : { ok: true as const, value: generateEventCode() };
  if (!code.ok) return badRequest(code.error);

  const { data, error } = await createAdminClient()
    .from("events")
    .insert({
      achievement_id: eventAchievementId(name.value),
      name: name.value,
      description: description.value,
      xp_reward: xp.value,
      code: code.value,
      starts_at: window.value.startsAt,
      ends_at: window.value.endsAt,
      created_by: auth.userId,
    })
    .select(EVENT_COLUMNS)
    .single();

  if (error) {
    if (isCodeTaken(error)) {
      return NextResponse.json({ error: "codeTaken" }, { status: 409 });
    }
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
  return NextResponse.json({ event: toAdminEvent(data, 0) }, { status: 201 });
}
