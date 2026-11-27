import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/types";
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

export const dynamic = "force-dynamic";

type EventUpdate = Database["public"]["Tables"]["events"]["Update"];

/**
 * PATCH /api/admin/events/:id — edit an event. Any of `{ description,
 * startsAt, endsAt, code, name, xpReward }`; the window needs both ends.
 * `name` and `xpReward` are written into the on-chain achievement type, so
 * they are refused once the event is deployed.
 */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const auth = await adminGuard(req);
  if ("denied" in auth) return auth.denied;
  const { id } = await context.params;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return badRequest("Invalid JSON body");
  }

  const admin = createAdminClient();
  const { data: current } = await admin
    .from("events")
    .select("id, deployed_at")
    .eq("id", id)
    .maybeSingle();
  if (!current) {
    return NextResponse.json({ error: "notFound" }, { status: 404 });
  }

  const update: EventUpdate = {};
  if ("description" in body) {
    const r = parseDescription(body.description);
    if (!r.ok) return badRequest(r.error);
    update.description = r.value;
  }
  if ("startsAt" in body || "endsAt" in body) {
    const r = parseWindow(body.startsAt, body.endsAt);
    if (!r.ok) return badRequest(r.error);
    update.starts_at = r.value.startsAt;
    update.ends_at = r.value.endsAt;
  }
  if ("code" in body) {
    const r = parseCode(body.code);
    if (!r.ok) return badRequest(r.error);
    update.code = r.value;
  }
  if ("name" in body || "xpReward" in body) {
    if (current.deployed_at) {
      return NextResponse.json({ error: "lockedOnChain" }, { status: 409 });
    }
    if ("name" in body) {
      const r = parseName(body.name);
      if (!r.ok) return badRequest(r.error);
      update.name = r.value;
    }
    if ("xpReward" in body) {
      const r = parseXp(body.xpReward);
      if (!r.ok) return badRequest(r.error);
      update.xp_reward = r.value;
    }
  }
  if (Object.keys(update).length === 0) return badRequest("Nothing to update");

  let query = admin.from("events").update(update).eq("id", id);
  // Re-checked in the write itself: a deploy that lands between the read
  // above and this update must still lock name and XP.
  if ("name" in update || "xp_reward" in update) {
    query = query.is("deployed_at", null);
  }
  const { data, error } = await query.select(EVENT_COLUMNS).maybeSingle();
  if (error) {
    if (isCodeTaken(error)) {
      return NextResponse.json({ error: "codeTaken" }, { status: 409 });
    }
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "lockedOnChain" }, { status: 409 });
  }

  const { count } = await admin
    .from("event_attendances")
    .select("id", { count: "exact", head: true })
    .eq("event_id", id);
  return NextResponse.json({ event: toAdminEvent(data, count ?? 0) });
}
